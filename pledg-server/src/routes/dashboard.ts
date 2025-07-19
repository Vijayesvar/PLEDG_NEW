import { Router, RequestHandler } from 'express';
import { getBorrowerTransactions, getDashboardOverview } from '../controllers/dashboardController';
import { auth } from '../middleware/auth';

const router = Router();

router.use(auth as RequestHandler);

/**
 * @route   GET /api/v1/dashboard
 * @desc    Get dashboard overview endpoint
 * @access  Authenticated
 * @params
 *   - [paramName] ([type], [required/optional]): [Description]
 *   - ...
 * @returns [Description of the response]
 */
router.get('/', getDashboardOverview);

/**
 * @route   GET /api/v1/dashboard/transactions/borrower
 * @desc    Get borrower transactions endpoint
 * @access  Authenticated
 * @params
 *   - [paramName] ([type], [required/optional]): [Description]
 *   - ...
 * @returns [Description of the response]
 */
router.get('/transactions/borrower', getBorrowerTransactions);

/**
 * @route   GET /api/v1/dashboard/transactions/borrower/:loanId
 * @desc    Get borrower transactions by loan ID endpoint
 * @access  Authenticated
 * @params
 *   - [paramName] ([type], [required/optional]): [Description]
 *   - ...
 * @returns [Description of the response]
 */
router.get('/transactions/borrower/:loanId', (_req, res) => {
  res.status(501).json({ message: 'Get borrower transactions by loan ID endpoint - not implemented' });
});

/**
 * @route   GET /api/v1/dashboard/transactions/lender
 * @desc    Get lender transactions endpoint
 * @access  Authenticated
 * @params
 *   - [paramName] ([type], [required/optional]): [Description]
 *   - ...
 * @returns [Description of the response]
 */
router.get('/transactions/lender', (_req, res) => {
  res.status(501).json({ message: 'Get lender transactions endpoint - not implemented' });
});

/**
 * @route   GET /api/v1/dashboard/transactions/lender/:loanId
 * @desc    Get lender transactions by loan ID endpoint
 * @access  Authenticated
 * @params
 *   - [paramName] ([type], [required/optional]): [Description]
 *   - ...
 * @returns [Description of the response]
 */
router.get('/transactions/lender/:loanId', (_req, res) => {
  res.status(501).json({ message: 'Get lender transactions by loan ID endpoint - not implemented' });
});

export default router; 