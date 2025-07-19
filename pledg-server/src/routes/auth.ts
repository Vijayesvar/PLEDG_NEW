import { Router } from 'express';
import {
  googleLogin,
  login,
  getMe,
  registerBasicInfo,
  registerBank,
  registerKyc,
  sendAadhaarOtp,
  logout
} from '../controllers/authController';

const router = Router();

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login endpoint
 * @access  Public
 * @params
 *   - [paramName] ([type], [required/optional]): [Description]
 *   - ...
 * @returns [Description of the response]
 */
router.post('/login', login);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout endpoint
 * @access  Authenticated
 */
router.post('/logout', logout);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user information
 * @access  Authenticated
 * @params
 *   - [paramName] ([type], [required/optional]): [Description]
 *   - ...
 * @returns [Description of the response]
 */
router.get('/me', getMe);

/**
 * @route   POST /api/v1/auth/google-login
 * @desc    Google login endpoint
 * @access  Public
 * @params
 *   - [paramName] ([type], [required/optional]): [Description]
 *   - ...
 * @returns [Description of the response]
 */
router.post('/google-login', googleLogin);

/**
 * @route   POST /api/v1/auth/register/basic
 * @desc    Register basic info endpoint
 * @access  Public
 * @params
 *   - [paramName] ([type], [required/optional]): [Description]
 *   - ...
 * @returns [Description of the response]
 */
router.post('/register/basic', registerBasicInfo);

/**
 * @route   POST /api/v1/auth/register/bank
 * @desc    Register bank account endpoint
 * @access  Authenticated
 * @params
 *   - [paramName] ([type], [required/optional]): [Description]
 *   - ...
 * @returns [Description of the response]
 */
router.post('/register/bank', registerBank);

/**
 * @route   POST /api/v1/auth/register/kyc
 * @desc    Register kyc endpoint
 * @access  Authenticated
 * @params
 *   - [paramName] ([type], [required/optional]): [Description]
 */
router.post('/register/kyc', registerKyc);

/**
 * @route   POST /api/v1/auth/aadhaar/otp
 * @desc    Send Aadhaar OTP endpoint
 * @access  Authenticated
 * @params
 *   - aadhaarNumber (string, required): 12-digit Aadhaar number
 * @returns Success message with reference ID
 */
router.post('/aadhaar/otp', sendAadhaarOtp);

export default router; 