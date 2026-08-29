import { Router } from 'express';
import { organizationController } from '../controllers/organization.controller';
import { invitationController }    from '../controllers/invitation.controller';
import { requireAuth, requireOrgRole } from '../middleware/auth.middleware';
import { uploadLogo } from '../middleware/upload.middleware';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.middleware';

const router = Router({ mergeParams: true });

router.use(requireAuth);

// Organization profile
router.get('/',      requireOrgRole('STAFF', 'ADMIN', 'OWNER'), organizationController.getMyOrg);
router.put('/',      requireOrgRole('ADMIN', 'OWNER'),          organizationController.updateOrg);
router.post('/logo', requireOrgRole('ADMIN', 'OWNER'), (req, res, next) => { uploadLogo(req, res, next); }, organizationController.uploadLogo);

// Member management — ADMIN and OWNER (not just OWNER anymore)
router.get('/members',            requireOrgRole('STAFF', 'ADMIN', 'OWNER'), invitationController.listMembers);
router.delete('/members/:memberId', requireOrgRole('ADMIN', 'OWNER'),        invitationController.removeMember);

// Legacy addMember (direct add by email of existing user — kept for backward compatibility)
router.post(
  '/members',
  requireOrgRole('ADMIN', 'OWNER'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required.'),
  validate,
  organizationController.addMember,
);

// Staff invitations — ADMIN and OWNER can invite
router.post(
  '/invitations',
  requireOrgRole('ADMIN', 'OWNER'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
  validate,
  invitationController.invite,
);
router.delete('/invitations/:inviteId', requireOrgRole('ADMIN', 'OWNER'), invitationController.cancelInvitation);

// Analytics and audit — ADMIN+
router.get('/analytics',  requireOrgRole('ADMIN', 'OWNER'), organizationController.getAnalytics);
router.get('/audit-logs', requireOrgRole('ADMIN', 'OWNER'), organizationController.getAuditLogs);

// Staff dashboard data — available to all members
router.get('/staff-dashboard', requireOrgRole('STAFF', 'ADMIN', 'OWNER'), organizationController.getStaffDashboard);

export default router;
