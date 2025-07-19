import { RequestHandler, Router } from 'express';
import {
  getMarketplace,
  getLoanById,
  createLoan,
  confirmLoanTransaction,
  cancelLoan,
  payInstallment
} from '../controllers/loansController';
import { initiateFunding } from '../controllers/fundingController';
import { razorpayFundingWebhook } from '../controllers/razorpayWebhookController';
import { auth } from '../middleware/auth';
import { validateCreateLoan } from '../validator/loans';
import { AuthenticatedRequest } from '../types/auth';

const router = Router();

router.use(auth as RequestHandler);

/**
 * @route   GET /api/v1/loans/marketplace
 * @desc    Get loan marketplace endpoint
 * @access  Authenticated
 * @params
 *   - [paramName] ([type], [required/optional]): [Description]
 *   - ...
 * @returns [Description of the response]
 */
router.get('/marketplace', getMarketplace);

/**
 * @route   GET /api/v1/loans/:loanId
 * @desc    Get loan by ID endpoint
 * @access  Authenticated
 * @params
 *   - [paramName] ([type], [required/optional]): [Description]
 *   - ...
 * @returns [Description of the response]
 */
router.get('/:loanId', getLoanById);

/**
 * @route   POST /api/v1/loans/create-loan
 * @desc    Create loan endpoint
 * @access  Authenticated
 * @params
 *   - [paramName] ([type], [required/optional]): [Description]
 *   - ...
 * @returns [Description of the response]
 */
router.post(
  '/create-loan',
  validateCreateLoan,
  (req, res) => createLoan(req as AuthenticatedRequest, res)
);

/**
 * @route   POST /api/v1/loans/confirm-transaction
 * @desc    Confirm loan transaction endpoint
 * @access  Authenticated
 * @params
 *   - [paramName] ([type], [required/optional]): [Description]
 *   - ...
 * @returns [Description of the response]
 */
router.post('/confirm-transaction', confirmLoanTransaction);

/**
 * @route   DELETE /api/v1/loans/:loanId
 * @desc    Cancel loan endpoint
 * @access  Authenticated
 * @params
 *   - [paramName] ([type], [required/optional]): [Description]
 *   - ...
 * @returns [Description of the response]
 */
router.delete('/:loanId', cancelLoan);

/**
 * @route   POST /api/v1/loans/fund-loan/:loanId
 * @desc    Fund loan endpoint
 * @access  Authenticated
 * @params
 *   - [paramName] ([type], [required/optional]): [Description]
 *   - ...
 * @returns [Description of the response]
 */
router.post('/fund-loan/:loanId', initiateFunding);

/**
 * @route   POST /api/v1/loans/pay-installment/:loanId
 * @desc    Pay installment endpoint
 * @access  Authenticated
 * @params
 *   - [paramName] ([type], [required/optional]): [Description]
 *   - ...
 * @returns [Description of the response]
 */
router.post('/pay-installment/:loanId', payInstallment);

/**
 * @route   POST /api/v1/loans/verify-funding-webhook
 * @desc    Verify funding webhook endpoint
 * @access  Authenticated
 * @params
 *   - [paramName] ([type], [required/optional]): [Description]
 *   - ...
 * @returns [Description of the response]
 */
router.post('/verify-funding-webhook', razorpayFundingWebhook);

export default router; 