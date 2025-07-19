import { Request, Response } from 'express';
import { verifyWebhookSignature, createPayout } from '../services/razorpayService';
import { PrismaClient, LoanStatus, InstallmentStatus } from '@prisma/client';
import { getPledgContract } from '../utils/pledgContract';

const prisma = new PrismaClient();

export const razorpayFundingWebhook = async (req: Request, res: Response): Promise<void> => {
  const signature = req.headers['x-razorpay-signature'] as string;
  if (!verifyWebhookSignature(req.body, signature)) {
    res.status(400).json({ message: 'Invalid signature' });
    return;
  }

  const entity = req.body.payload?.payment?.entity;
  if (!entity) {
    res.status(400).json({ message: 'Invalid payload' });
    return;
  }

  const { order_id, status } = entity;

  // Find the loan by fundingOrderId
  const loan = await prisma.loan.findFirst({ where: { fundingOrderId: order_id } });
  if (!loan) {
    res.status(404).json({ message: 'Loan not found' });
    return;
  }

  if (status === 'captured') {
    try {
      // Call smart contract fundLoan here, get tx hash
      const pledg = getPledgContract();
      if (!pledg) {
        res.status(503).json({ message: 'Smart contract service unavailable. Please check environment variables.' });
        return;
      }
      
      if (!pledg['fundLoan']) {
        res.status(500).json({ message: 'Smart contract fundLoan method not available' });
        return;
      }
      const tx = await pledg['fundLoan'](loan.id, loan.amountInr.toString());
      const receipt = await tx.wait();

      await prisma.loan.update({
        where: { id: loan.id },
        data: {
          status: LoanStatus.funded,
          fundedAt: new Date(),
          fundingTxHash: receipt.hash,
        } as any // fundingTxHash is in schema, migration must be run
      });
      //fix amount paid
      await prisma.installment.create({
        data: {
          loanId: loan.id,
          dueDate: new Date(Date.now() + loan.durationMonths * 30 * 24 * 60 * 60 * 1000),
          amount: loan.monthlyPayment.toString(),
          status: InstallmentStatus.pending,
        }
      })
      res.status(200).json({ message: 'Loan funded', txHash: receipt.hash });
    } catch (err) {
      console.error('Smart contract call failed:', err);
      // Optionally revert status or alert admin
      res.status(500).json({ message: 'Blockchain funding failed', error: (err as Error).message });
    }
  } else {
    await prisma.loan.update({
      where: { id: loan.id },
      data: { status: LoanStatus.active }
    });
    res.status(200).json({ message: 'Payment failed, loan status reverted' });
  }
};

export const razorpayInstallmentWebhook = async (req: Request, res: Response): Promise<void> => {
  const signature = req.headers['x-razorpay-signature'] as string;
  if (!verifyWebhookSignature(req.body, signature)) {
    res.status(400).json({ message: 'Invalid signature' });
    return;
  }

  const entity = req.body.payload?.payment?.entity;
  if (!entity) {
    res.status(400).json({ message: 'Invalid payload' });
    return;
  }

  const { order_id, status } = entity;

  // Find the installment by orderId
  const installment = await prisma.installment.findFirst({ where: { orderId: order_id } });
  if (!installment) {
    res.status(404).json({ message: 'Installment not found' });
    return;
  }

  const loan = await prisma.loan.findUnique({ where: { id: installment.loanId } });
  if (!loan) {
    res.status(404).json({ message: 'Loan not found' });
    return;
  }

  if (status === 'captured') {
    try {
      // Mark installment as paid
      await prisma.installment.update({
        where: { id: installment.id },
        data: { status: 'paid', paidAt: new Date() },
      });
      // Get lender's secure token
      let lenderBank = null;
      if (loan.lenderId) {
        lenderBank = await prisma.userBankAccount.findFirst({
          where: { userId: loan.lenderId, verified: true },
        });
      }
      if (!lenderBank) {
        res.status(500).json({ message: 'Lender bank account not found or not verified' });
        return;
      }
      // Initiate payout to lender
      const payout = await createPayout(Number(installment.amount), 'INR', lenderBank.secureToken, 'loan_installment', installment.id);
      // Optionally, track payout status in a new field or log
      // Create next installment if loan duration is still active
      const paidCount = await prisma.installment.count({ where: { loanId: loan.id, status: 'paid' } });
      if (paidCount < loan.durationMonths) {
        await prisma.installment.create({
          data: {
            loanId: loan.id,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // next month
            amount: Number(loan.monthlyPayment),
            status: 'pending',
          },
        });
      }
      // Call smart contract payInstallment
      const pledg = getPledgContract();
      if (pledg && pledg['payInstallment']) {
        await pledg['payInstallment'](loan.id, installment.amount.toString());
      }
      res.status(200).json({ message: 'Installment paid and payout initiated', payout });
    } catch (err) {
      console.error('Installment webhook error:', err);
      res.status(500).json({ message: 'Installment payout or contract call failed', error: (err as Error).message });
    }
  } else {
    res.status(200).json({ message: 'Payment not captured, no action taken' });
  }
};