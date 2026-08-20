import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { verifyController } from '../controllers/verify.controller';
import { env } from '../config/env';

const router = Router();

const verifyLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max:      env.VERIFY_RATE_LIMIT_MAX,
  message:  { success: false, message: 'Too many verification requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

// Public — no auth required
router.get('/:certificateId', verifyLimiter, verifyController.verify);

export default router;
