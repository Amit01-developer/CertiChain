import { Router } from 'express';
import { templateController } from '../controllers/template.controller';
import { requireAuth, requireOrgRole } from '../middleware/auth.middleware';

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.get('/',       requireOrgRole('STAFF', 'ADMIN', 'OWNER'), templateController.list);
router.post('/',      requireOrgRole('ADMIN', 'OWNER'),          templateController.create);
router.get('/:id',    requireOrgRole('STAFF', 'ADMIN', 'OWNER'), templateController.getById);
router.put('/:id',    requireOrgRole('ADMIN', 'OWNER'),          templateController.update);
router.delete('/:id', requireOrgRole('OWNER'),                   templateController.delete);

export default router;
