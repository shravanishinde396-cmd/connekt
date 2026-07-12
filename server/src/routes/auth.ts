import { Router } from 'express';
import {
  register,
  login,
  refresh,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getCurrentUser,
} from '../controllers/auth.js';
import { validate } from '../middlewares/validate.js';
import { authenticateJWT } from '../middlewares/auth.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../validators/auth.js';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/verify-email', validate(verifyEmailSchema), verifyEmail);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.get('/me', authenticateJWT as any, getCurrentUser as any);

export default router;
