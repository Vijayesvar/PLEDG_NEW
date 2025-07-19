"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.payInstallment = exports.cancelLoan = exports.confirmLoanTransaction = exports.createLoan = exports.getLoanById = exports.getMarketplace = void 0;
const client_1 = require("@prisma/client");
const pledgContract_1 = require("../utils/pledgContract");
const ethers_1 = require("ethers");
const prisma = new client_1.PrismaClient();
const getMarketplace = async (_req, res) => {
    try {
        const loans = await prisma.loan.findMany({ where: { status: 'active' } });
        res.status(200).json(loans);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch marketplace loans', error: error.message });
    }
};
exports.getMarketplace = getMarketplace;
const getLoanById = async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch loan', error: error.message });
    }
};
exports.getLoanById = getLoanById;
const createLoan = async (req, res) => {
    const { loanAmountInr, interestRate, ltv, durationInDays, collateralToken, collateralAmount, borrowerId } = req.body;
    try {
        const principal = parseFloat(loanAmountInr);
        const annualRate = parseFloat(interestRate) / 100;
        const monthlyRate = annualRate / 12;
        const numberOfPayments = Math.ceil(durationInDays / 30);
        let monthlyPayment;
        if (monthlyRate === 0) {
            monthlyPayment = principal / numberOfPayments;
        }
        else {
            monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
                (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
        }
        const collateral = await prisma.collateral.create({
            data: {
                userId: borrowerId,
                type: collateralToken,
                amount: collateralAmount,
                remainingAmount: collateralAmount,
                lockedValueInr: collateralAmount,
                lockedTxHash: '',
                status: 'pending'
            }
        });
        const loan = await prisma.loan.create({
            data: {
                borrowerId: borrowerId,
                amountInr: loanAmountInr,
                interestRate,
                ltv,
                durationMonths: durationInDays,
                monthlyPayment: monthlyPayment.toFixed(2),
                collateralId: collateral.id,
                status: 'draft'
            }
        });
        res.status(201).json({
            status: 'pending',
            loanId: loan.id,
            collateralId: collateral.id,
            loanData: {
                loanId: loan.id,
                loanAmountInr,
                interestRate,
                ltv,
                durationInDays,
                collateralToken,
                collateralAmount
            },
            monthlyPayment: monthlyPayment.toFixed(2)
        });
    }
    catch (error) {
        console.error('Error creating loan:', error);
        res.status(500).json({
            message: 'Failed to create loan',
            error: error.message
        });
    }
};
exports.createLoan = createLoan;
const confirmLoanTransaction = async (req, res) => {
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
        if (!ethers_1.ethers.isHexString(txHash, 32)) {
            res.status(400).json({ message: 'Invalid transaction hash format' });
            return;
        }
        const pledg = (0, pledgContract_1.getPledgContract)();
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
                const iface = new ethers_1.ethers.Interface(pledg.interface.fragments);
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
            }
            catch (decodeError) {
                console.error('Error decoding transaction data:', decodeError);
                res.status(400).json({ message: 'Unable to decode transaction data' });
                return;
            }
        }
        const createLoanEventSignature = ethers_1.ethers.id('LoanCreated(string,uint256,uint256,uint256,uint256,string,uint256)');
        const hasCreateLoanEvent = receipt.logs.some(log => log.topics[0] === createLoanEventSignature);
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
    }
    catch (error) {
        console.error('Error confirming loan transaction:', error);
        res.status(500).json({
            message: 'Failed to confirm loan transaction',
            error: error.message
        });
    }
};
exports.confirmLoanTransaction = confirmLoanTransaction;
const cancelLoan = async (req, res) => {
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
    }
    catch (error) {
        console.error('Error cancelling loan:', error);
        res.status(500).json({
            message: 'Failed to cancel loan',
            error: error.message
        });
    }
};
exports.cancelLoan = cancelLoan;
const payInstallment = async (req, res) => {
    const { loanId } = req.params;
    const { userId } = req.body;
    if (!loanId || !userId) {
        res.status(400).json({ message: 'loanId and userId are required' });
        return;
    }
    try {
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
        const installment = await prisma.installment.findFirst({
            where: { loanId, status: 'pending' },
            orderBy: { dueDate: 'asc' }
        });
        if (!installment) {
            res.status(400).json({ message: 'No pending installment found for this loan' });
            return;
        }
        const amount = loan.monthlyPayment;
        if (!amount) {
            res.status(500).json({ message: 'Monthly payment amount not set for this loan' });
            return;
        }
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
        const { createRazorpayOrder } = require('../services/razorpayService');
        const order = await createRazorpayOrder(Number(amount), 'INR', lenderBank.secureToken, 'loan_installment', installment.id);
        if (!order || !order.id) {
            res.status(500).json({ message: 'Failed to create Razorpay order' });
            return;
        }
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
    }
    catch (error) {
        console.error('Error in payInstallment:', error);
        res.status(500).json({ message: 'Failed to initiate installment payment', error: error.message });
    }
};
exports.payInstallment = payInstallment;
//# sourceMappingURL=loansController.js.map