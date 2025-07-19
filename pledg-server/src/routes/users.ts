import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  createOrUpdateUser,
  deleteUser
} from '../controllers/usersController';

const router = Router();

/**
 * @route   GET /api/v1/users
 * @desc    Get all users endpoint
 * @access  Authenticated
 * @params
 *   - [paramName] ([type], [required/optional]): [Description]
 *   - ...
 * @returns [Description of the response]
 */
router.get('/', getAllUsers);

/**
 * @route   GET /api/v1/users/:userId
 * @desc    Get user by ID endpoint
 * @access  Authenticated
 * @params
 *   - [paramName] ([type], [required/optional]): [Description]
 *   - ...
 * @returns [Description of the response]
 */
router.get('/:userId', getUserById);

/**
 * @route   POST /api/v1/users/:userId
 * @desc    Create/Update user endpoint
 * @access  Authenticated
 * @params
 *   - [paramName] ([type], [required/optional]): [Description]
 *   - ...
 * @returns [Description of the response]
 */
router.post('/:userId', createOrUpdateUser);

/**
 * @route   DELETE /api/v1/users/:userId
 * @desc    Delete user endpoint
 * @access  Authenticated
 * @params
 *   - [paramName] ([type], [required/optional]): [Description]
 *   - ...
 * @returns [Description of the response]
 */
router.delete('/:userId', deleteUser);

export default router; 