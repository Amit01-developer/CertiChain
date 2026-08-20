import { Router } from 'express';
import { body } from 'express-validator';
import { certificateController } from '../controllers/certificate.controller';
import { requireAuth, requireOrgRole } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { uploadCsv } from '../middleware/upload.middleware';

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.get('/',  requireOrgRole('STAFF', 'ADMIN', 'OWNER'), certificateController.list);

router.post('/',
  requireOrgRole('STAFF', 'ADMIN', 'OWNER'),
  body('recipientName').trim().notEmpty().withMessage('Recipient name is required.'),
  body('recipientEmail').isEmail().normalizeEmail().withMessage('Valid recipient email is required.'),
  body('title').trim().notEmpty().withMessage('Certificate title is required.'),
  body('issueDate').isISO8601().withMessage('Valid issue date is required.'),
  validate,
  certificateController.create
);

router.post('/bulk',
  requireOrgRole('ADMIN', 'OWNER'),
  (req, res, next) => { uploadCsv(req, res, next); },
  certificateController.bulkCreate
);

router.get('/:id',  requireOrgRole('STAFF', 'ADMIN', 'OWNER'), certificateController.getById);

router.post('/:id/revoke',
  requireOrgRole('ADMIN', 'OWNER'),
  body('reason').trim().notEmpty().withMessage('Revocation reason is required.'),
  validate,
  certificateController.revoke
);

router.get('/:id/download', requireOrgRole('STAFF', 'ADMIN', 'OWNER'), certificateController.downloadPdf);

export default router;
