import { Router } from 'express';
import { organizationController } from '../controllers/organization.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireOrgRole } from '../middleware/auth.middleware';
import { uploadLogo } from '../middleware/upload.middleware';

const router = Router({ mergeParams: true });

// All org routes require auth + org membership
router.use(requireAuth);

router.get('/',         requireOrgRole('STAFF', 'ADMIN', 'OWNER'), organizationController.getMyOrg);
router.put('/',         requireOrgRole('ADMIN', 'OWNER'),          organizationController.updateOrg);
router.post('/logo',    requireOrgRole('ADMIN', 'OWNER'), (req, res, next) => { uploadLogo(req, res, next); }, organizationController.uploadLogo);
router.post('/members', requireOrgRole('OWNER'),                   organizationController.addMember);
router.delete('/members/:memberId', requireOrgRole('OWNER'),       organizationController.removeMember);
router.get('/analytics', requireOrgRole('ADMIN', 'OWNER'),         organizationController.getAnalytics);
router.get('/audit-logs', requireOrgRole('ADMIN', 'OWNER'),        organizationController.getAuditLogs);

export default router;
