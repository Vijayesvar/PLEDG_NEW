pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IPledg.sol";
import "../interfaces/IPriceOracle.sol";

contract Pledg is IPledg, ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;
    
    uint256 public constant MIN_LOAN_AMOUNT = 500 * 1e18;
    uint256 public constant MAX_LOAN_AMOUNT = 5000 * 1e18;
    
    uint256 public constant MAX_LTV = 60;
    // uint256 public constant LIQUIDATION_NOTIFICATION_THRESHOLD = 80;
    
    uint256 public constant GRACE_PERIOD = 3 days;
    uint256 public constant MIN_LOAN_DURATION = 30 days;
    uint256 public constant MAX_LOAN_DURATION = 180 days;
    uint256 public constant INSTALLMENT_PERIOD = 30 days;
    
    uint256 public constant MAX_INTEREST_RATE = 5000; // 50%
    uint256 public constant INTEREST_RATE_DIVISOR = 10000; // 100%
    uint256 public constant PERCENTAGE_DIVISOR = 100; // 100%

    uint256 private _loanCounter;
    IPriceOracle public priceOracle;
    
    // loanId => Loan
    mapping(uint256 => Loan) public loans;
    // user => loanIds
    mapping(address => uint256[]) public userLoans;
    // loanId => paymentEvents
    mapping(uint256 => PaymentEvent[]) public loanPayments;
    // token => isSupported
    mapping(address => bool) public supportedTokens;
    // loanId => pendingLiquidation
    mapping(uint256 => PendingLiquidation) public pendingLiquidations;

    struct LiquidationEvent {
        uint256 timestamp;
        uint256 amount;
    }

    struct PendingLiquidation {
        uint256 loanId;
        uint256 collateralAmount;
        uint256 timestamp;
        bool exists;
    }

    struct Loan {
        uint256 loanId;
        uint256 amount;
        uint256 interestRate;
        uint256 term; //durationInDays
        LoanStatus status;
        address borrower;
        address collateralToken;
        uint256 collateralAmount; //subject to reduce under liquidation
        uint256 collateralValueInINR; //on time of creation
        uint256 nextDueDate; //
        uint256 totalPaid;
        uint256 installmentsPaid;
        uint256 totalInstallments;
        uint256 installmentAmount;
        uint256 createdAt;
        uint256 fundedAt;
        uint256 completedAt;
        LiquidationEvent[] liquidations;
    }
    
    struct PaymentEvent {
        uint256 loanId;
        uint256 timestamp;
        uint256 amount;
        uint256 installmentNumber;
    }

    enum LoanStatus {
        Draft,      // Loan created but collateral not locked
        Active,     // Collateral locked, awaiting funding
        Funded,     // Lender committed, INR transferred
        Repaying,   // Active repayment period
        Completed,  // Fully repaid, collateral released
        Liquidated, // Collateral sold due to LTV breach
        Disputed,   // Under dispute resolution
        Cancelled,  // Cancelled before funding
        Pending    // Loan created but not yet authorized
    }

    modifier onlyBorrower(uint256 loanId) {
        require(loans[loanId].borrower == msg.sender, "Only borrower can perform this action");
        _;
    }

    modifier loanExists(uint256 loanId) {
        require(loans[loanId].borrower != address(0), "Loan does not exist");
        _;
    }

    modifier validLoanStatus(uint256 loanId, LoanStatus expectedStatus) {
        require(loans[loanId].status == expectedStatus, "Invalid loan status");
        _;
    }

    constructor(address _priceOracle) Ownable(msg.sender) {
        priceOracle = IPriceOracle(_priceOracle);
        _loanCounter = 0;
    }

    /**
     * @notice Create a new loan request and lock collateral in a single transaction
     * @param loanId The ID of the created loan
     * @param loanAmountInr Loan amount in INR (wei)
     * @param interestRate Annual interest rate in basis points
     * @param ltv Loan-to-value ratio in percentage
     * @param durationInDays Loan duration in days
     * @param collateralToken Address of collateral token
     * @param collateralAmount Amount of collateral tokens
     * @return loanId The ID of the created loan
     */
    function createLoan(
        uint256 loanId,
        uint256 loanAmountInr,
        uint256 interestRate,
        uint256 ltv,
        uint256 durationInDays,
        address collateralToken,
        uint256 collateralAmount
    ) external nonReentrant whenNotPaused /*validLoanStatus(loanId, LoanStatus.Draft)*/ payable returns (uint256) {
        require(loans[loanId].borrower == address(0), "Loan ID already exists");
        require(loanAmountInr >= MIN_LOAN_AMOUNT && loanAmountInr <= MAX_LOAN_AMOUNT, "Invalid loan amount");
        require(interestRate > 0 && interestRate <= MAX_INTEREST_RATE, "Invalid interest rate");
        require(durationInDays >= MIN_LOAN_DURATION && durationInDays <= MAX_LOAN_DURATION, "Invalid duration");
        require(durationInDays % INSTALLMENT_PERIOD == 0, "Duration must be a multiple of 30 days");
        require(collateralAmount > 0, "Invalid collateral amount");
        require(supportedTokens[collateralToken], "Unsupported collateral token");
        require(collateralToken != address(0), "Zero address not allowed");
        require(IERC20(collateralToken).balanceOf(msg.sender) >= collateralAmount, "Insufficient collateral balance");
        require(IERC20(collateralToken).allowance(msg.sender, address(this)) >= collateralAmount, "Insufficient collateral allowance");

        uint256 collateralValueInINR = priceOracle.getTokenPriceInINR(collateralToken, collateralAmount);
        uint256 maxLTV = _getMaxLTV();
        require(ltv <= maxLTV, "LTV exceeds maximum allowed");
        uint256 maxLoanAmount = (collateralValueInINR * ltv) / PERCENTAGE_DIVISOR;
        require(loanAmountInr <= maxLoanAmount, "Loan amount exceeds max limit based on LTV");

        Loan storage loan = loans[loanId];
        _setLoanIdBorrowerStatusAmount(loan, loanId, msg.sender, loanAmountInr);
        _setLoanInterestTerm(loan, interestRate, durationInDays);
        _setLoanCollateral(loan, collateralToken, collateralAmount);
        _setLoanCollateralValue(loan, collateralValueInINR);
        _setLoanTiming(loan);
        _setLoanInstallments(loan, interestRate, durationInDays);
        _setLoanDefaults(loan);

        // Set status to Pending
        loan.status = LoanStatus.Pending;

        userLoans[msg.sender].push(loanId);
        _loanCounter++;

        emit LoanCreated(
            loanId,
            msg.sender,
            loanAmountInr,
            interestRate,
            durationInDays,
            collateralToken,
            collateralAmount
        );
        emit CollateralLocked(loanId, collateralToken, collateralAmount);
        return loanId;
    }

    /**
     * @notice Admin creates a new loan request with all details, status Pending
     * @param loanId The ID of the created loan
     * @param loanAmountInr Loan amount in INR (wei)
     * @param interestRate Annual interest rate in basis points
     * @param ltv Loan-to-value ratio in percentage
     * @param durationInDays Loan duration in days
     * @param collateralToken Address of collateral token
     * @param collateralAmount Amount of collateral tokens
     */
    function adminCreateLoan(
        uint256 loanId,
        uint256 loanAmountInr,
        uint256 interestRate,
        uint256 ltv,
        uint256 durationInDays,
        address collateralToken,
        uint256 collateralAmount
    ) external onlyOwner {
        require(loans[loanId].borrower == address(0), "Loan ID already exists");
        require(loanAmountInr >= MIN_LOAN_AMOUNT && loanAmountInr <= MAX_LOAN_AMOUNT, "Invalid loan amount");
        require(interestRate > 0 && interestRate <= MAX_INTEREST_RATE, "Invalid interest rate");
        require(durationInDays >= MIN_LOAN_DURATION && durationInDays <= MAX_LOAN_DURATION, "Invalid duration");
        require(durationInDays % INSTALLMENT_PERIOD == 0, "Duration must be a multiple of 30 days");
        require(collateralAmount > 0, "Invalid collateral amount");
        require(supportedTokens[collateralToken], "Unsupported collateral token");
        require(collateralToken != address(0), "Zero address not allowed");

        uint256 collateralValueInINR = priceOracle.getTokenPriceInINR(collateralToken, collateralAmount);
        uint256 maxLTV = _getMaxLTV();
        require(ltv <= maxLTV, "LTV exceeds maximum allowed");
        uint256 maxLoanAmount = (collateralValueInINR * ltv) / PERCENTAGE_DIVISOR;
        require(loanAmountInr <= maxLoanAmount, "Loan amount exceeds max limit based on LTV");

        Loan storage loan = loans[loanId];
        loan.loanId = loanId;
        loan.borrower = address(0); // Not set until accepted
        loan.amount = loanAmountInr;
        loan.interestRate = interestRate;
        loan.term = durationInDays;
        loan.collateralToken = collateralToken;
        loan.collateralAmount = collateralAmount;
        loan.collateralValueInINR = collateralValueInINR;
        loan.status = LoanStatus.Pending;
        _setLoanTiming(loan);
        _setLoanInstallments(loan, interestRate, durationInDays);
        _setLoanDefaults(loan);
        _loanCounter++;
        emit LoanCreated(loanId, address(0), loanAmountInr, interestRate, durationInDays, collateralToken, collateralAmount);
    }

    /**
     * @notice Borrower accepts a pending loan and locks collateral
     * @param loanId The loan ID
     */
    function acceptLoan(uint256 loanId) external nonReentrant whenNotPaused {
        Loan storage loan = loans[loanId];
        require(loan.status == LoanStatus.Pending, "Loan not pending");
        require(loan.borrower == address(0), "Loan already accepted");
        require(IERC20(loan.collateralToken).balanceOf(msg.sender) >= loan.collateralAmount, "Insufficient collateral");
        require(IERC20(loan.collateralToken).allowance(msg.sender, address(this)) >= loan.collateralAmount, "Insufficient allowance");
        // Set borrower
        loan.borrower = msg.sender;
        // Transfer collateral
        IERC20(loan.collateralToken).safeTransferFrom(msg.sender, address(this), loan.collateralAmount);
        loan.status = LoanStatus.Active;
        userLoans[msg.sender].push(loanId);
        emit CollateralLocked(loanId, loan.collateralToken, loan.collateralAmount);
        emit LoanActivated(loanId, msg.sender);
        // Optionally, update LoanCreated event to include borrower now
    }

    /**
     * @notice Fund a loan (lender function)
     * @param loanId The loan ID
     */
    function fundLoan(uint256 loanId) external nonReentrant onlyOwner whenNotPaused validLoanStatus(loanId, LoanStatus.Active) {
        Loan storage loan = loans[loanId];
        require(loan.status == LoanStatus.Active, "Loan not active");

        loan.status = LoanStatus.Funded;
        loan.fundedAt = block.timestamp;

        emit LoanFunded(loanId, msg.sender, loan.amount);
    }

    /**
     * @notice Make a payment on a loan (off-chain payment logging)
     * @param loanId The loan ID
     * @param paymentAmount The payment amount in INR (wei)
     */
    function makePayment(uint256 loanId, uint256 paymentAmount) external onlyOwner nonReentrant whenNotPaused {
        Loan storage loan = loans[loanId];
        require(loan.status == LoanStatus.Funded || loan.status == LoanStatus.Repaying, "Invalid loan status");
        require(paymentAmount > 0, "Payment amount must be greater than 0");

        // Update loan status if this is the first payment
        if (loan.status == LoanStatus.Funded) {
            loan.status = LoanStatus.Repaying;
        }

        // Record payment
        loan.totalPaid += paymentAmount;
        loan.installmentsPaid++;

        PaymentEvent memory payment = PaymentEvent({
            loanId: loanId,
            timestamp: block.timestamp,
            amount: paymentAmount,
            installmentNumber: loan.installmentsPaid
        });

        // Check if loan is completed (needs review and testing)
        if (loan.totalPaid >= loan.amount && loan.installmentsPaid >= loan.totalInstallments) {
            _completeLoan(loanId);
        }

        loanPayments[loanId].push(payment);

        emit PaymentMade(loanId, msg.sender, paymentAmount, loan.installmentsPaid);
        emit LoanRepaid(loanId, msg.sender, paymentAmount, loan.totalPaid);
    }

    /**
     * @notice Check if a loan is eligible for liquidation and reason
     * @param loanId The loan ID
     * @return eligible True if eligible, reason Reason if not eligible
     */
    function canLiquidate(uint256 loanId) public view returns (bool eligible, string memory reason) {
        Loan storage loan = loans[loanId];
        if (loan.status != LoanStatus.Funded && loan.status != LoanStatus.Repaying) {
            return (false, "Loan not in funded or repaying status");
        }
        // Check for LTV breach first
        uint256 currentCollateralValue = priceOracle.getTokenPriceInINR(loan.collateralToken, loan.collateralAmount);
        uint256 interestAmount = (loan.amount * loan.interestRate) / INTEREST_RATE_DIVISOR;
        uint256 totalOwed = (loan.amount + interestAmount) * 103 / 100;
        if (currentCollateralValue < totalOwed) {
            return (true, "LTV breach");
        }
        // Check for default (payment missed)
        bool isDefaulted = block.timestamp > loan.nextDueDate + GRACE_PERIOD;
        if (isDefaulted) {
            return (true, "Defaulted");
        }
        return (false, "Loan not eligible for liquidation");
    }

    /**
     * @notice Main liquidation entry point. Dispatches to LTV or Defaulted logic.
     */
    function liquidate(uint256 loanId) external onlyOwner nonReentrant whenNotPaused {
        (bool eligible, string memory reason) = canLiquidate(loanId);
        require(eligible, reason);
        if (keccak256(bytes(reason)) == keccak256(bytes("LTV breach"))) {
            initiateLTVLiquidation(loanId);
        } else if (keccak256(bytes(reason)) == keccak256(bytes("Defaulted"))) {
            initiateDefaultLiquidation(loanId);
        } else {
            revert("Not eligible for liquidation");
        }
    }

    event LTVLiquidationInitiated(uint256 indexed loanId, uint256 collateralAmount, uint256 timestamp);
    event LTVLiquidationConfirmed(uint256 indexed loanId, uint256 actualTokenCost, uint256 returnedCollateral);

    /**
     * @notice Initiate LTV liquidation by transferring collateral to owner
     * @param loanId The loan ID
     */
    function initiateLTVLiquidation(uint256 loanId) internal {
        require(!pendingLiquidations[loanId].exists, "Liquidation already initiated");
        Loan storage loan = loans[loanId];

        uint256 slippage = (loan.collateralAmount * 3) / 100;
        uint256 collateralToTransfer = loan.collateralAmount + slippage;
        if (collateralToTransfer > loan.collateralAmount) {
            collateralToTransfer = loan.collateralAmount;
        }
        pendingLiquidations[loanId] = PendingLiquidation({
            loanId: loanId,
            collateralAmount: collateralToTransfer,
            timestamp: block.timestamp,
            exists: true
        });
        IERC20(loan.collateralToken).safeTransfer(owner(), collateralToTransfer);
        emit LTVLiquidationInitiated(loanId, collateralToTransfer, block.timestamp);
    }

    /**
     * @notice Confirm LTV liquidation by returning unused collateral
     * @param loanId The loan ID
     * @param actualTokenCost The actual token cost in INR
     * @param returnedCollateral The returned collateral amount
     */
    function confirmLTVLiquidation(uint256 loanId, uint256 actualTokenCost, uint256 returnedCollateral) external onlyOwner {
        require(pendingLiquidations[loanId].exists, "No pending liquidation");
        Loan storage loan = loans[loanId];
        PendingLiquidation storage pending = pendingLiquidations[loanId];
        // Owner returns unused collateral to contract
        if (returnedCollateral > 0) {
            IERC20(loan.collateralToken).safeTransferFrom(owner(), address(this), returnedCollateral);
        }
        // Return unused collateral to borrower
        if (returnedCollateral > 0) {
            IERC20(loan.collateralToken).safeTransfer(loan.borrower, returnedCollateral);
        }
        // Mark loan as liquidated
        loan.status = LoanStatus.Liquidated;
        loan.collateralAmount = 0;
        loan.liquidations.push(LiquidationEvent({
            timestamp: block.timestamp,
            amount: pending.collateralAmount
        }));
        emit LTVLiquidationConfirmed(loanId, actualTokenCost, returnedCollateral);
        delete pendingLiquidations[loanId];
    }

    event DefaultLiquidationInitiated(uint256 indexed loanId, uint256 collateralAmount, uint256 timestamp);
    event DefaultLiquidationConfirmed(uint256 indexed loanId, uint256 actualTokenCost, uint256 returnedBuffer);

    /**
     * @notice Initiate default liquidation by transferring collateral to owner
     * @param loanId The loan ID
     */
    function initiateDefaultLiquidation(uint256 loanId) internal {
        require(!pendingLiquidations[loanId].exists, "Liquidation already initiated");
        Loan storage loan = loans[loanId];
        // 2% buffer on installment
        uint256 buffer = (loan.collateralAmount * 2) / 100;
        uint256 installmentDue = loan.installmentAmount;
        uint256 pricePerTokenInINR = priceOracle.getTokenPriceInINR(loan.collateralToken, 1e18);
        require(pricePerTokenInINR > 0, "Invalid collateral price");
        uint256 collateralForInstallment = (installmentDue * 1e18) / pricePerTokenInINR;
        uint256 collateralToTransfer = collateralForInstallment + buffer;
        // Cap to available collateral
        if (collateralToTransfer > loan.collateralAmount) {
            collateralToTransfer = loan.collateralAmount;
        }
        pendingLiquidations[loanId] = PendingLiquidation({
            loanId: loanId,
            collateralAmount: collateralToTransfer,
            timestamp: block.timestamp,
            exists: true
        });
        IERC20(loan.collateralToken).safeTransfer(owner(), collateralToTransfer);
        emit DefaultLiquidationInitiated(loanId, collateralToTransfer, block.timestamp);
    }

    /**
     * @notice Confirm default liquidation by returning unused buffer
     * @param loanId The loan ID
     * @param actualTokenCost The actual token cost in INR
     * @param returnedBuffer The returned buffer amount
     */
    function confirmDefaultLiquidation(uint256 loanId, uint256 actualTokenCost, uint256 returnedBuffer) external onlyOwner {
        require(pendingLiquidations[loanId].exists, "No pending liquidation");
        Loan storage loan = loans[loanId];
        PendingLiquidation storage pending = pendingLiquidations[loanId];
        // Owner returns unused buffer to contract
        if (returnedBuffer > 0) {
            IERC20(loan.collateralToken).safeTransferFrom(owner(), address(this), returnedBuffer);
        }
        // Add returned buffer back to loan's collateral
        loan.collateralAmount += returnedBuffer;
        // Reduce collateral by actualTokenCost
        if (actualTokenCost > loan.collateralAmount) {
            loan.collateralAmount = 0;
        } else {
            loan.collateralAmount -= actualTokenCost;
        }
        loan.liquidations.push(LiquidationEvent({
            timestamp: block.timestamp,
            amount: pending.collateralAmount
        }));
        emit DefaultLiquidationConfirmed(loanId, actualTokenCost, returnedBuffer);
        delete pendingLiquidations[loanId];
    }

    // Events for two-phase liquidation
    event LiquidationInitiated(uint256 indexed loanId, uint256 collateralAmount, uint256 timestamp);
    event LiquidationConfirmed(uint256 indexed loanId, bool success, uint256 actualAmountReceived, bool fullyLiquidated);
    event LiquidationCancelled(uint256 indexed loanId, uint256 collateralReturned);

    /**
     * @notice Cancel a pending liquidation and return collateral
     * @param loanId The loan ID
     */
    function cancelLiquidation(uint256 loanId) external onlyOwner nonReentrant whenNotPaused {
        require(pendingLiquidations[loanId].exists, "No pending liquidation");
        
        PendingLiquidation storage pending = pendingLiquidations[loanId];
        uint256 collateralToReturn = pending.collateralAmount;

        // Return collateral to the contract
        IERC20(loans[loanId].collateralToken).safeTransferFrom(owner(), address(this), collateralToReturn);

        // Clear pending liquidation
        delete pendingLiquidations[loanId];

        emit LiquidationCancelled(loanId, collateralToReturn);
    }

    function getLiquidations(uint256 loanId) external view returns (LiquidationEvent[] memory) {
        return loans[loanId].liquidations;
    }

    // View Functions
    /**
     * @notice Get complete loan information
     * @param loanId The loan ID
     */
    function getLoan(uint256 loanId) external view loanExists(loanId) returns (
        uint256 amount,
        uint256 interestRate,
        uint256 term,
        uint256 status,
        address borrower,
        address collateralToken,
        uint256 collateralAmount,
        uint256 nextDueDate,
        uint256 totalPaid,
        uint256 installmentsPaid,
        uint256 totalInstallments,
        uint256 installmentAmount,
        uint256 createdAt,
        uint256 fundedAt,
        uint256 completedAt,
        uint256 liquidationsLength
    ) {
        Loan storage loan = loans[loanId];
        return (
            loan.amount,
            loan.interestRate,
            loan.term,
            uint256(loan.status),
            loan.borrower,
            loan.collateralToken,
            loan.collateralAmount,
            loan.nextDueDate,
            loan.totalPaid,
            loan.installmentsPaid,
            loan.totalInstallments,
            loan.installmentAmount,
            loan.createdAt,
            loan.fundedAt,
            loan.completedAt,
            loan.liquidations.length
        );
    }

    function getLoanStatus(uint256 loanId) external view loanExists(loanId) returns (uint256) {
        return uint256(loans[loanId].status);
    }

    function getLoanCount() external view returns (uint256) {
        return _loanCounter;
    }

    function getActiveLoans() external view returns (uint256[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < _loanCounter; i++) {
            LoanStatus status = loans[i].status;
            if (status == LoanStatus.Active || status == LoanStatus.Funded || status == LoanStatus.Repaying) {
                activeCount++;
            }
        }
        
        uint256[] memory activeLoans = new uint256[](activeCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < _loanCounter; i++) {
            LoanStatus status = loans[i].status;
            if (status == LoanStatus.Active || status == LoanStatus.Funded || status == LoanStatus.Repaying) {
                activeLoans[currentIndex] = i;
                currentIndex++;
            }
        }
        
        return activeLoans;
    }

    function getLoansByUser(address user) external view returns (uint256[] memory) {
        return userLoans[user];
    }

    /**
     * @notice Get total collateral balance for a specific token in the contract
     * @param token The token address
     * @return Total balance of the token in the contract
     */
    function getContractCollateralBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    // Admin Functions
    event PriceOracleChanged(address indexed newOracle);
    event SupportedTokenAdded(address indexed token);
    event SupportedTokenRemoved(address indexed token);
    event EmergencyWithdraw(address indexed token, uint256 amount);
    event ContractPaused(address indexed by);
    event ContractUnpaused(address indexed by);
    event LoanActivated(uint256 indexed loanId, address indexed borrower);

    function setPriceOracle(address _priceOracle) external onlyOwner {
        require(_priceOracle != address(0), "Zero address not allowed");
        priceOracle = IPriceOracle(_priceOracle);
        emit PriceOracleChanged(_priceOracle);
    }

    function addSupportedToken(address token) external onlyOwner {
        require(token != address(0), "Zero address not allowed");
        supportedTokens[token] = true;
        emit SupportedTokenAdded(token);
    }

    function removeSupportedToken(address token) external onlyOwner {
        require(token != address(0), "Zero address not allowed");
        supportedTokens[token] = false;
        emit SupportedTokenRemoved(token);
    }

    function pause() external onlyOwner {
        _pause();
        emit ContractPaused(msg.sender);
    }

    function unpause() external onlyOwner {
        _unpause();
        emit ContractUnpaused(msg.sender);
    }

    // Internal Functions
    /**
     * @notice Complete a loan (internal function)
     * @param loanId The loan ID
     */
    function _completeLoan(uint256 loanId) internal {
        Loan storage loan = loans[loanId];
        loan.status = LoanStatus.Completed;
        loan.completedAt = block.timestamp;

        // Store collateral amount before release for audit trail
        uint256 collateralToRelease = loan.collateralAmount;
        
        // Clear collateral amount before transfer to prevent reentrancy
        loan.collateralAmount = 0;

        // Release collateral to borrower
        IERC20(loan.collateralToken).safeTransfer(loan.borrower, collateralToRelease);

        // Get final balance for audit trail
        uint256 finalBalance = IERC20(loan.collateralToken).balanceOf(address(this));

        emit CollateralReleased(loanId, loan.collateralToken, collateralToRelease);
        emit LoanCompleted(loanId);
        emit CollateralAuditTrail(loanId, loan.collateralToken, collateralToRelease, finalBalance);
    }

    function _getMaxLTV() internal pure returns (uint256) {
        return MAX_LTV; // Use same LTV for all tokens
    }

    function _setLoanIdBorrowerStatusAmount(Loan storage loan, uint256 loanId, address borrower, uint256 amount) internal {
        loan.loanId = loanId;
        loan.borrower = borrower;
        loan.status = LoanStatus.Active;
        loan.amount = amount;
    }

    function _setLoanInterestTerm(Loan storage loan, uint256 interestRate, uint256 durationInDays) internal {
        loan.interestRate = interestRate;
        loan.term = durationInDays;
    }

    function _setLoanCollateral(Loan storage loan, address collateralToken, uint256 collateralAmount) internal {
        loan.collateralToken = collateralToken;
        loan.collateralAmount = collateralAmount;
    }

    function _setLoanCollateralValue(Loan storage loan, uint256 collateralValueInINR) internal {
        loan.collateralValueInINR = collateralValueInINR;
        IERC20(loan.collateralToken).safeTransferFrom(loan.borrower, address(this), loan.collateralAmount);
    }

    function _setLoanTiming(Loan storage loan) internal {
        loan.nextDueDate = block.timestamp + INSTALLMENT_PERIOD;
        loan.createdAt = block.timestamp;
    }

    function _setLoanInstallments(Loan storage loan, uint256 interestRate, uint256 durationInDays) internal {
        (uint256 totalInstallments, uint256 installmentAmount) = _calculateInstallments(loan.amount, interestRate, durationInDays);
        loan.totalInstallments = totalInstallments;
        loan.installmentAmount = installmentAmount;
        loan.totalPaid = 0;
        loan.installmentsPaid = 0;
    }

    function _setLoanDefaults(Loan storage loan) internal {
        loan.fundedAt = 0;
        loan.completedAt = 0;
    }

    function _calculateInstallments(uint256 loanAmountInr, uint256 interestRate, uint256 durationInDays) internal pure returns (uint256 totalInstallments, uint256 installmentAmount) {
        totalInstallments = durationInDays / INSTALLMENT_PERIOD;
        installmentAmount = (loanAmountInr * (INTEREST_RATE_DIVISOR + interestRate)) / (INTEREST_RATE_DIVISOR * totalInstallments);
    }


    // Emergency Functions
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        require(token != address(0), "Zero address not allowed");
        require(amount > 0, "Amount must be greater than zero");
        IERC20(token).safeTransfer(owner(), amount);
        emit EmergencyWithdraw(token, amount);
    }

    function emergencyPause() external onlyOwner {
        _pause();
    }

    // Test function to debug PriceOracle issues
    function testPriceOracle(address token, uint256 amount) external view returns (uint256) {
        return priceOracle.getTokenPriceInINR(token, amount);
    }

    /**
     * @notice Mark a loan as defaulted (can be called by anyone when loan is past due)
     * @param loanId The loan ID
     */
    function markLoanAsDefaulted(uint256 loanId) external nonReentrant whenNotPaused {
        Loan storage loan = loans[loanId];
        require(loan.status == LoanStatus.Repaying, "Loan not in repaying status");
        require(block.timestamp > loan.nextDueDate + GRACE_PERIOD, "Loan not yet defaulted");
        
        emit LoanDefaulted(loanId, block.timestamp);
    }

    /**
     * @notice Check if a loan is defaulted
     * @param loanId The loan ID
     * @return True if loan is defaulted
     */
    function checkLoanDefault(uint256 loanId) external view returns (bool) {
        Loan storage loan = loans[loanId];
        return loan.status == LoanStatus.Repaying && block.timestamp > loan.nextDueDate + GRACE_PERIOD;
    }
}
