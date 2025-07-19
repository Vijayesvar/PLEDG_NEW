import { Router } from 'express';
import { addWallet } from '../controllers/walletController';

const router = Router();

/**
 * @route   POST /api/v1/wallet/add-wallet
 * @desc    Add wallet endpoint
 * @access  Authenticated
 * @params
 *   - [paramName] ([type], [required/optional]): [Description]
 *   - ...
 * @returns [Description of the response]
 */
router.post('/add-wallet', addWallet);

export default router;