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
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });

    const mimeToExt: Record<string, string> = {
      'image/jpeg':   'jpg',
      'image/png':    'png',
      'image/webp':   'webp',
      'image/svg+xml': 'svg',
    };
    const ext = mimeToExt[req.file.mimetype] ?? req.file.mimetype.split('/')[1];

    const result = await storageService.upload(req.file.buffer, `logo-${orgId}.${ext}`, req.file.mimetype);

    const org = await prisma.organization.update({
      where: { id: orgId },
      data:  { logoUrl: result.url },
    });

    await audit({ userId: req.user!.userId, organizationId: orgId, action: 'ORG_LOGO_UPDATED', resourceType: 'Organization', resourceId: orgId });
    return ok(res, { logoUrl: result.url }, 'Logo updated.');
  },

  /** Legacy: add an existing registered user directly (kept for backward compat). */
  async addMember(req: Request, res: Response) {
    const orgId            = req.orgId!;
    const { email, role }  = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return notFound(res, 'No user found with that email. Use the invitation flow to invite new users.');

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
    const startOfMonth  = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo  = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [total, active, revoked, draft, rejected, totalRecipients, thisMonth, verifications, rawCerts] = await Promise.all([
      prisma.certificate.count({ where: { organizationId: orgId } }),
      prisma.certificate.count({ where: { organizationId: orgId, status: 'ACTIVE' } }),
      prisma.certificate.count({ where: { organizationId: orgId, status: 'REVOKED' } }),
      prisma.certificate.count({ where: { organizationId: orgId, status: 'DRAFT' } }),
      prisma.certificate.count({ where: { organizationId: orgId, status: 'REJECTED' } }),
      prisma.recipient.count({ where: { organizationId: orgId } }),
      prisma.certificate.count({
        where: { organizationId: orgId, createdAt: { gte: startOfMonth } },
      }),
      prisma.verificationLog.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.certificate.findMany({
        where:   { organizationId: orgId, createdAt: { gte: sixMonthsAgo } },
        select:  { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const trendMap: Record<string, number> = {};
    for (const cert of rawCerts) {
      const label = new Intl.DateTimeFormat('en', { month: 'short', year: '2-digit' }).format(cert.createdAt);
      trendMap[label] = (trendMap[label] ?? 0) + 1;
    }
    const trend = Object.entries(trendMap).map(([month, count]) => ({ month, count }));

    return ok(res, {
      total, active, revoked, draft, rejected, totalRecipients, thisMonth, verifications,
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

  async getStaffDashboard(req: Request, res: Response) {
    const orgId  = req.orgId!;
    const userId = req.user!.userId;

    const member = await prisma.orgMember.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId } },
    });

    const [org, pendingReviews, completedReviews, issuedByMeCount, draftCerts, recentActive] = await Promise.all([
      prisma.organization.findUnique({
        where:  { id: orgId },
        select: { id: true, name: true, type: true, logoUrl: true },
      }),

      // Tasks assigned to ME that are still PENDING
      prisma.certificateReview.findMany({
        where: {
          reviewerId: userId,
          decision:   'PENDING',
          certificate: { organizationId: orgId, status: 'DRAFT' },
        },
        include: {
          certificate: {
            include: {
              recipient: { select: { name: true, email: true } },
              reviews: {
                include: { reviewer: { select: { id: true, name: true, role: true } } },
                orderBy: { createdAt: 'asc' },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),

      // Tasks I've already decided on
      prisma.certificateReview.findMany({
        where: {
          reviewerId: userId,
          decision:   { in: ['APPROVED', 'REJECTED'] },
          certificate: { organizationId: orgId },
        },
        include: {
          certificate: { include: { recipient: { select: { name: true, email: true } } } },
        },
        orderBy: { decidedAt: 'desc' },
        take: 20,
      }),

      // Certificates I created
      prisma.certificate.count({ where: { organizationId: orgId, issuedById: userId } }),

      // All DRAFT certs in the org (visible to owner/admin for oversight)
      member?.role === 'OWNER' || member?.role === 'ADMIN'
        ? prisma.certificate.findMany({
            where:   { organizationId: orgId, status: 'DRAFT' },
            include: {
              recipient: { select: { name: true, email: true } },
              reviews: {
                include: { reviewer: { select: { id: true, name: true } } },
              },
            },
            orderBy: { createdAt: 'desc' },
          })
        : Promise.resolve([]),

      // Recent ACTIVE certificates
      prisma.certificate.findMany({
        where:   { organizationId: orgId, status: 'ACTIVE' },
        include: { recipient: { select: { name: true, email: true } } },
        orderBy: { updatedAt: 'desc' },
        take:    10,
      }),
    ]);

    return ok(res, {
      organization:     org,
      role:             member?.role ?? 'STAFF',
      issuedByMe:       issuedByMeCount,
      // Tasks assigned to the logged-in user
      myPendingReviews: pendingReviews,
      myReviewHistory:  completedReviews,
      // Org-wide overview (only for OWNER/ADMIN)
      draftCertificates: draftCerts,
      recentActiveCertificates: recentActive,
      stats: {
        pendingReviewCount:   pendingReviews.length,
        completedReviewCount: completedReviews.length,
        draftCount:           draftCerts.length,
      },
    });
  },
};
