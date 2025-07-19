import { Request, Response } from 'express';
import { LoanStatus, PrismaClient } from '@prisma/client';
import { getPledgContract } from '../utils/pledgContract';
import { ethers } from 'ethers';
const prisma = new PrismaClient();
import { AuthenticatedRequest } from '../types/auth'
import { CollateralStatus, CollateralType } from '@prisma/client';
import { fetchMarketPrice } from '../utils/marketPrice';
import { LTV_THRESHOLD } from '../constants/loan';
export const getMarketplace = async (_req: Request, res: Response): Promise<void> => {
  try {
    const loans = await prisma.loan.findMany({ 
      where: { status: 'draft' },
      include: {
        collateral: {
          select: {
            amount: true,
            type: true
          }
        }
      }
    });
    
    const loansWithCollateral = loans.map(loan => ({
      ...loan,
      collateral: loan.collateral.amount,
      collateralType: loan.collateral.type
    }));
    
    res.status(200).json(loansWithCollateral);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch marketplace loans', error: (error as Error).message });
  }
};

export const getLoanById = async (req: Request, res: Response): Promise<void> => {
  const { loanId } = req.params;
  if (!loanId) {
    res.status(400).json({ message: 'Loan ID is required' });
    return;
  }
  try {
    const loan = await prisma.loan.findUnique({ where: { id: loanId } });
    if (!loan) {
      res.status(404).json({ message: 'Loan not found' });
      return;
    }
    res.status(200).json(loan);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch loan', error: (error as Error).message });
  }
};

export const createLoan = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(400).json({ error: "User missing" })
      return;
    }

    const {
      collateral,
      collateralAmount,
      loanAmount,
      loanDuration,
      interestRate
    } = req.body;

    const collateralObj = await prisma.collateral.create({
      data: {
        userId: req.user.userId,
        type: collateral === "eth" ? CollateralType.eth : CollateralType.btc,
        amount: collateralAmount,
        remainingAmount: collateralAmount,
        status: CollateralStatus.pending,
      }
    })
    
    const collateralInINR = await fetchMarketPrice({ collateral: collateral });
    const ltv = (loanAmount / collateralInINR) * 100;

    if (ltv > LTV_THRESHOLD) {
      res.status(400).json({ message: 'Loan amount is too high' });
      return;
    }

    const createPendingLoan = await prisma.loan.create({
      data: {
        borrowerId: req.user.userId,
        collateralId: collateralObj.id,
        amountInr: loanAmount,
        interestRate,
        durationMonths: loanDuration,
        status: LoanStatus.pending,
        monthlyPayment: loanAmount * (1 + interestRate / 100) / loanDuration,
        ltv
      }
    })

    res.status(200).json({
      message: 'Loan created successfully',
      loanId: createPendingLoan.id
    })
    return;

  } catch (error) {
      console.error('Error creating loan:', error);
      res.status(500).json({ message: 'Failed to create loan', error: (error as Error).message });
  }
};

export const confirmLoanTransaction = async (req: Request, res: Response): Promise<void> => {
  const { loanId, txHash } = req.body;

  if (!loanId || !txHash) {
    res.status(400).json({ 
      message: 'Missing required fields: loanId, txHash' 
    });
    return;
  }

  try {
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: { collateral: true }
    });

    if (!loan) {
      res.status(404).json({ message: 'Loan not found' });
      return;
    }

    if (loan.status !== 'draft') {
      res.status(400).json({ message: 'Loan is not in draft status' });
      return;
    }

    if (!ethers.isHexString(txHash, 32)) {
      res.status(400).json({ message: 'Invalid transaction hash format' });
      return;
    }

    const pledg = getPledgContract();
    if (!pledg) {
      res.status(503).json({ message: 'Smart contract service unavailable. Please check environment variables.' });
      return;
    }
    
    const provider = pledg.runner?.provider;
    
    if (!provider) {
      res.status(500).json({ message: 'Blockchain provider not available' });
      return;
    }

    const [receipt, transaction] = await Promise.all([
      provider.getTransactionReceipt(txHash),
      provider.getTransaction(txHash)
    ]);
    
    if (!receipt) {
      res.status(400).json({ message: 'Transaction not found on blockchain' });
      return;
    }

    if (!transaction) {
      res.status(400).json({ message: 'Transaction data not found on blockchain' });
      return;
    }

    if (receipt.status === 0) {
      res.status(400).json({ message: 'Transaction failed on blockchain' });
      return;
    }

    const contractAddress = process.env['PLEDG_CONTRACT_ADDRESS'];
    if (transaction.to?.toLowerCase() !== contractAddress?.toLowerCase()) {
      res.status(400).json({ message: 'Transaction is not to the correct contract' });
      return;
    }

    if (transaction.data) {
      try {
        const iface = new ethers.Interface(pledg.interface.fragments);
        const decodedData = iface.parseTransaction({ data: transaction.data });
        
        if (!decodedData) {
          res.status(400).json({ message: 'Unable to decode transaction data' });
          return;
        }
        
        if (decodedData.name !== 'createLoan') {
          res.status(400).json({ message: 'Transaction does not call createLoan function' });
          return;
        }

        const txLoanId = decodedData.args[0];
        if (txLoanId !== loanId) {
          res.status(400).json({ message: 'Transaction loan ID does not match database loan ID' });
          return;
        }

        const txLoanAmount = decodedData.args[1].toString();
        const txInterestRate = decodedData.args[2].toString();
        const txLtv = decodedData.args[3].toString();
        const txDuration = decodedData.args[4].toString();
        const txCollateralToken = decodedData.args[5];
        const txCollateralAmount = decodedData.args[6].toString();

        if (txLoanAmount !== loan.amountInr.toString() ||
            txInterestRate !== loan.interestRate.toString() ||
            txLtv !== loan.ltv.toString() ||
            txDuration !== loan.durationMonths.toString() ||
            txCollateralToken !== loan.collateral.type ||
            txCollateralAmount !== loan.collateral.amount.toString()) {
          res.status(400).json({ message: 'Transaction parameters do not match database records' });
          return;
        }

      } catch (decodeError) {
        console.error('Error decoding transaction data:', decodeError);
        res.status(400).json({ message: 'Unable to decode transaction data' });
        return;
      }
    }

    const createLoanEventSignature = ethers.id('LoanCreated(string,uint256,uint256,uint256,uint256,string,uint256)');
    const hasCreateLoanEvent = receipt.logs.some(log => 
      log.topics[0] === createLoanEventSignature
    );

    if (!hasCreateLoanEvent) {
      res.status(400).json({ message: 'Transaction does not contain createLoan event' });
      return;
    }

    await prisma.collateral.update({
      where: { id: loan.collateralId },
      data: { 
        status: 'locked'
      }
    });

    await prisma.loan.update({
      where: { id: loanId },
      data: { status: 'active' }
    });

    res.status(200).json({ 
      status: 'confirmed',
      loanId,
      txHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed?.toString(),
      verification: {
        contractVerified: true,
        functionVerified: true,
        parametersVerified: true,
        eventVerified: true
      }
    });

  } catch (error) {
    console.error('Error confirming loan transaction:', error);
    res.status(500).json({ 
      message: 'Failed to confirm loan transaction', 
      error: (error as Error).message 
    });
  }
};

export const cancelLoan = async (req: Request, res: Response): Promise<void> => {
  const { loanId } = req.params;

  if (!loanId) {
    res.status(400).json({ message: 'Loan ID is required' });
    return;
  }

  try {
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: { collateral: true }
    });

    if (!loan) {
      res.status(404).json({ message: 'Loan not found' });
      return;
    }

    if (loan.status !== 'draft') {
      res.status(400).json({ message: 'Only draft loans can be cancelled' });
      return;
    }

    await prisma.loan.delete({ where: { id: loanId } });
    await prisma.collateral.delete({ where: { id: loan.collateralId } });

    res.status(200).json({ 
      status: 'cancelled',
      loanId
    });

  } catch (error) {
    console.error('Error cancelling loan:', error);
    res.status(500).json({ 
      message: 'Failed to cancel loan', 
      error: (error as Error).message 
    });
  }
};

export const payInstallment = async (req: Request, res: Response): Promise<void> => {
  const { loanId } = req.params;
  const { userId } = req.body;

  if (!loanId || !userId) {
    res.status(400).json({ message: 'loanId and userId are required' });
    return;
  }

  try {
    // Fetch loan and validate
    const loan = await prisma.loan.findUnique({ where: { id: loanId } });
    if (!loan) {
      res.status(404).json({ message: 'Loan not found' });
      return;
    }
    if (!(loan.status === 'funded' || loan.status === 'repaying')) {
      res.status(400).json({ message: 'Loan is not in funded or repaying status' });
      return;
    }
    if (loan.borrowerId !== userId) {
      res.status(403).json({ message: 'User is not the borrower for this loan' });
      return;
    }

    // Fetch next pending installment
    const installment = await prisma.installment.findFirst({
      where: { loanId, status: 'pending' },
      orderBy: { dueDate: 'asc' }
    });
    if (!installment) {
      res.status(400).json({ message: 'No pending installment found for this loan' });
      return;
    }

    // Get monthly payment amount
    const amount = loan.monthlyPayment;
    if (!amount) {
      res.status(500).json({ message: 'Monthly payment amount not set for this loan' });
      return;
    }

    // Get lender for payout
    if (!loan.lenderId) {
      res.status(400).json({ message: 'Loan does not have a lender assigned' });
      return;
    }
    const lenderBank = await prisma.userBankAccount.findFirst({
      where: { userId: loan.lenderId, verified: true },
    });
    if (!lenderBank) {
      res.status(500).json({ message: 'Lender bank account not found or not verified' });
      return;
    }

    // Create Razorpay order (simulate or use service)
    const { createRazorpayOrder } = require('../services/razorpayService');
    const order = await createRazorpayOrder(Number(amount), 'INR', lenderBank.secureToken, 'loan_installment', installment.id);
    if (!order || !order.id) {
      res.status(500).json({ message: 'Failed to create Razorpay order' });
      return;
    }

    // Update installment with orderId
    await prisma.installment.update({
      where: { id: installment.id },
      data: { orderId: order.id }
    });

    res.status(200).json({
      status: 'order_created',
      orderId: order.id,
      installmentId: installment.id,
      amount: amount.toString(),
      dueDate: installment.dueDate
    });
  } catch (error) {
    console.error('Error in payInstallment:', error);
    res.status(500).json({ message: 'Failed to initiate installment payment', error: (error as Error).message });
  }
}; 