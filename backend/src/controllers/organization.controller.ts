import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { storageService } from '../services/storage.service';
import { audit } from '../utils/auditLog';
import { ok, notFound, forbidden } from '../utils/apiResponse';
import { str } from '../utils/param';

export const organizationController = {

  async getMyOrg(req: Request, res: Response) {
    const orgId = req.orgId!;
    const org   = await prisma.organization.findUnique({
      where:   { id: orgId },
      include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } },
    });
    if (!org) return notFound(res, 'Organization not found.');
    return ok(res, org);
  },

  async updateOrg(req: Request, res: Response) {
    const orgId = req.orgId!;
    const { name, type, website, description, email, phone, address } = req.body;

    const org = await prisma.organization.update({
      where: { id: orgId },
      data:  { name, type, website, description, email, phone, address },
    });

    await audit({ userId: req.user!.userId, organizationId: orgId, action: 'ORG_UPDATED', resourceType: 'Organization', resourceId: orgId });
    return ok(res, org, 'Organization updated.');
  },

  async uploadLogo(req: Request, res: Response) {
    const orgId = req.orgId!;
    if (!req.file) return ok(res, null, 'No file uploaded.');

    const result = await storageService.upload(req.file.buffer, `logo-${orgId}.${req.file.mimetype.split('/')[1]}`, req.file.mimetype);

    const org = await prisma.organization.update({
      where: { id: orgId },
      data:  { logoUrl: result.url },
    });

    await audit({ userId: req.user!.userId, organizationId: orgId, action: 'ORG_LOGO_UPDATED', resourceType: 'Organization', resourceId: orgId });
    return ok(res, { logoUrl: result.url }, 'Logo updated.');
  },

  async addMember(req: Request, res: Response) {
    const orgId            = req.orgId!;
    const { email, role }  = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return notFound(res, 'No user found with that email. They must register first.');

    const existing = await prisma.orgMember.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId: user.id } },
    });
    if (existing) return ok(res, null, 'User is already a member.');

    const member = await prisma.orgMember.create({
      data: { organizationId: orgId, userId: user.id, role: role ?? 'STAFF' },
    });

    await audit({ userId: req.user!.userId, organizationId: orgId, action: 'MEMBER_ADDED', metadata: { email, role } });
    return ok(res, member, 'Member added.');
  },

  async removeMember(req: Request, res: Response) {
    const orgId    = req.orgId!;
    const memberId = str(req.params.memberId);

    const member = await prisma.orgMember.findUnique({ where: { id: memberId } });
    if (!member || member.organizationId !== orgId) return notFound(res, 'Member not found.');
    if (member.role === 'OWNER') return forbidden(res, 'Cannot remove the organization owner.');

    await prisma.orgMember.delete({ where: { id: memberId } });
    await audit({ userId: req.user!.userId, organizationId: orgId, action: 'MEMBER_REMOVED', metadata: { memberId } });
    return ok(res, null, 'Member removed.');
  },

  async getAnalytics(req: Request, res: Response) {
    const orgId = req.orgId!;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [total, active, revoked, totalRecipients, thisMonth, verifications, rawCerts] = await Promise.all([
      prisma.certificate.count({ where: { organizationId: orgId } }),
      prisma.certificate.count({ where: { organizationId: orgId, status: 'ACTIVE' } }),
      prisma.certificate.count({ where: { organizationId: orgId, status: 'REVOKED' } }),
      prisma.recipient.count({ where: { organizationId: orgId } }),
      prisma.certificate.count({
        where: { organizationId: orgId, createdAt: { gte: startOfMonth } },
      }),
      prisma.verificationLog.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      // Fetch raw certs in last 6 months to aggregate by month in JS
      prisma.certificate.findMany({
        where:  { organizationId: orgId, createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    // Aggregate by month label in application layer (avoids Prisma groupBy date truncation issues)
    const trendMap: Record<string, number> = {};
    for (const cert of rawCerts) {
      const label = new Intl.DateTimeFormat('en', { month: 'short', year: '2-digit' }).format(cert.createdAt);
      trendMap[label] = (trendMap[label] ?? 0) + 1;
    }
    const trend = Object.entries(trendMap).map(([month, count]) => ({ month, count }));

    return ok(res, {
      total, active, revoked, totalRecipients, thisMonth, verifications,
      trend,
    });
  },

  async getAuditLogs(req: Request, res: Response) {
    const orgId = req.orgId!;
    const page  = parseInt(req.query.page as string ?? '1', 10);
    const limit = 20;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where:   { organizationId: orgId },
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip:    (page - 1) * limit,
        take:    limit,
      }),
      prisma.auditLog.count({ where: { organizationId: orgId } }),
    ]);

    return ok(res, { logs, total, page, pages: Math.ceil(total / limit) });
  },
};
