import { Router } from 'express';
import { templateController } from '../controllers/template.controller';
import { requireAuth, requireOrgRole } from '../middleware/auth.middleware';
import { uploadLogo } from '../middleware/upload.middleware';

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.get('/',              requireOrgRole('STAFF', 'ADMIN', 'OWNER'), templateController.list);
router.post('/',             requireOrgRole('ADMIN', 'OWNER'),          templateController.create);
router.get('/:id',           requireOrgRole('STAFF', 'ADMIN', 'OWNER'), templateController.getById);
router.put('/:id',           requireOrgRole('ADMIN', 'OWNER'),          templateController.update);
router.delete('/:id',        requireOrgRole('OWNER'),                   templateController.delete);
router.post('/:id/image',    requireOrgRole('ADMIN', 'OWNER'),
  (req, res, next) => { uploadLogo(req, res, next); },                  // reuse same multer config (images ≤2 MB)
  templateController.uploadImage,
);

export default router;
