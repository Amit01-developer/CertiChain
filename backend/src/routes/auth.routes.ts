import { Router } from 'express';
import { body } from 'express-validator';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/register',
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('email').isEmail().withMessage('Valid email is required.').normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain a number.'),
  body('organizationName').trim().notEmpty().withMessage('Organization name is required.'),
  validate,
  authController.register
);

router.post('/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  validate,
  authController.login
);

router.post('/forgot-password',
  body('email').isEmail().normalizeEmail(),
  validate,
  authController.forgotPassword
);

router.post('/reset-password',
  body('token').notEmpty(),
  body('password').isLength({ min: 8 }),
  validate,
  authController.resetPassword
);

router.get('/verify-email', authController.verifyEmail);

router.get('/me', requireAuth, authController.me);

router.put('/me/password',
  requireAuth,
  body('currentPassword').notEmpty().withMessage('Current password is required.'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('New password must contain an uppercase letter.')
    .matches(/[0-9]/).withMessage('New password must contain a number.'),
  validate,
  authController.changePassword
);

// Firebase Google login — receives a Firebase ID token from the frontend
router.post('/firebase',
  body('idToken').notEmpty().withMessage('Firebase ID token is required.'),
  validate,
  authController.firebaseLogin
);

export default router;
