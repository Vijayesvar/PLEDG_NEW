"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.razorpayInstallmentWebhook = exports.razorpayFundingWebhook = void 0;
const razorpayService_1 = require("../services/razorpayService");
const client_1 = require("@prisma/client");
const pledgContract_1 = require("../utils/pledgContract");
const prisma = new client_1.PrismaClient();
const razorpayFundingWebhook = async (req, res) => {
    const signature = req.headers['x-razorpay-signature'];
    if (!(0, razorpayService_1.verifyWebhookSignature)(req.body, signature)) {
        res.status(400).json({ message: 'Invalid signature' });
        return;
    }
    const entity = req.body.payload?.payment?.entity;
    if (!entity) {
        res.status(400).json({ message: 'Invalid payload' });
        return;
    }
    const { order_id, status } = entity;
    const loan = await prisma.loan.findFirst({ where: { fundingOrderId: order_id } });
    if (!loan) {
        res.status(404).json({ message: 'Loan not found' });
        return;
    }
    if (status === 'captured') {
        try {
            const pledg = (0, pledgContract_1.getPledgContract)();
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
                    status: client_1.LoanStatus.funded,
                    fundedAt: new Date(),
                    fundingTxHash: receipt.hash,
                }
            });
            await prisma.installment.create({
                data: {
                    loanId: loan.id,
                    dueDate: new Date(Date.now() + loan.durationMonths * 30 * 24 * 60 * 60 * 1000),
                    amount: loan.monthlyPayment.toString(),
                    status: client_1.InstallmentStatus.pending,
                }
            });
            res.status(200).json({ message: 'Loan funded', txHash: receipt.hash });
        }
        catch (err) {
            console.error('Smart contract call failed:', err);
            res.status(500).json({ message: 'Blockchain funding failed', error: err.message });
        }
    }
    else {
        await prisma.loan.update({
            where: { id: loan.id },
            data: { status: client_1.LoanStatus.active }
        });
        res.status(200).json({ message: 'Payment failed, loan status reverted' });
    }
};
exports.razorpayFundingWebhook = razorpayFundingWebhook;
const razorpayInstallmentWebhook = async (req, res) => {
    const signature = req.headers['x-razorpay-signature'];
    if (!(0, razorpayService_1.verifyWebhookSignature)(req.body, signature)) {
        res.status(400).json({ message: 'Invalid signature' });
        return;
    }
    const entity = req.body.payload?.payment?.entity;
    if (!entity) {
        res.status(400).json({ message: 'Invalid payload' });
        return;
    }
    const { order_id, status } = entity;
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
            await prisma.installment.update({
                where: { id: installment.id },
                data: { status: 'paid', paidAt: new Date() },
            });
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
            const payout = await (0, razorpayService_1.createPayout)(Number(installment.amount), 'INR', lenderBank.secureToken, 'loan_installment', installment.id);
            const paidCount = await prisma.installment.count({ where: { loanId: loan.id, status: 'paid' } });
            if (paidCount < loan.durationMonths) {
                await prisma.installment.create({
                    data: {
                        loanId: loan.id,
                        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                        amount: Number(loan.monthlyPayment),
                        status: 'pending',
                    },
                });
            }
            const pledg = (0, pledgContract_1.getPledgContract)();
            if (pledg && pledg['payInstallment']) {
                await pledg['payInstallment'](loan.id, installment.amount.toString());
            }
            res.status(200).json({ message: 'Installment paid and payout initiated', payout });
        }
        catch (err) {
            console.error('Installment webhook error:', err);
            res.status(500).json({ message: 'Installment payout or contract call failed', error: err.message });
        }
    }
    else {
        res.status(200).json({ message: 'Payment not captured, no action taken' });
    }
};
exports.razorpayInstallmentWebhook = razorpayInstallmentWebhook;
//# sourceMappingURL=razorpayWebhookController.js.map