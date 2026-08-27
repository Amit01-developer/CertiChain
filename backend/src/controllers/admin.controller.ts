import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { blockchainService } from '../services/blockchain';
import { env } from '../config/env';
import { ok } from '../utils/apiResponse';
import { str } from '../utils/param';

export const adminController = {

  async getStats(req: Request, res: Response) {
    const [
      orgs, users, certs, activeCerts, revokedCerts,
      blockchainConfirmed, blockchainFailed, blockchainPending,
    ] = await Promise.all([
      prisma.organization.count(),
      prisma.user.count(),
      prisma.certificate.count(),
      prisma.certificate.count({ where: { status: 'ACTIVE' } }),
      prisma.certificate.count({ where: { status: 'REVOKED' } }),
      prisma.certificate.count({ where: { blockchainStatus: 'CONFIRMED' } }),
      prisma.certificate.count({ where: { blockchainStatus: 'FAILED' } }),
      prisma.certificate.count({ where: { blockchainStatus: 'PENDING' } }),
    ]);

    // Blockchain connectivity check (non-blocking)
    const bcHealth = blockchainService.isEnabled
      ? await blockchainService.healthCheck()
      : { connected: false };

    return ok(res, {
      orgs, users, certs, activeCerts, revokedCerts,
      blockchain: {
        enabled:   env.BLOCKCHAIN_ENABLED,
        network:   env.BLOCKCHAIN_ENABLED ? 'Polygon Amoy' : null,
        connected: bcHealth.connected,
        blockNumber: (bcHealth as any).blockNumber ?? null,
        confirmed:   blockchainConfirmed,
        failed:      blockchainFailed,
        pending:     blockchainPending,
        explorerUrl: env.BLOCKCHAIN_EXPLORER_URL || null,
        contractAddress: env.BLOCKCHAIN_CONTRACT_ADDRESS || null,
      },
    });
  },

  async getOrganizations(req: Request, res: Response) {
    const page  = parseInt(req.query.page as string ?? '1', 10);
    const limit = 20;

    const [orgs, total] = await Promise.all([
      prisma.organization.findMany({
        include: { _count: { select: { certificates: true, members: true } } },
        orderBy: { createdAt: 'desc' },
        skip:    (page - 1) * limit,
        take:    limit,
      }),
      prisma.organization.count(),
    ]);

    return ok(res, { orgs, total, page, pages: Math.ceil(total / limit) });
  },

  async suspendOrg(req: Request, res: Response) {
    const id = str(req.params.id);
    const org = await prisma.organization.update({ where: { id }, data: { suspended: true } });
    return ok(res, org, 'Organization suspended.');
  },

  async unsuspendOrg(req: Request, res: Response) {
    const id = str(req.params.id);
    const org = await prisma.organization.update({ where: { id }, data: { suspended: false } });
    return ok(res, org, 'Organization reinstated.');
  },
};
