import { Router } from 'express';
import { body } from 'express-validator';
import { reviewController } from '../controllers/review.controller';
import { requireAuth, requireOrgRole } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

// Mounted at /api/organizations/:orgId/certificates/:certId
export const certReviewRouter = Router({ mergeParams: true });

certReviewRouter.use(requireAuth);

// Assign reviewers (admin only)
certReviewRouter.post(
  '/reviews',
  requireOrgRole('ADMIN', 'OWNER'),
  body('reviewerIds').isArray({ min: 1 }).withMessage('reviewerIds must be a non-empty array.'),
  validate,
  reviewController.assignReviewers,
);

// List reviews for a certificate
certReviewRouter.get(
  '/reviews',
  requireOrgRole('STAFF', 'ADMIN', 'OWNER'),
  reviewController.listReviews,
);

// Submit review decision (staff reviewer)
certReviewRouter.post(
  '/reviews/decide',
  requireOrgRole('STAFF', 'ADMIN', 'OWNER'),
  body('decision').isIn(['APPROVED', 'REJECTED']).withMessage('decision must be APPROVED or REJECTED.'),
  validate,
  reviewController.submitDecision,
);

// ─── Org-level review routes (mounted at /api/organizations/:orgId) ───────────
export const orgReviewRouter = Router({ mergeParams: true });

orgReviewRouter.use(requireAuth);

// Staff: my pending review tasks
orgReviewRouter.get(
  '/reviews/pending',
  requireOrgRole('STAFF', 'ADMIN', 'OWNER'),
  reviewController.myPendingReviews,
);

// Admin/Owner: all reviews in the org
orgReviewRouter.get(
  '/reviews',
  requireOrgRole('ADMIN', 'OWNER'),
  reviewController.orgReviews,
);
