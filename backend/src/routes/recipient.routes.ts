import { Router } from 'express';
import { recipientController } from '../controllers/recipient.controller';
import { requireAuth, requireOrgRole } from '../middleware/auth.middleware';

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.get('/',     requireOrgRole('STAFF', 'ADMIN', 'OWNER'), recipientController.list);
router.get('/:id',  requireOrgRole('STAFF', 'ADMIN', 'OWNER'), recipientController.getById);

export default router;
