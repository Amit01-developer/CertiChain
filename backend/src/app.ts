import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env';
import { logger } from './utils/logger';
import prisma from './config/prisma';
import { swaggerDocument } from './config/swagger';

import authRoutes        from './routes/auth.routes';
import orgRoutes         from './routes/organization.routes';
import certRoutes        from './routes/certificate.routes';
import templateRoutes    from './routes/template.routes';
import recipientRoutes   from './routes/recipient.routes';
import verifyRoutes      from './routes/verify.routes';
import adminRoutes       from './routes/admin.routes';

import { errorHandler, notFoundHandler } from './middleware/error.middleware';

const app = express();

// ── Security ─────────────────────────────────────────────────────────────────
app.use(helmet());
app.set('trust proxy', 1);

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin:      env.FRONTEND_URL,
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Parsing ───────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Logging ───────────────────────────────────────────────────────────────────
app.use(morgan(env.isDev ? 'dev' : 'combined', {
  stream: { write: (msg) => logger.info(msg.trim()) },
}));

// ── Static uploads (local storage) ───────────────────────────────────────────
app.use('/uploads', express.static(path.resolve(env.STORAGE_LOCAL_DIR)));

// ── Global rate limit ─────────────────────────────────────────────────────────
app.use(rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max:      env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders:   false,
}));

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  let dbStatus = 'ok';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'error';
  }
  const status = dbStatus === 'ok' ? 'ok' : 'degraded';
  res.status(dbStatus === 'ok' ? 200 : 503).json({
    status,
    timestamp: new Date().toISOString(),
    version:   process.env.npm_package_version ?? '1.0.0',
    services: { database: dbStatus },
  });
});

// ── API docs (Swagger UI) ─────────────────────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customSiteTitle: 'CertiChain API Docs',
}));

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/verify',     verifyRoutes);
app.use('/api/admin',      adminRoutes);

// Org-scoped routes — all under /api/organizations/:orgId/...
app.use('/api/organizations/:orgId',              orgRoutes);
app.use('/api/organizations/:orgId/certificates', certRoutes);
app.use('/api/organizations/:orgId/templates',    templateRoutes);
app.use('/api/organizations/:orgId/recipients',   recipientRoutes);

// ── Error handling ────────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
