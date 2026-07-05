import express from 'express';
import { body, query } from 'express-validator';
import { validate } from '../middleware/validate.middleware.js';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.middleware.js';
import * as authCtrl from '../controllers/auth.controller.js';

const router = express.Router();

// Validators
const registerValidator = validate([
  body('firstName').trim().notEmpty().withMessage('First name required'),
  body('lastName').trim().notEmpty().withMessage('Last name required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase and number'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone required'),
]);

const loginValidator = validate([
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password required'),
]);

const forgotValidator = validate([
  body('email').isEmail().normalizeEmail(),
]);

const resetValidator = validate([
  body('token').notEmpty(),
  body('password').isLength({ min: 8 }).matches(/(?=.*[A-Z])(?=.*\d)/),
]);

// Public routes
router.post('/register', registerValidator, authCtrl.register);
router.post('/login', loginValidator, authCtrl.login);
router.post('/refresh', authCtrl.refreshToken);
router.post('/logout', authCtrl.logout);
router.get('/verify-email', authCtrl.verifyEmail);
router.post('/forgot-password', forgotValidator, authCtrl.forgotPassword);
router.post('/reset-password', resetValidator, authCtrl.resetPassword);

// Protected routes
router.get('/me', authenticate, authCtrl.getMe);
router.put('/me', authenticate, authCtrl.updateProfile);
router.post('/resend-verification', authenticate, authCtrl.resendVerification);
router.put('/change-password', authenticate, validate([
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }).matches(/(?=.*[A-Z])(?=.*\d)/),
]), authCtrl.changePassword);

export default router;
