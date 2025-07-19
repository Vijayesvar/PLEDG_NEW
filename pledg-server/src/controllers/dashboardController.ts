import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getDashboardOverview = async (req: Request, res: Response) => {
  try {
    let userId = req.query['userId'];
    if (Array.isArray(userId)) userId = userId[0];
    if (!userId || typeof userId !== 'string') {
      res.status(400).json({ message: 'userId is required' });
      return;
    }

    // Borrower stats
    const borrowerLoans = await prisma.loan.findMany({ where: { borrowerId: userId } });
    const totalBorrowed = borrowerLoans.reduce((sum, l) => sum + Number(l.amountInr), 0);
    const totalLoans = borrowerLoans.length;
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    const thisYear = new Date(new Date().getFullYear(), 0, 1);
    const borrowedThisMonth = borrowerLoans.filter(l => l.createdAt >= thisMonth).reduce((sum, l) => sum + Number(l.amountInr), 0);
    const borrowedThisYear = borrowerLoans.filter(l => l.createdAt >= thisYear).reduce((sum, l) => sum + Number(l.amountInr), 0);
    // Interest paid
    const paidInstallments = await prisma.installment.findMany({
      where: { loan: { borrowerId: userId }, status: 'paid' },
      include: { loan: true }
    });
    const totalInterestPaid = paidInstallments.reduce((sum, inst) => {
      if (!inst.loan) return sum;
      const principal = Number(inst.loan.amountInr) / Number(inst.loan.durationMonths);
      return sum + (Number(inst.amount) - principal);
    }, 0);
    const interestPaidThisMonth = paidInstallments.filter(inst => inst.paidAt && inst.paidAt >= thisMonth).reduce((sum, inst) => {
      if (!inst.loan) return sum;
      const principal = Number(inst.loan.amountInr) / Number(inst.loan.durationMonths);
      return sum + (Number(inst.amount) - principal);
    }, 0);
    const interestPaidThisYear = paidInstallments.filter(inst => inst.paidAt && inst.paidAt >= thisYear).reduce((sum, inst) => {
      if (!inst.loan) return sum;
      const principal = Number(inst.loan.amountInr) / Number(inst.loan.durationMonths);
      return sum + (Number(inst.amount) - principal);
    }, 0);
    // Collateral
    const borrowerCollaterals = await prisma.collateral.findMany({ where: { userId: userId } });
    // Lender stats
    const lenderLoans = await prisma.loan.findMany({ where: { lenderId: userId } });
    const totalInvestment = lenderLoans.reduce((sum, l) => sum + Number(l.amountInr), 0);
    const totalLenderLoans = lenderLoans.length;
    const investmentThisMonth = lenderLoans.filter(l => l.createdAt >= thisMonth).reduce((sum, l) => sum + Number(l.amountInr), 0);
    const investmentThisYear = lenderLoans.filter(l => l.createdAt >= thisYear).reduce((sum, l) => sum + Number(l.amountInr), 0);
    // Profits (interest earned)
    const lenderInstallments = await prisma.installment.findMany({
      where: { loan: { lenderId: userId }, status: 'paid' },
      include: { loan: true }
    });
    const totalProfits = lenderInstallments.reduce((sum, inst) => {
      if (!inst.loan) return sum;
      const principal = Number(inst.loan.amountInr) / Number(inst.loan.durationMonths);
      return sum + (Number(inst.amount) - principal);
    }, 0);
    const profitsThisMonth = lenderInstallments.filter(inst => inst.paidAt && inst.paidAt >= thisMonth).reduce((sum, inst) => {
      if (!inst.loan) return sum;
      const principal = Number(inst.loan.amountInr) / Number(inst.loan.durationMonths);
      return sum + (Number(inst.amount) - principal);
    }, 0);
    const profitsThisYear = lenderInstallments.filter(inst => inst.paidAt && inst.paidAt >= thisYear).reduce((sum, inst) => {
      if (!inst.loan) return sum;
      const principal = Number(inst.loan.amountInr) / Number(inst.loan.durationMonths);
      return sum + (Number(inst.amount) - principal);
    }, 0);
    // Lender collateral
    const lenderCollaterals = await prisma.collateral.findMany({ where: { userId: userId } });
    res.status(200).json({
      borrower: {
        totalBorrowed,
        borrowedThisMonth,
        borrowedThisYear,
        totalInterestPaid,
        interestPaidThisMonth,
        interestPaidThisYear,
        totalLoans,
        loansThisMonth: borrowerLoans.filter(l => l.createdAt >= thisMonth).length,
        loansThisYear: borrowerLoans.filter(l => l.createdAt >= thisYear).length,
        collaterals: borrowerCollaterals.map(c => ({ amount: c.amount, type: c.type }))
      },
      lender: {
        totalInvestment,
        investmentThisMonth,
        investmentThisYear,
        totalProfits,
        profitsThisMonth,
        profitsThisYear,
        totalLoans: totalLenderLoans,
        loansThisMonth: lenderLoans.filter(l => l.createdAt >= thisMonth).length,
        loansThisYear: lenderLoans.filter(l => l.createdAt >= thisYear).length,
        collaterals: lenderCollaterals.map(c => ({ amount: c.amount, type: c.type }))
      }
    });
  } catch (error) {
    console.error('Error in getDashboardOverview:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard overview', error: (error as Error).message });
  }
};

export const getBorrowerTransactions = (_req: Request, res: Response) => {
  res.status(501).json({ message: 'Get borrower transactions endpoint - not implemented' });
};

export const getBorrowerTransactionsByLoanId = (_req: Request, res: Response) => {
  res.status(501).json({ message: 'Get borrower transactions by loan ID endpoint - not implemented' });
};

export const getLenderTransactions = (_req: Request, res: Response) => {
  res.status(501).json({ message: 'Get lender transactions endpoint - not implemented' });
};

export const getLenderTransactionsByLoanId = (_req: Request, res: Response) => {
  res.status(501).json({ message: 'Get lender transactions by loan ID endpoint - not implemented' });
};