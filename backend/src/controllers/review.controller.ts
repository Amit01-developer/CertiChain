import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { audit } from '../utils/auditLog';
import { str } from '../utils/param';
import {
  ok, created, badRequest, notFound, conflict, forbidden,
} from '../utils/apiResponse';
import { blockchainService } from '../services/blockchain';
import { emailService } from '../services/email.service';
import { logger } from '../utils/logger';
import { env } from '../config/env';

// ── helper: activate a certificate after all required reviews are approved ────
async function tryActivateCertificate(certId: string, orgId: string, userId: string, ip?: string) {
  const allReviews = await prisma.certificateReview.findMany({
    where: { certificateId: certId },
    select: { decision: true, reviewerRole: true },
  });

  // Need at least one APPROVED decision from a STAFF-role reviewer (or from an OWNER if no staff exist)
  // AND at least one APPROVED decision from an OWNER/ADMIN-role reviewer.
  // If there are NO staff reviewers assigned, owner approval alone is sufficient.
  const staffReviews = allReviews.filter(r => r.reviewerRole === 'STAFF');
  const ownerReviews = allReviews.filter(r => r.reviewerRole === 'OWNER' || r.reviewerRole === 'ADMIN');

  // Check for any rejection — immediate REJECTED status
  const anyRejected = allReviews.some(r => r.decision === 'REJECTED');
  if (anyRejected) {
    await prisma.certificate.update({
      where: { id: certId },
      data:  { status: 'REJECTED' },
    });
    await audit({
      userId, organizationId: orgId,
      action: 'CERTIFICATE_REJECTED', resourceType: 'Certificate', resourceId: certId,
      ipAddress: ip,
    });
    return 'REJECTED';
  }

  const ownerApproved  = ownerReviews.some(r => r.decision === 'APPROVED');
  const staffApproved  = staffReviews.length === 0
    ? true  // no staff assigned → owner approval alone is sufficient
    : staffReviews.some(r => r.decision === 'APPROVED');

  if (!ownerApproved || !staffApproved) return 'PENDING'; // still waiting

  // All conditions met → ACTIVATE
  const cert = await prisma.certificate.update({
    where:   { id: certId },
    data:    { status: 'ACTIVE', blockchainStatus: blockchainService.isEnabled ? 'PENDING' : 'FAILED' },
    include: { recipient: true, organization: true },
  });

  await audit({
    userId, organizationId: orgId,
    action: 'CERTIFICATE_ISSUED', resourceType: 'Certificate', resourceId: certId,
    metadata: { certificateId: cert.certificateId },
    ipAddress: ip,
  });

  // Register on blockchain (fire-and-forget)
  if (blockchainService.isEnabled && cert.certificateHash) {
    (async () => {
      try {
        const result = await blockchainService.registerCertificate(cert.certificateId, cert.certificateHash!);
        await prisma.certificate.update({
          where: { id: certId },
          data:  {
            blockchainTxHash:  result.success ? result.txHash  : undefined,
            blockchainHash:    result.success ? cert.certificateHash : undefined,
            blockchainStatus:  result.success ? 'CONFIRMED' : 'FAILED',
            blockchainNetwork: result.success ? (result.network ?? 'Polygon Amoy') : undefined,
          },
        });
        await audit({
          userId, organizationId: orgId,
          action:       result.success ? 'BLOCKCHAIN_REGISTERED' : 'BLOCKCHAIN_FAILED',
          resourceType: 'Certificate', resourceId: certId,
          metadata:     result.success ? { txHash: result.txHash } : { error: result.error },
          ipAddress:    ip,
        });
      } catch (e: any) {
        logger.error('[Blockchain] auto-activate registerOnBlockchain threw', { certId, error: e?.message });
        await prisma.certificate.update({ where: { id: certId }, data: { blockchainStatus: 'FAILED' } }).catch(() => {});
      }
    })();
  }

  // Send certificate email to recipient (fire-and-forget)
  emailService.send(
    emailService.certificateIssuedEmail(
      cert.recipient.name,
      cert.recipient.email,
      cert.certificateId,
      cert.title,
      (cert as any).organization?.name ?? 'CertiChain',
      cert.verificationUrl,
    )
  ).catch((e: any) => logger.warn('Certificate activation email failed', { certId, error: e?.message }));

  return 'ACTIVATED';
}

export const reviewController = {

  /** POST /api/organizations/:orgId/certificates/:certId/reviews
   *  Admin/Owner assigns one or more staff members as reviewers.
   *  Body: { reviewerIds: string[] }
   */
  async assignReviewers(req: Request, res: Response) {
    const orgId   = req.orgId!;
    const certId  = str(req.params.certId);
    const { reviewerIds } = req.body;

    if (!Array.isArray(reviewerIds) || reviewerIds.length === 0) {
      return badRequest(res, 'reviewerIds must be a non-empty array.');
    }

    const cert = await prisma.certificate.findFirst({ where: { id: certId, organizationId: orgId } });
    if (!cert) return notFound(res, 'Certificate not found.');

    // Validate all reviewer IDs are STAFF members of the org
    const members = await prisma.orgMember.findMany({
      where: {
        organizationId: orgId,
        userId: { in: reviewerIds },
        role: 'STAFF',
      },
      select: { userId: true },
    });

    const validIds = new Set(members.map(m => m.userId));
    const invalid  = reviewerIds.filter((id: string) => !validIds.has(id));
    if (invalid.length > 0) {
      return badRequest(res, `These users are not STAFF members of this organization: ${invalid.join(', ')}`);
    }

    // Upsert review records (idempotent — skip if already assigned)
    const results = await Promise.all(
      reviewerIds.map((reviewerId: string) =>
        prisma.certificateReview.upsert({
          where:  { certificateId_reviewerId: { certificateId: certId, reviewerId } },
          update: {},   // keep existing decision if already assigned
          create: { certificateId: certId, reviewerId, reviewerRole: 'STAFF', decision: 'PENDING' },
        })
      )
    );

    await audit({
      userId: req.user!.userId, organizationId: orgId,
      action: 'REVIEWERS_ASSIGNED',
      resourceType: 'Certificate', resourceId: certId,
      metadata: { reviewerIds, count: results.length },
      ipAddress: req.ip,
    });

    return created(res, { assigned: results.length }, `${results.length} reviewer(s) assigned.`);
  },

  /** GET /api/organizations/:orgId/certificates/:certId/reviews
   *  Get all review records for a certificate.
   */
  async listReviews(req: Request, res: Response) {
    const orgId  = req.orgId!;
    const certId = str(req.params.certId);

    const cert = await prisma.certificate.findFirst({ where: { id: certId, organizationId: orgId } });
    if (!cert) return notFound(res, 'Certificate not found.');

    const reviews = await prisma.certificateReview.findMany({
      where:   { certificateId: certId },
      include: {
        reviewer: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const summary = {
      total:    reviews.length,
      pending:  reviews.filter(r => r.decision === 'PENDING').length,
      approved: reviews.filter(r => r.decision === 'APPROVED').length,
      rejected: reviews.filter(r => r.decision === 'REJECTED').length,
    };

    return ok(res, { reviews, summary, certificateStatus: cert.status });
  },

  /** POST /api/organizations/:orgId/certificates/:certId/reviews/decide
   *  Staff or Owner/Admin reviewer submits their decision (APPROVED or REJECTED).
   *  Body: { decision: 'APPROVED' | 'REJECTED', comment?: string }
   *
   *  After every decision, checks if ALL required slots are approved → auto-activates.
   *  If anyone rejects → certificate is immediately REJECTED.
   */
  async submitDecision(req: Request, res: Response) {
    const orgId   = req.orgId!;
    const certId  = str(req.params.certId);
    const { decision, comment } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(decision)) {
      return badRequest(res, 'decision must be APPROVED or REJECTED.');
    }

    const cert = await prisma.certificate.findFirst({ where: { id: certId, organizationId: orgId } });
    if (!cert) return notFound(res, 'Certificate not found.');

    if (cert.status === 'ACTIVE') {
      return conflict(res, 'This certificate is already active and has been issued.');
    }
    if (cert.status === 'REJECTED') {
      return conflict(res, 'This certificate has already been rejected.');
    }

    const reviewerId = req.user!.userId;

    const review = await prisma.certificateReview.findUnique({
      where: { certificateId_reviewerId: { certificateId: certId, reviewerId } },
    });

    if (!review) {
      return forbidden(res, 'You have not been assigned as a reviewer for this certificate.');
    }

    if (review.decision !== 'PENDING') {
      return conflict(res, `You have already submitted a ${review.decision} decision for this certificate.`);
    }

    await prisma.certificateReview.update({
      where: { certificateId_reviewerId: { certificateId: certId, reviewerId } },
      data:  { decision, comment: comment ?? null, decidedAt: new Date() },
    });

    await audit({
      userId: reviewerId, organizationId: orgId,
      action: decision === 'APPROVED' ? 'REVIEW_APPROVED' : 'REVIEW_REJECTED',
      resourceType: 'Certificate', resourceId: certId,
      metadata: { decision, comment, reviewerRole: review.reviewerRole },
      ipAddress: req.ip,
    });

    // Check if certificate should be activated or rejected
    const activationResult = await tryActivateCertificate(certId, orgId, reviewerId, req.ip);

    let message = `Decision recorded: ${decision}.`;
    if (activationResult === 'ACTIVATED') {
      message = `Decision recorded: ${decision}. All reviews complete — certificate is now ACTIVE and has been sent to the recipient.`;
    } else if (activationResult === 'REJECTED') {
      message = `Decision recorded: ${decision}. Certificate has been REJECTED.`;
    } else {
      message = `Decision recorded: ${decision}. Waiting for remaining reviewers to approve.`;
    }

    const updatedReview = await prisma.certificateReview.findUnique({
      where: { certificateId_reviewerId: { certificateId: certId, reviewerId } },
    });

    return ok(res, { review: updatedReview, certificateOutcome: activationResult }, message);
  },

  /** GET /api/organizations/:orgId/reviews/pending
   *  Staff/Owner: list all certificates where this user has a PENDING review task.
   */
  async myPendingReviews(req: Request, res: Response) {
    const orgId      = req.orgId!;
    const reviewerId = req.user!.userId;

    const reviews = await prisma.certificateReview.findMany({
      where: {
        reviewerId,
        decision: 'PENDING',
        certificate: { organizationId: orgId, status: 'DRAFT' },
      },
      include: {
        certificate: {
          include: {
            recipient:    { select: { name: true, email: true } },
            organization: { select: { id: true, name: true } },
            reviews: {
              include: { reviewer: { select: { id: true, name: true } } },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return ok(res, reviews);
  },

  /** GET /api/organizations/:orgId/reviews
   *  Admin/Owner: list all reviews across the organization.
   */
  async orgReviews(req: Request, res: Response) {
    const orgId = req.orgId!;

    const reviews = await prisma.certificateReview.findMany({
      where: {
        certificate: { organizationId: orgId },
      },
      include: {
        reviewer:    { select: { id: true, name: true, email: true } },
        certificate: {
          include: { recipient: { select: { name: true, email: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return ok(res, reviews);
  },
};
