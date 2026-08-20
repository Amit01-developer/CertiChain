import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../app';

const activeCert = {
  id: 'cert-1',
  certificateId: 'CC-2026-ACTIVE01',
  title: 'Certificate of Completion',
  issueDate: new Date('2026-01-01'),
  expiryDate: null,
  status: 'ACTIVE',
  pdfUrl: null,
  qrCodeUrl: null,
  verificationUrl: 'http://localhost:5173/verify/CC-2026-ACTIVE01',
  organization: { id: 'org-1', name: 'Test Org', logoUrl: null, website: null, type: 'University' },
  recipient:    { name: 'Test Recipient' },
  revocation:   null,
};

const revokedCert = {
  ...activeCert,
  certificateId: 'CC-2026-REVOKED01',
  status: 'REVOKED',
  revocation: {
    reason:    'Issued in error.',
    revokedAt: new Date('2026-02-01'),
  },
};

vi.mock('../config/prisma', () => ({
  default: {
    certificate: {
      findUnique: vi.fn(({ where }) => {
        if (where.certificateId === 'CC-2026-ACTIVE01')  return Promise.resolve(activeCert);
        if (where.certificateId === 'CC-2026-REVOKED01') return Promise.resolve(revokedCert);
        return Promise.resolve(null);
      }),
      update: vi.fn(() => Promise.resolve({})),
    },
    verificationLog: {
      create: vi.fn(() => Promise.resolve({})),
    },
  },
}));

describe('GET /api/verify/:certificateId', () => {
  it('returns verified for an active certificate', async () => {
    const res = await request(app).get('/api/verify/CC-2026-ACTIVE01');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.verified).toBe(true);
    expect(res.body.status).toBe('ACTIVE');
    expect(res.body.data.certificateId).toBe('CC-2026-ACTIVE01');
    expect(res.body.data.recipientName).toBe('Test Recipient');
  });

  it('returns revoked status for a revoked certificate', async () => {
    const res = await request(app).get('/api/verify/CC-2026-REVOKED01');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.verified).toBe(false);
    expect(res.body.status).toBe('REVOKED');
    expect(res.body.data.revocation.reason).toBe('Issued in error.');
  });

  it('returns 404 for unknown certificate ID', async () => {
    const res = await request(app).get('/api/verify/CC-0000-UNKNOWN');

    expect(res.status).toBe(404);
    expect(res.body.verified).toBe(false);
    expect(res.body.status).toBe('NOT_FOUND');
  });
});
