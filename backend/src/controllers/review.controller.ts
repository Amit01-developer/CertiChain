import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { audit } from '../utils/auditLog';
import { str } from '../utils/param';
import {
  ok, created, badRequest, notFound, conflict, forbidden,
} from '../utils/apiResponse';

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
          create: { certificateId: certId, reviewerId, decision: 'PENDING' },
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

    return ok(res, { reviews, summary });
  },

  /** POST /api/organizations/:orgId/certificates/:certId/reviews/decide
   *  Staff reviewer submits their decision (APPROVED or REJECTED).
   *  Body: { decision: 'APPROVED' | 'REJECTED', comment?: string }
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

    const updated = await prisma.certificateReview.update({
      where: { certificateId_reviewerId: { certificateId: certId, reviewerId } },
      data:  { decision, comment: comment ?? null, decidedAt: new Date() },
    });

    await audit({
      userId: reviewerId, organizationId: orgId,
      action: decision === 'APPROVED' ? 'REVIEW_APPROVED' : 'REVIEW_REJECTED',
      resourceType: 'Certificate', resourceId: certId,
      metadata: { decision, comment },
      ipAddress: req.ip,
    });

    return ok(res, updated, `Decision recorded: ${decision}.`);
  },

  /** GET /api/organizations/:orgId/reviews/pending
   *  Staff: list all certificates where this user has a PENDING review task.
   */
  async myPendingReviews(req: Request, res: Response) {
    const orgId      = req.orgId!;
    const reviewerId = req.user!.userId;

    const reviews = await prisma.certificateReview.findMany({
      where: {
        reviewerId,
        decision: 'PENDING',
        certificate: { organizationId: orgId },
      },
      include: {
        certificate: {
          include: {
            recipient: { select: { name: true, email: true } },
            organization: { select: { id: true, name: true } },
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
