import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(__dirname, '../../../.env') });

export function sanitizeCredential(value?: string): string {
  return (value ?? '').replace(/\s+/g, '').trim();
}

export function normalizeBaseUrl(value?: string): string {
  return (value ?? '').trim().replace(/\/+$/, '');
}

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

function optional(key: string, fallback = ''): string {
  return process.env[key] ?? fallback;
}

export function resolveEmailProvider(emailProvider?: string, smtpHost?: string): 'smtp' | 'resend' | 'sendgrid' | 'log' {
  const configured = (emailProvider ?? '').trim().toLowerCase();
  if (configured === 'smtp' || configured === 'resend' || configured === 'sendgrid' || configured === 'log') {
    return configured as 'smtp' | 'resend' | 'sendgrid' | 'log';
  }

  return smtpHost ? 'smtp' : 'log';
}

export function resolveSmtpSecure(port: number, configuredValue?: string): boolean {
  if (configuredValue !== undefined && configuredValue !== null && configuredValue !== '') {
    return configuredValue.toLowerCase() === 'true';
  }

  return port === 465;
}

const smtpPort = parseInt(optional('SMTP_PORT', '587'), 10);

export const env = {
  NODE_ENV:        optional('NODE_ENV', 'development'),
  PORT:            parseInt(optional('PORT', '4000'), 10),
  DATABASE_URL:    optional('DATABASE_URL', ''),
  DIRECT_URL:      optional('DIRECT_URL', optional('DATABASE_URL', '')),
  JWT_SECRET:      optional('JWT_SECRET', 'dev-secret-change-in-production'),
  JWT_EXPIRES_IN:  optional('JWT_EXPIRES_IN', '7d'),
  FRONTEND_URL:    normalizeBaseUrl(optional('FRONTEND_URL', 'http://localhost:5173')),
  BACKEND_URL:     normalizeBaseUrl(optional('BACKEND_URL', 'http://localhost:4000')),

  STORAGE_PROVIDER:  optional('STORAGE_PROVIDER', 'local') as 'local' | 's3' | 'cloudinary',
  STORAGE_LOCAL_DIR: optional('STORAGE_LOCAL_DIR', './uploads'),
  AWS_REGION:        optional('AWS_REGION'),
  AWS_ACCESS_KEY_ID: optional('AWS_ACCESS_KEY_ID'),
  AWS_SECRET_KEY:    optional('AWS_SECRET_ACCESS_KEY'),
  AWS_S3_BUCKET:     optional('AWS_S3_BUCKET'),

  EMAIL_PROVIDER:  resolveEmailProvider(optional('EMAIL_PROVIDER'), optional('SMTP_HOST')) as 'smtp' | 'resend' | 'sendgrid' | 'log',
  EMAIL_FROM:      optional('EMAIL_FROM', 'noreply@certichain.com').trim(),
  EMAIL_FROM_NAME: optional('EMAIL_FROM_NAME', 'CertiChain').trim(),
  SMTP_HOST:       optional('SMTP_HOST').trim(),
  SMTP_PORT:       smtpPort,
  SMTP_SECURE:     resolveSmtpSecure(smtpPort, optional('SMTP_SECURE')),
  SMTP_REQUIRE_TLS: optional('SMTP_REQUIRE_TLS', 'true').toLowerCase() !== 'false',
  SMTP_TLS_REJECT_UNAUTHORIZED: optional('SMTP_TLS_REJECT_UNAUTHORIZED', 'true').toLowerCase() !== 'false',
  SMTP_USER:       optional('SMTP_USER').trim(),
  SMTP_PASS:       sanitizeCredential(optional('SMTP_PASS')),
  RESEND_API_KEY:  sanitizeCredential(optional('RESEND_API_KEY')),

  RATE_LIMIT_WINDOW_MS:  parseInt(optional('RATE_LIMIT_WINDOW_MS', '900000'), 10),
  RATE_LIMIT_MAX:        parseInt(optional('RATE_LIMIT_MAX', '100'), 10),
  VERIFY_RATE_LIMIT_MAX: parseInt(optional('VERIFY_RATE_LIMIT_MAX', '30'), 10),

  BLOCKCHAIN_ENABLED:          optional('BLOCKCHAIN_ENABLED', 'false') === 'true',
  BLOCKCHAIN_RPC_URL:          optional('BLOCKCHAIN_RPC_URL', 'https://rpc-amoy.polygon.technology'),
  BLOCKCHAIN_PRIVATE_KEY:      sanitizeCredential(optional('BLOCKCHAIN_PRIVATE_KEY')),
  BLOCKCHAIN_CONTRACT_ADDRESS: optional('BLOCKCHAIN_CONTRACT_ADDRESS').trim(),
  BLOCKCHAIN_CHAIN_ID:         parseInt(optional('BLOCKCHAIN_CHAIN_ID', '80002'), 10),
  BLOCKCHAIN_EXPLORER_URL:     optional('BLOCKCHAIN_EXPLORER_URL', 'https://amoy.polygonscan.com'),

  GOOGLE_CLIENT_ID:     optional('GOOGLE_CLIENT_ID'),
  GOOGLE_CLIENT_SECRET: optional('GOOGLE_CLIENT_SECRET'),

  FIREBASE_PROJECT_ID:   optional('FIREBASE_PROJECT_ID'),
  FIREBASE_CLIENT_EMAIL: optional('FIREBASE_CLIENT_EMAIL'),
  FIREBASE_PRIVATE_KEY:  optional('FIREBASE_PRIVATE_KEY'),

  get isDev()  { return this.NODE_ENV === 'development'; },
  get isProd() { return this.NODE_ENV === 'production'; },
};
