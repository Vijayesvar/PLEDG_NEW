import { expect } from "chai";
import { ethers } from "hardhat";
import { keccak256, AbiCoder, zeroPadValue } from "ethers";
import { network } from "hardhat";
import { Block, Contract, ContractFactory, Signer } from "ethers";
import { Pledg, PriceOracle, MockERC20 } from "../typechain-types";

describe("Pledg Platform", function () {
  let pledg: Pledg;
  let priceOracle: PriceOracle;
  let mockToken: MockERC20;
  let owner: Signer;
  let borrower: Signer;
  let lender: Signer;
  let user3: Signer;

  // Adjusted loan amount to work with PriceOracle default fallback price
  // Default price: $3000 USD = ₹256,590 INR per token
  // For 1 token collateral with 60% LTV: max loan = 256,590 * 0.6 = ₹153,954
  // Contract limits: MIN_LOAN_AMOUNT = 500 INR, MAX_LOAN_AMOUNT = 5000 INR
  // Using ₹3000 loan amount which is within contract limits
  const LOAN_AMOUNT = ethers.parseEther("3000"); // ₹3,000
  const COLLATERAL_AMOUNT = ethers.parseEther("1"); // 1 WETH
  const INTEREST_RATE = 1200; // 12% annual
  const LTV = 60; // 60%
  const DURATION = 90 * 24 * 60 * 60; // 90 days in seconds

  beforeEach(async function () {
    [owner, borrower, lender, user3] = await ethers.getSigners();

    // Deploy mock ERC20 token
    const MockToken = await ethers.getContractFactory("MockERC20");
    mockToken = await MockToken.deploy("Mock WETH", "WETH") as MockERC20;

    // Deploy Price Oracle
    const PriceOracle = await ethers.getContractFactory("PriceOracle");
    priceOracle = await PriceOracle.deploy() as PriceOracle;

    // Deploy Pledg
    const Pledg = await ethers.getContractFactory("Pledg");
    pledg = await Pledg.deploy(await priceOracle.getAddress());

    // Setup: Add mock token as supported and mint tokens to borrower
    await pledg.addSupportedToken(await mockToken.getAddress());
    await mockToken.mint(await borrower.getAddress(), COLLATERAL_AMOUNT);

    // Authorize the borrower
    await pledg.connect(owner).authorizeBorrower(await borrower.getAddress());
    
    // Approve tokens for the borrower
    await mockToken.connect(borrower).approve(await pledg.getAddress(), COLLATERAL_AMOUNT);
  });

  describe("Deployment", function () {
    it("Should deploy with correct initial state", async function () {
      expect(await pledg.getLoanCount()).to.equal(0);
      expect(await pledg.owner()).to.equal(await owner.getAddress());
      expect(await pledg.priceOracle()).to.equal(await priceOracle.getAddress());
    });

    it("Should have correct constants", async function () {
      expect(await pledg.MIN_LOAN_AMOUNT()).to.equal(ethers.parseEther("500"));
      expect(await pledg.MAX_LOAN_AMOUNT()).to.equal(ethers.parseEther("5000"));
      expect(await pledg.MAX_LTV()).to.equal(60);
      expect(await pledg.GRACE_PERIOD()).to.equal(259200); // 3 days
      expect(await pledg.MIN_LOAN_DURATION()).to.equal(2592000); // 30 days
      expect(await pledg.MAX_LOAN_DURATION()).to.equal(15552000); // 180 days
      expect(await pledg.INSTALLMENT_PERIOD()).to.equal(2592000); // 30 days
      expect(await pledg.MAX_INTEREST_RATE()).to.equal(5000);
      expect(await pledg.INTEREST_RATE_DIVISOR()).to.equal(10000);
    });
  });

  describe("Loan Creation", function () {
    it("Should create a loan successfully", async function () {
      const tx = await pledg.connect(borrower).createLoan(
        0,
        LOAN_AMOUNT,
        INTEREST_RATE,
        LTV,
        DURATION,
        await mockToken.getAddress(),
        COLLATERAL_AMOUNT
      );

      const receipt = await tx.wait();
      const event = receipt?.logs.find((log: any) => 
        log.fragment?.name === "LoanCreated"
      );

      expect(event).to.not.be.undefined;
      expect(await pledg.getLoanCount()).to.equal(1);
    });

    it("Should fail with invalid loan amount", async function () {
      await expect(
        pledg.connect(borrower).createLoan(
          0,
          ethers.parseEther("250"),
          INTEREST_RATE,
          LTV,
          DURATION,
          await mockToken.getAddress(),
          COLLATERAL_AMOUNT
        )
      ).to.be.revertedWith("Invalid loan amount");
    });

    it("Should fail with unsupported token", async function () {
      await expect(
        pledg.connect(borrower).createLoan(
          0,
          LOAN_AMOUNT,
          INTEREST_RATE,
          LTV,
          DURATION,
          await user3.getAddress(), // Random address
          COLLATERAL_AMOUNT
        )
      ).to.be.revertedWith("Unsupported collateral token");
    });

    it("Should fail with insufficient collateral balance", async function () {
      await expect(
        pledg.connect(borrower).createLoan(
          0,
          LOAN_AMOUNT,
          INTEREST_RATE,
          LTV,
          DURATION,
          await mockToken.getAddress(),
          ethers.parseEther("2")
        )
      ).to.be.revertedWith("Insufficient collateral balance");
    });
  });

  describe("Borrower Authorization", function () {
    it("Should allow owner to authorize borrower", async function () {
      await pledg.connect(owner).authorizeBorrower(await user3.getAddress());
      expect(await pledg.authorizedBorrowers(await user3.getAddress())).to.be.true;
    });

    it("Should allow owner to revoke borrower authorization", async function () {
      await pledg.connect(owner).authorizeBorrower(await user3.getAddress());
      await pledg.connect(owner).revokeBorrowerAuthorization(await user3.getAddress());
      expect(await pledg.authorizedBorrowers(await user3.getAddress())).to.be.false;
    });

    it("Should prevent unauthorized borrower from creating loan", async function () {
      await expect(
        pledg.connect(user3).createLoan(
          1,
          LOAN_AMOUNT,
          INTEREST_RATE,
          LTV,
          DURATION,
          await mockToken.getAddress(),
          COLLATERAL_AMOUNT
        )
      ).to.be.revertedWith("Borrower not authorized");
    });

    it("Should prevent non-owner from authorizing borrowers", async function () {
      await expect(
        pledg.connect(borrower).authorizeBorrower(await user3.getAddress())
      ).to.be.revertedWithCustomError(pledg, "OwnableUnauthorizedAccount");
    });

    it("Should test PriceOracle with mock token", async function () {
      const price = await pledg.testPriceOracle(await mockToken.getAddress(), COLLATERAL_AMOUNT);
      expect(price).to.be.gt(0);
    });

    it("Should test PriceOracle directly", async function () {
      const price = await priceOracle.getTokenPriceInINR(await mockToken.getAddress(), COLLATERAL_AMOUNT);
      expect(price).to.be.gt(0);
    });
  });

  describe("Owner Functions", function () {
    it("Should allow owner to add supported token", async function () {
      const newToken = await (await ethers.getContractFactory("MockERC20")).deploy("New Token", "NEW") as MockERC20;
      
      await pledg.connect(owner).addSupportedToken(await newToken.getAddress());
      
      expect(await pledg.supportedTokens(await newToken.getAddress())).to.be.true;
    });

    it("Should allow owner to remove supported token", async function () {
      await pledg.connect(owner).removeSupportedToken(await mockToken.getAddress());
      
      expect(await pledg.supportedTokens(await mockToken.getAddress())).to.be.false;
    });

    it("Should allow owner to pause contract", async function () {
      await pledg.connect(owner).pause();
      
      expect(await pledg.paused()).to.be.true;
    });

    it("Should allow owner to unpause contract", async function () {
      await pledg.connect(owner).pause();
      await pledg.connect(owner).unpause();
      
      expect(await pledg.paused()).to.be.false;
    });

    it("Should allow owner to set new price oracle", async function () {
      const newPriceOracle = await (await ethers.getContractFactory("PriceOracle")).deploy() as PriceOracle;
      
      await pledg.connect(owner).setPriceOracle(await newPriceOracle.getAddress());
      
      expect(await pledg.priceOracle()).to.equal(await newPriceOracle.getAddress());
    });

    it("Should prevent non-owner from calling owner functions", async function () {
      const newToken = await (await ethers.getContractFactory("MockERC20")).deploy("New Token", "NEW") as MockERC20;
      
      await expect(
        pledg.connect(borrower).addSupportedToken(await newToken.getAddress())
      ).to.be.revertedWithCustomError(pledg, "OwnableUnauthorizedAccount");
    });
  });

  describe("Loan Funding", function () {
    beforeEach(async function () {
      await pledg.connect(borrower).createLoan(
        0,
        LOAN_AMOUNT,
        INTEREST_RATE,
        LTV,
        DURATION,
        await mockToken.getAddress(),
        COLLATERAL_AMOUNT
      );
      
      await mockToken.connect(borrower).approve(await pledg.getAddress(), COLLATERAL_AMOUNT);
    });

    it("Should fund loan successfully", async function () {
      const loanId = 0;
      
      const tx = await pledg.connect(owner).fundLoan(loanId);
      const receipt = await tx.wait();
      
      const event = receipt?.logs.find((log: any) => 
        log.fragment?.name === "LoanFunded"
      );

      expect(event).to.not.be.undefined;
      
      const loan = await pledg.loans(loanId);
      expect(loan.status).to.equal(2); // Funded status
    });

    it("Should fail if loan already funded", async function () {
      const loanId = 0;
      
      await pledg.connect(owner).fundLoan(loanId);
      
      await expect(
        pledg.connect(owner).fundLoan(loanId)
      ).to.be.revertedWith("Invalid loan status");
    });
  });

  describe("Loan Management", function () {
    beforeEach(async function () {
      await pledg.connect(borrower).createLoan(
        0,
        LOAN_AMOUNT,
        INTEREST_RATE,
        LTV,
        DURATION,
        await mockToken.getAddress(),
        COLLATERAL_AMOUNT
      );
      
      await mockToken.connect(borrower).approve(await pledg.getAddress(), COLLATERAL_AMOUNT);
      await pledg.connect(owner).fundLoan(0);
    });

    it("Should get loan information correctly", async function () {
      const loanId = 0;
      const loanInfo = await pledg.getLoan(loanId);
      
      expect(loanInfo[0]).to.equal(LOAN_AMOUNT); // amount
      expect(loanInfo[1]).to.equal(INTEREST_RATE); // interestRate
      expect(loanInfo[2]).to.equal(DURATION); // term
      expect(loanInfo[3]).to.equal(2); // status (Funded)
      expect(loanInfo[4]).to.equal(await borrower.getAddress()); // borrower
      expect(loanInfo[5]).to.equal(await mockToken.getAddress()); // mock token
      expect(loanInfo[6]).to.equal(COLLATERAL_AMOUNT); // collateralAmount
      expect(loanInfo[8]).to.equal(0); // totalPaid
      expect(loanInfo[9]).to.equal(0); // installmentsPaid
      expect(loanInfo[10]).to.equal(3); // totalInstallments
      // Calculate expected installmentAmount using the contract formula
      const loanAmountInr = LOAN_AMOUNT;
      const interestRate = BigInt(INTEREST_RATE);
      const INTEREST_RATE_DIVISOR = BigInt(10000);
      const totalInstallments = BigInt(loanInfo[10]);
      const numerator = loanAmountInr * (INTEREST_RATE_DIVISOR + interestRate);
      const denominator = INTEREST_RATE_DIVISOR * totalInstallments;
      const expectedInstallmentAmount = numerator / denominator;
      expect(loanInfo[11]).to.equal(expectedInstallmentAmount); // installmentAmount
      expect(loanInfo[14]).to.equal(0); // completedAt
      expect(loanInfo[15]).to.equal(0); // liquidationsLength
    });

    it("Should get user loans correctly", async function () {
      const borrowerLoans = await pledg.getLoansByUser(await borrower.getAddress());
      expect(borrowerLoans.length).to.equal(1);
      expect(borrowerLoans[0]).to.equal(0);
    });

    it("Should get active loans correctly", async function () {
      const activeLoans = await pledg.getActiveLoans();
      expect(activeLoans.length).to.equal(1);
      expect(activeLoans[0]).to.equal(0);
    });

    it("Should check canLiquidate eligibility", async function () {
      // Loan is in Funded state, should be ineligible unless LTV or default
      let [eligible, reason] = await pledg.canLiquidate(0);
      expect(eligible).to.be.false;
      expect(reason).to.be.equal("Loan not eligible for liquidation");
    });
  });

  describe("Two-Phase Liquidation", function () {
    beforeEach(async function () {
      await pledg.connect(borrower).createLoan(
        0,
        LOAN_AMOUNT,
        INTEREST_RATE,
        LTV,
        DURATION,
        await mockToken.getAddress(),
        COLLATERAL_AMOUNT
      );
      await mockToken.connect(borrower).approve(await pledg.getAddress(), COLLATERAL_AMOUNT);
      await pledg.connect(owner).fundLoan(0);
    });

    it("Should not liquidate when not applicable", async function () {
      let [eligible, reason] = await pledg.canLiquidate(0);
      expect(eligible).to.be.false;
      expect(reason).to.be.equal("Loan not eligible for liquidation");
    });

    it("Should not liquidate when not even a second before default", async function () {
      const loan = await pledg.getLoan(0);
      const nextDueDate = Number(loan[7]);
      const GRACE_PERIOD = 259200;
      await network.provider.send("evm_setNextBlockTimestamp", [nextDueDate + GRACE_PERIOD - 1]);
      await network.provider.send("evm_mine");
      let [eligible, reason] = await pledg.canLiquidate(0);
      expect(eligible).to.be.false;
      expect(reason).to.be.equal("Loan not eligible for liquidation");
    });

    it("Should initiate defaulted liquidation and confirm", async function () {
      let loan = await pledg.getLoan(0);
      const GRACE_PERIOD = 259200;
      // Make a payment to move to Repaying status
      const installmentAmount = loan[11];
      await pledg.connect(owner).makePayment(0, installmentAmount);
      loan = await pledg.getLoan(0);
      const nextDueDate = Number(loan[7]);
      await network.provider.send("evm_setNextBlockTimestamp", [nextDueDate + GRACE_PERIOD + 1]);
      await network.provider.send("evm_mine");
      let [eligible, reason] = await pledg.canLiquidate(0);
      expect(eligible).to.be.true;
      expect(reason).to.be.equal("Defaulted");
      // Initiate liquidation (dispatches to defaulted)
      const tx = await pledg.connect(owner).liquidate(0);
      const receipt = await tx.wait();
      // Check for DefaultLiquidationInitiated event
      const event = receipt?.logs.find((log: any) => 
        log.fragment?.name === "DefaultLiquidationInitiated"
      );
      expect(event).to.not.be.undefined;
      // Check pending liquidation exists
      const pendingLiquidation = await pledg.pendingLiquidations(0);
      expect(pendingLiquidation.exists).to.be.true;
      // Confirm defaulted liquidation
      const collateralAmount = pendingLiquidation.collateralAmount;
      await mockToken.connect(owner).approve(await pledg.getAddress(), collateralAmount);
      const actualTokenCost = collateralAmount; // Assume all used
      const confirmTx = await pledg.connect(owner).confirmDefaultLiquidation(0, actualTokenCost, 0);
      const confirmReceipt = await confirmTx.wait();
      const confirmEvent = confirmReceipt?.logs.find((log: any) => 
        log.fragment?.name === "DefaultLiquidationConfirmed"
      );
      expect(confirmEvent).to.not.be.undefined;
      const pendingAfter = await pledg.pendingLiquidations(0);
      expect(pendingAfter.exists).to.be.false;
    });

    it("Should initiate LTV liquidation and confirm", async function () {
      // Manipulate oracle or collateral to trigger LTV breach
      // For test, forcibly set collateralAmount to a low value
      let loan = await pledg.getLoan(0);
      // Simulate LTV breach by reducing collateralAmount
      const mappingSlot = 0; // 'loans' mapping is the first state variable
      const fieldOffset = 7; // 'collateralAmount' is the 8th field (0-based)
      const baseSlot = BigInt(keccak256(
        AbiCoder.defaultAbiCoder().encode([
          "uint256",
          "uint256"
        ], [0, mappingSlot])
      ));
      const collateralAmountSlot = "0x" + (baseSlot + BigInt(fieldOffset)).toString(16);
      await network.provider.send("hardhat_setStorageAt", [
        pledg.target,
        collateralAmountSlot,
        zeroPadValue("0x01", 32)
      ]);
      // Debug: print manipulated values
      const loanAfter = await pledg.getLoan(0);
      console.log("collateralAmount after manipulation:", loanAfter[6].toString());
      console.log("loan status after manipulation:", loanAfter[3].toString());
      const oraclePrice = await priceOracle.getTokenPriceInINR(await mockToken.getAddress(), loanAfter[6]);
      console.log("Oracle price for manipulated collateral:", oraclePrice.toString());
      const interestAmount = (loanAfter[0] * BigInt(loanAfter[1])) / 10000n;
      const totalOwed = ((loanAfter[0] + interestAmount) * 103n) / 100n;
      console.log("totalOwed:", totalOwed.toString());
      // Now canLiquidate should return LTV breach
      let [eligible, reason] = await pledg.canLiquidate(0);
      expect(eligible).to.be.true;
      expect(reason).to.be.equal("LTV breach");
      // Initiate liquidation (dispatches to LTV)
      const tx = await pledg.connect(owner).liquidate(0);
      const receipt = await tx.wait();
      // Check for LTVLiquidationInitiated event
      const event = receipt?.logs.find((log: any) => 
        log.fragment?.name === "LTVLiquidationInitiated"
      );
      expect(event).to.not.be.undefined;
      // Check pending liquidation exists
      const pendingLiquidation = await pledg.pendingLiquidations(0);
      expect(pendingLiquidation.exists).to.be.true;
      // Confirm LTV liquidation
      const collateralAmount = pendingLiquidation.collateralAmount;
      await mockToken.connect(owner).approve(await pledg.getAddress(), collateralAmount);
      const actualTokenCost = collateralAmount; // Assume all used
      const confirmTx = await pledg.connect(owner).confirmLTVLiquidation(0, actualTokenCost, 0);
      const confirmReceipt = await confirmTx.wait();
      const confirmEvent = confirmReceipt?.logs.find((log: any) => 
        log.fragment?.name === "LTVLiquidationConfirmed"
      );
      expect(confirmEvent).to.not.be.undefined;
      const pendingAfter = await pledg.pendingLiquidations(0);
      expect(pendingAfter.exists).to.be.false;
    });

    it("Should fail to initiate liquidation when already pending", async function () {
      let loan = await pledg.getLoan(0);
      const GRACE_PERIOD = 259200;
      const installmentAmount = loan[11];
      await pledg.connect(owner).makePayment(0, installmentAmount);
      loan = await pledg.getLoan(0);
      const nextDueDate = Number(loan[7]);
      await network.provider.send("evm_setNextBlockTimestamp", [nextDueDate + GRACE_PERIOD + 1]);
      await network.provider.send("evm_mine");
      await pledg.connect(owner).liquidate(0);
      await expect(
        pledg.connect(owner).liquidate(0)
      ).to.be.revertedWith("Liquidation already initiated");
    });

    it("Should fail to confirm defaulted liquidation when no pending liquidation", async function () {
      await expect(
        pledg.connect(owner).confirmDefaultLiquidation(0, ethers.parseEther("0.1"), 0)
      ).to.be.revertedWith("No pending liquidation");
    });

    it("Should fail to confirm LTV liquidation when no pending liquidation", async function () {
      await expect(
        pledg.connect(owner).confirmLTVLiquidation(0, ethers.parseEther("0.1"), 0)
      ).to.be.revertedWith("No pending liquidation");
    });

    it("Should fail to cancel liquidation when no pending liquidation", async function () {
      await expect(
        pledg.connect(owner).cancelLiquidation(0)
      ).to.be.revertedWith("No pending liquidation");
    });
  });

  describe("Loan Payments", function () {
    beforeEach(async function () {
      await pledg.connect(borrower).createLoan(
        0,
        LOAN_AMOUNT,
        INTEREST_RATE,
        LTV,
        DURATION,
        await mockToken.getAddress(),
        COLLATERAL_AMOUNT
      );
      await mockToken.connect(borrower).approve(await pledg.getAddress(), COLLATERAL_AMOUNT);
      await pledg.connect(owner).fundLoan(0);
    });

    it("Should make payment successfully", async function () {
      const loan = await pledg.getLoan(0);
      const installmentAmount = loan[11];
      
      const tx = await pledg.connect(owner).makePayment(0, installmentAmount);
      const receipt = await tx.wait();
      
      // Check for PaymentMade event
      const event = receipt?.logs.find((log: any) => 
        log.fragment?.name === "PaymentMade"
      );
      expect(event).to.not.be.undefined;
      
      // Check loan status changed to Repaying
      const updatedLoan = await pledg.getLoan(0);
      expect(updatedLoan[3]).to.equal(3); // Repaying status
      expect(updatedLoan[8]).to.equal(installmentAmount); // totalPaid
      expect(updatedLoan[9]).to.equal(1); // installmentsPaid
    });

    it("Should complete loan when fully paid", async function () {
      const loan = await pledg.getLoan(0);
      const totalInstallments = loan[10];
      const installmentAmount = loan[11];
      
      // Make all payments
      for (let i = 0; i < Number(totalInstallments); i++) {
        await pledg.connect(owner).makePayment(0, installmentAmount);
      }
      
      // Check loan is completed
      const completedLoan = await pledg.getLoan(0);
      expect(completedLoan[3]).to.equal(4); // Completed status
      expect(completedLoan[14]).to.be.gt(0); // completedAt timestamp
    });
  });

  describe("Default and LTV Checks", function () {
    beforeEach(async function () {
      await pledg.connect(borrower).createLoan(
        0,
        LOAN_AMOUNT,
        INTEREST_RATE,
        LTV,
        DURATION,
        await mockToken.getAddress(),
        COLLATERAL_AMOUNT
      );
      await mockToken.connect(borrower).approve(await pledg.getAddress(), COLLATERAL_AMOUNT);
      await pledg.connect(owner).fundLoan(0);
    });

    it("Should mark loan as defaulted", async function () {
      let loan = await pledg.getLoan(0);
      const GRACE_PERIOD = 259200;
      // Make a payment to move to Repaying status
      const installmentAmount = loan[11];
      await pledg.connect(owner).makePayment(0, installmentAmount);
      // Get updated due date after payment
      loan = await pledg.getLoan(0);
      const nextDueDate = Number(loan[7]);
      await network.provider.send("evm_setNextBlockTimestamp", [nextDueDate + GRACE_PERIOD + 1]);
      await network.provider.send("evm_mine");
      const tx = await pledg.connect(owner).markLoanAsDefaulted(0);
      const receipt = await tx.wait();
      // Check for LoanDefaulted event
      const event = receipt?.logs.find((log: any) => 
        log.fragment?.name === "LoanDefaulted"
      );
      expect(event).to.not.be.undefined;
    });

    it("Should check loan default status", async function () {
      let loan = await pledg.getLoan(0);
      const GRACE_PERIOD = 259200;
      // Make a payment to move to Repaying status
      const installmentAmount = loan[11];
      await pledg.connect(owner).makePayment(0, installmentAmount);
      // Get updated due date after payment
      loan = await pledg.getLoan(0);
      const nextDueDate = Number(loan[7]);
      // Before default
      let isDefaulted = await pledg.checkLoanDefault(0);
      expect(isDefaulted).to.be.false;
      // After default
      await network.provider.send("evm_setNextBlockTimestamp", [nextDueDate + GRACE_PERIOD + 1]);
      await network.provider.send("evm_mine");
      isDefaulted = await pledg.checkLoanDefault(0);
      expect(isDefaulted).to.be.true;
    });
  });

  describe("Admin Functions", function () {
    it("Should add/remove supported tokens", async function () {
      const tokenAddress = await user3.getAddress();
      
      await pledg.addSupportedToken(tokenAddress);
      expect(await pledg.supportedTokens(tokenAddress)).to.be.true;
      
      await pledg.removeSupportedToken(tokenAddress);
      expect(await pledg.supportedTokens(tokenAddress)).to.be.false;
    });

    it("Should pause/unpause contract", async function () {
      await pledg.pause();
      expect(await pledg.paused()).to.be.true;
      
      await pledg.unpause();
      expect(await pledg.paused()).to.be.false;
    });

    it("Should prevent non-owner from calling admin functions", async function () {
      await expect(
        pledg.connect(borrower).addSupportedToken(await user3.getAddress())
      ).to.be.revertedWithCustomError(pledg, "OwnableUnauthorizedAccount");
    });

    it("Should perform emergency withdrawal", async function () {
      const amount = ethers.parseEther("0.1");
      await mockToken.mint(await pledg.getAddress(), amount);
      
      const tx = await pledg.connect(owner).emergencyWithdraw(await mockToken.getAddress(), amount);
      const receipt = await tx.wait();
      
      // Check for EmergencyWithdraw event
      const event = receipt?.logs.find((log: any) => 
        log.fragment?.name === "EmergencyWithdraw"
      );
      expect(event).to.not.be.undefined;
    });
  });
}); 