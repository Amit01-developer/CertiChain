import multer from 'multer';
import path from 'path';
import { env } from '../config/env';

const ALLOWED_IMAGES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
const ALLOWED_CSV    = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];

const storage = multer.memoryStorage();

function makeFilter(allowed: string[]) {
  return (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: ${allowed.join(', ')}`));
    }
  };
}

export const uploadLogo = multer({
  storage,
  limits:     { fileSize: 2 * 1024 * 1024 },
  fileFilter: makeFilter(ALLOWED_IMAGES),
}).single('logo');

export const uploadCsv = multer({
  storage,
  limits:     { fileSize: 5 * 1024 * 1024 },
  fileFilter: makeFilter(ALLOWED_CSV),
}).single('file');
