import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(__dirname, '../../../.env') });

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

function optional(key: string, fallback = ''): string {
  return process.env[key] ?? fallback;
}

export const env = {
  NODE_ENV:        optional('NODE_ENV', 'development'),
  PORT:            parseInt(optional('PORT', '4000'), 10),
  DATABASE_URL:    optional('DATABASE_URL', ''),
  JWT_SECRET:      optional('JWT_SECRET', 'dev-secret-change-in-production'),
  JWT_EXPIRES_IN:  optional('JWT_EXPIRES_IN', '7d'),
  FRONTEND_URL:    optional('FRONTEND_URL', 'http://localhost:5173'),
  BACKEND_URL:     optional('BACKEND_URL', 'http://localhost:4000'),

  STORAGE_PROVIDER:  optional('STORAGE_PROVIDER', 'local') as 'local' | 's3' | 'cloudinary',
  STORAGE_LOCAL_DIR: optional('STORAGE_LOCAL_DIR', './uploads'),
  AWS_REGION:        optional('AWS_REGION'),
  AWS_ACCESS_KEY_ID: optional('AWS_ACCESS_KEY_ID'),
  AWS_SECRET_KEY:    optional('AWS_SECRET_ACCESS_KEY'),
  AWS_S3_BUCKET:     optional('AWS_S3_BUCKET'),

  EMAIL_PROVIDER:  optional('EMAIL_PROVIDER', 'log') as 'smtp' | 'resend' | 'sendgrid' | 'log',
  EMAIL_FROM:      optional('EMAIL_FROM', 'noreply@certichain.com'),
  EMAIL_FROM_NAME: optional('EMAIL_FROM_NAME', 'CertiChain'),
  SMTP_HOST:       optional('SMTP_HOST'),
  SMTP_PORT:       parseInt(optional('SMTP_PORT', '587'), 10),
  SMTP_USER:       optional('SMTP_USER'),
  SMTP_PASS:       optional('SMTP_PASS'),
  RESEND_API_KEY:  optional('RESEND_API_KEY'),

  RATE_LIMIT_WINDOW_MS:  parseInt(optional('RATE_LIMIT_WINDOW_MS', '900000'), 10),
  RATE_LIMIT_MAX:        parseInt(optional('RATE_LIMIT_MAX', '100'), 10),
  VERIFY_RATE_LIMIT_MAX: parseInt(optional('VERIFY_RATE_LIMIT_MAX', '30'), 10),

  GOOGLE_CLIENT_ID:     optional('GOOGLE_CLIENT_ID'),
  GOOGLE_CLIENT_SECRET: optional('GOOGLE_CLIENT_SECRET'),

  FIREBASE_PROJECT_ID:   optional('FIREBASE_PROJECT_ID'),
  FIREBASE_CLIENT_EMAIL: optional('FIREBASE_CLIENT_EMAIL'),
  FIREBASE_PRIVATE_KEY:  optional('FIREBASE_PRIVATE_KEY'),

  get isDev()  { return this.NODE_ENV === 'development'; },
  get isProd() { return this.NODE_ENV === 'production'; },
};
