import { Request, Response } from 'express';
import { PrismaClient, LoanStatus } from '@prisma/client';
import { createOrder } from '../services/razorpayService';

const prisma = new PrismaClient();

export const initiateFunding = async (req: Request, res: Response): Promise<void> => {
  const { loanId } = req.params;
  const { lenderId, fundingAmount } = req.body;

  if (!loanId || !lenderId || !fundingAmount) {
    res.status(400).json({ message: 'Missing required fields: loanId, lenderId, fundingAmount' });
    return;
  }

  try {
    const loan = await prisma.loan.findUnique({ where: { id: loanId } });
    if (!loan) {
      res.status(404).json({ message: 'Loan not found' });
      return;
    }
    if (loan.status !== LoanStatus.active) {
      res.status(400).json({ message: 'Loan is not available for funding' });
      return;
    }

    // Create Razorpay order
    const order = await createOrder(Number(fundingAmount), 'INR', loanId);

    // Update loan with funding_pending status and order details
    await prisma.loan.update({
      where: { id: loanId },
      data: {
        status: LoanStatus.funding_pending,
        fundingOrderId: order.id,
        lenderId,
      }
    });

    res.status(201).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env['RAZORPAY_KEY_ID'],
    });
  } catch (error) {
    console.error('Error initiating funding:', error);
    res.status(500).json({ message: 'Failed to initiate funding', error: (error as Error).message });
  }
}; 