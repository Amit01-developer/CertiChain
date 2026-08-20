import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import app from '../app';

// Mock Prisma to avoid needing a real DB in unit tests
vi.mock('../config/prisma', () => {
  const users = new Map<string, any>();

  return {
    default: {
      user: {
        findUnique: vi.fn(({ where }) => {
          if (where.email) return Promise.resolve(users.get(where.email) ?? null);
          if (where.id)    return Promise.resolve([...users.values()].find(u => u.id === where.id) ?? null);
          return Promise.resolve(null);
        }),
        findFirst: vi.fn(({ where }) => {
          if (where?.emailToken) return Promise.resolve([...users.values()].find(u => u.emailToken === where.emailToken) ?? null);
          if (where?.resetToken) return Promise.resolve([...users.values()].find(u => u.resetToken === where.resetToken) ?? null);
          return Promise.resolve(null);
        }),
        create: vi.fn(({ data }) => {
          const user = { id: `user-${Date.now()}`, ...data };
          users.set(data.email, user);
          return Promise.resolve(user);
        }),
        update: vi.fn(({ where, data }) => {
          const user = users.get(where.email) ?? [...users.values()].find(u => u.id === where.id);
          if (user) {
            Object.assign(user, data);
            return Promise.resolve(user);
          }
          return Promise.resolve(null);
        }),
      },
      organization: {
        create: vi.fn(({ data }) => Promise.resolve({ id: `org-${Date.now()}`, ...data })),
      },
      orgMember: {
        findFirst: vi.fn(() => Promise.resolve(null)),
      },
      auditLog: {
        create: vi.fn(() => Promise.resolve({})),
      },
      $connect:    vi.fn(),
      $disconnect: vi.fn(),
    },
  };
});

vi.mock('../services/email.service', () => ({
  emailService: {
    send:                  vi.fn(() => Promise.resolve()),
    verificationEmail:     vi.fn(() => ({ subject: 'test', html: '<p>test</p>' })),
    passwordResetEmail:    vi.fn(() => ({ subject: 'test', html: '<p>test</p>' })),
    certificateIssuedEmail: vi.fn(() => ({ to: '', subject: '', html: '' })),
  },
}));

describe('Auth API', () => {
  const testEmail    = `test${Date.now()}@example.com`;
  const testPassword = 'Test@12345';

  describe('POST /api/auth/register', () => {
    it('registers a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name:             'Test User',
          email:            testEmail,
          password:         testPassword,
          organizationName: 'Test Org',
          organizationType: 'University',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('verify your email');
    });

    it('rejects duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name:             'Test User',
          email:            testEmail,
          password:         testPassword,
          organizationName: 'Test Org 2',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('rejects weak password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test', email: 'other@test.com', password: 'weak', organizationName: 'Org' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test', email: 'notanemail', password: testPassword, organizationName: 'Org' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('rejects wrong credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: 'WrongPass@1' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('rejects unauthenticated request', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('rejects invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here');
      expect(res.status).toBe(401);
    });
  });
});
