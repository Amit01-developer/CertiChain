import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { requireAuth, requireSuperAdmin } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth, requireSuperAdmin);

router.get('/stats',             adminController.getStats);
router.get('/organizations',     adminController.getOrganizations);
router.post('/organizations/:id/suspend',   adminController.suspendOrg);
router.post('/organizations/:id/unsuspend', adminController.unsuspendOrg);

export default router;
