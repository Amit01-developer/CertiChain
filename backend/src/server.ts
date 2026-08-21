import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import prisma from './config/prisma';

async function start() {
  await prisma.$connect();
  logger.info('✓ Database connected');

  const server = app.listen(env.PORT, () => {
    logger.info(`✓ CertiChain API running on port ${env.PORT} [${env.NODE_ENV}]`);
    logger.info(`  Health: http://localhost:${env.PORT}/health`);
    logger.info(`  API:    http://localhost:${env.PORT}/api`);
  });

  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received — shutting down gracefully');
    server.close(async () => {
      await prisma.$disconnect();
      logger.info('Server closed');
      process.exit(0);
    });
  });
}

start().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
