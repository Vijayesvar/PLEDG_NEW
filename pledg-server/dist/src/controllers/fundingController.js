"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initiateFunding = void 0;
const client_1 = require("@prisma/client");
const razorpayService_1 = require("../services/razorpayService");
const prisma = new client_1.PrismaClient();
const initiateFunding = async (req, res) => {
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
        if (loan.status !== client_1.LoanStatus.active) {
            res.status(400).json({ message: 'Loan is not available for funding' });
            return;
        }
        const order = await (0, razorpayService_1.createOrder)(Number(fundingAmount), 'INR', loanId);
        await prisma.loan.update({
            where: { id: loanId },
            data: {
                status: client_1.LoanStatus.funding_pending,
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
    }
    catch (error) {
        console.error('Error initiating funding:', error);
        res.status(500).json({ message: 'Failed to initiate funding', error: error.message });
    }
};
exports.initiateFunding = initiateFunding;
//# sourceMappingURL=fundingController.js.map