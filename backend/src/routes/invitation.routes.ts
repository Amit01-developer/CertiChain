import { Router } from 'express';
import { body } from 'express-validator';
import { invitationController } from '../controllers/invitation.controller';
import { requireAuth, requireOrgRole } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

// ─── Organization-scoped routes (mounted at /api/organizations/:orgId) ───────
export const orgInvitationRouter = Router({ mergeParams: true });

orgInvitationRouter.use(requireAuth);

// List members + pending invitations
orgInvitationRouter.get(
  '/members',
  requireOrgRole('STAFF', 'ADMIN', 'OWNER'),
  invitationController.listMembers,
);

// Invite a staff member by email
orgInvitationRouter.post(
  '/invitations',
  requireOrgRole('ADMIN', 'OWNER'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
  validate,
  invitationController.invite,
);

// Remove a member
orgInvitationRouter.delete(
  '/members/:memberId',
  requireOrgRole('ADMIN', 'OWNER'),
  invitationController.removeMember,
);

// Cancel a pending invitation
orgInvitationRouter.delete(
  '/invitations/:inviteId',
  requireOrgRole('ADMIN', 'OWNER'),
  invitationController.cancelInvitation,
);

// ─── Public routes (mounted at /api/invitations) ──────────────────────────────
export const publicInvitationRouter = Router();

// Preview invitation details (so frontend can show org name etc. before accepting)
publicInvitationRouter.get('/preview', invitationController.preview);

// Accept invitation
publicInvitationRouter.post(
  '/accept',
  body('token').notEmpty().withMessage('Token is required.'),
  validate,
  invitationController.accept,
);
