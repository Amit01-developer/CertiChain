import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { generateCertificateId, hashCertificateData } from '../utils/certId';
import { generateCertificatePdf } from '../services/pdf.service';
import { storageService } from '../services/storage.service';
import { emailService } from '../services/email.service';
import { blockchainService } from '../services/blockchain';
import { audit } from '../utils/auditLog';
import { logger } from '../utils/logger';
import { env } from '../config/env';
import { str } from '../utils/param';
import {
  ok, created, notFound, conflict, serverError, badRequest
} from '../utils/apiResponse';
import { parse as parseCsv } from 'csv-parse/sync';
import QRCode from 'qrcode';
import type { CertificateStatus } from '@prisma/client';

async function buildCertificate(orgId: string, recipientId: string, data: any, userId: string) {
  const certId = generateCertificateId();
  const verificationUrl = `${env.FRONTEND_URL}/verify/${certId}`;

  const qrBuffer = Buffer.from(
    (await QRCode.toDataURL(verificationUrl, { width: 200, margin: 1 })).split(',')[1],
    'base64'
  );

  const [org, recipient, template] = await Promise.all([
    prisma.organization.findUnique({ where: { id: orgId } }),
    prisma.recipient.findUnique({ where: { id: recipientId } }),
    data.templateId ? prisma.certificateTemplate.findUnique({ where: { id: data.templateId } }) : Promise.resolve(null),
  ]);

  const pdfBuffer = await generateCertificatePdf({
    certificateId:          certId,
    recipientName:          recipient?.name ?? data.recipientName,
    title:                  data.title,
    achievement:            data.achievement,
    description:            data.description,
    customMessage:          data.customMessage,
    issueDate:              new Date(data.issueDate),
    expiryDate:             data.expiryDate ? new Date(data.expiryDate) : null,
    organizationName:       org?.name ?? 'Unknown Organization',
    organizationLogoUrl:    org?.logoUrl ?? null,
    verificationUrl,
    template:               template?.configuration as any,
  });

  const [pdfResult, qrResult] = await Promise.all([
    storageService.upload(pdfBuffer, `cert-${certId}.pdf`, 'application/pdf'),
    storageService.upload(qrBuffer,  `qr-${certId}.png`,  'image/png'),
  ]);

  const certHash = await hashCertificateData({
    certificateId: certId,
    organizationId: orgId,
    recipientId,
    title: data.title,
    issueDate: data.issueDate,
  });

  return {
    certId, verificationUrl,
    pdfUrl:  pdfResult.url,
    qrUrl:   qrResult.url,
    certHash,
  };
}

async function registerOnBlockchain(
  certDbId:       string,
  certId:         string,
  certHash:       string,
  orgId:          string,
  userId:         string,
  ipAddress?:     string,
): Promise<void> {
  if (!blockchainService.isEnabled) return;

  try {
    const result = await blockchainService.registerCertificate(certId, certHash);

    if (result.success) {
      await prisma.certificate.update({
        where: { id: certDbId },
        data: {
          blockchainTxHash:  result.txHash,
          blockchainHash:    certHash,
          blockchainStatus:  'CONFIRMED',
          blockchainNetwork: result.network ?? 'Polygon Amoy',
        },
      });

      await audit({
        userId, organizationId: orgId,
        action:       'BLOCKCHAIN_REGISTERED',
        resourceType: 'Certificate',
        resourceId:   certDbId,
        metadata:     { txHash: result.txHash, certHash, certId },
        ipAddress,
      });
    } else {
      await prisma.certificate.update({
        where: { id: certDbId },
        data:  { blockchainStatus: 'FAILED' },
      });

      await audit({
        userId, organizationId: orgId,
        action:       'BLOCKCHAIN_FAILED',
        resourceType: 'Certificate',
        resourceId:   certDbId,
        metadata:     { error: result.error, certId },
        ipAddress,
      });

      logger.warn('[Blockchain] Registration failed — certificate saved to DB normally', {
        certId, error: result.error,
      });
    }
  } catch (unexpectedErr: any) {
    // Safety net: any unexpected throw (network crash, DB error, etc.) must
    // still flip the status away from PENDING so it doesn't get stuck.
    logger.error('[Blockchain] Unexpected error in registerOnBlockchain — marking FAILED', {
      certId, certDbId, error: unexpectedErr?.message,
    });
    await prisma.certificate.update({
      where: { id: certDbId },
      data:  { blockchainStatus: 'FAILED' },
    }).catch((dbErr: any) =>
      logger.error('[Blockchain] Could not update blockchainStatus to FAILED', { certDbId, error: dbErr?.message })
    );
  }
}

export const certificateController = {

  async list(req: Request, res: Response) {
    const orgId  = req.orgId!;
    const page   = parseInt(req.query.page   as string ?? '1',  10);
    const limit  = parseInt(req.query.limit  as string ?? '20', 10);
    const status = req.query.status as CertificateStatus | undefined;
    const search = req.query.search as string | undefined;

    const where: any = { organizationId: orgId };
    if (status) where.status = status;
    if (search) where.OR = [
      { recipient: { name: { contains: search, mode: 'insensitive' } } },
      { certificateId: { contains: search, mode: 'insensitive' } },
      { title: { contains: search, mode: 'insensitive' } },
    ];

    const [certificates, total] = await Promise.all([
      prisma.certificate.findMany({
        where,
        include: {
          recipient: true,
          template: { select: { id: true, name: true } },
          reviews: {
            select: { reviewerId: true, reviewerRole: true, decision: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip:    (page - 1) * limit,
        take:    limit,
      }),
      prisma.certificate.count({ where }),
    ]);

    return ok(res, { certificates, total, page, pages: Math.ceil(total / limit) });
  },

  async create(req: Request, res: Response) {
    try {
    const orgId = req.orgId!;
    const {
      recipientName, recipientEmail, title, description, achievement,
      customMessage, issueDate, expiryDate, templateId, sendEmail,
    } = req.body;

    const resolvedTemplateId = templateId || null;
    if (resolvedTemplateId) {
      const template = await prisma.certificateTemplate.findFirst({
        where: { id: resolvedTemplateId, organizationId: orgId },
      });
      if (!template) {
        return badRequest(res, 'Invalid templateId: template not found in this organization.');
      }
    }

    const recipient = await prisma.recipient.upsert({
      where:  { organizationId_email: { organizationId: orgId, email: recipientEmail } },
      update: { name: recipientName },
      create: { organizationId: orgId, name: recipientName, email: recipientEmail },
    });

    let buildResult: Awaited<ReturnType<typeof buildCertificate>>;
    try {
      buildResult = await buildCertificate(
        orgId, recipient.id, { title, description, achievement, customMessage, issueDate, expiryDate, templateId },
        req.user!.userId
      );
    } catch (buildErr: any) {
      logger.error('buildCertificate failed', { error: buildErr?.message, stack: buildErr?.stack, orgId });
      return serverError(res, `Certificate generation failed: ${buildErr?.message}`);
    }

    const { certId, verificationUrl, pdfUrl, qrUrl, certHash } = buildResult;

    // ── Dual-verification flow ────────────────────────────────────────────────
    // Certificate starts as DRAFT. It becomes ACTIVE only after BOTH a
    // staff reviewer AND an owner/admin reviewer approve it.
    // Find the org owner(s) / admins to auto-assign as owner-slot reviewer.
    const ownerMembers = await prisma.orgMember.findMany({
      where:  { organizationId: orgId, role: { in: ['OWNER', 'ADMIN'] } },
      select: { userId: true, role: true },
    });

    // Staff members (excluding the creator if they are staff, to avoid self-review)
    // We pick all STAFF members — the creator can still be a reviewer if they are STAFF
    const staffMembers = await prisma.orgMember.findMany({
      where:  { organizationId: orgId, role: 'STAFF' },
      select: { userId: true },
    });

    const cert = await prisma.certificate.create({
      data: {
        certificateId:   certId,
        organizationId:  orgId,
        templateId:      resolvedTemplateId,
        recipientId:     recipient.id,
        title, description, achievement, customMessage,
        issueDate:       new Date(issueDate),
        expiryDate:      expiryDate ? new Date(expiryDate) : null,
        status:          'DRAFT',
        pdfUrl,
        qrCodeUrl:       qrUrl,
        verificationUrl,
        certificateHash: certHash,
        issuedById:      req.user!.userId,
        blockchainStatus: 'FAILED', // will be set to PENDING after approval
      },
      include: { recipient: true },
    });

    // Auto-assign owner/admin slot reviewer (first owner, or the creator if they are owner)
    const ownerReviewerUserId = ownerMembers.find(m => m.role === 'OWNER')?.userId
      ?? ownerMembers[0]?.userId ?? null;

    const reviewCreates: Array<{ certificateId: string; reviewerId: string; reviewerRole: any; decision: any }> = [];

    if (ownerReviewerUserId) {
      reviewCreates.push({
        certificateId: cert.id,
        reviewerId:    ownerReviewerUserId,
        reviewerRole:  'OWNER',
        decision:      'PENDING',
      });
    }

    // Auto-assign all staff members as staff-slot reviewers (org may have multiple staff)
    for (const sm of staffMembers) {
      // Avoid duplicating if owner/admin is also assigned above
      if (sm.userId !== ownerReviewerUserId) {
        reviewCreates.push({
          certificateId: cert.id,
          reviewerId:    sm.userId,
          reviewerRole:  'STAFF',
          decision:      'PENDING',
        });
      }
    }

    // If no staff exist, the owner alone can approve (single-approver mode)
    if (reviewCreates.length > 0) {
      await prisma.certificateReview.createMany({ data: reviewCreates, skipDuplicates: true });
    }

    await audit({
      userId: req.user!.userId, organizationId: orgId,
      action: 'CERTIFICATE_CREATED_DRAFT', resourceType: 'Certificate', resourceId: cert.id,
      metadata: { certificateId: certId, recipientEmail, reviewerCount: reviewCreates.length },
      ipAddress: req.ip,
    });

    // Fire-and-forget review assignment emails
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    const reviewDashboardUrl = `${env.FRONTEND_URL}/dashboard`;

    for (const rv of reviewCreates) {
      const reviewer = await prisma.user.findUnique({ where: { id: rv.reviewerId }, select: { name: true, email: true } });
      if (reviewer) {
        emailService.send(
          emailService.reviewAssignedEmail(
            reviewer.name, reviewer.email,
            title, recipientName,
            org?.name ?? 'CertiChain',
            reviewDashboardUrl,
          )
        ).catch(() => {});
      }
    }

    return created(res, {
      ...cert,
      reviewStatus: 'PENDING_REVIEW',
      message: 'Certificate created in DRAFT. It will be activated once all reviewers approve.',
    }, `Certificate ${certId} created. Awaiting review and approval.`);
    } catch (err: any) {
      logger.error('Certificate create error', { error: err?.message, stack: err?.stack });
      return serverError(res, err?.message || 'Failed to issue certificate.');
    }
  },

  async getById(req: Request, res: Response) {
    const orgId = req.orgId!;
    const id    = str(req.params.id);
    const cert  = await prisma.certificate.findFirst({
      where:   { id, organizationId: orgId },
      include: {
        recipient: true,
        template: true,
        revocation: true,
        reviews: {
          include: { reviewer: { select: { id: true, name: true, email: true, avatarUrl: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!cert) return notFound(res, 'Certificate not found.');
    return ok(res, cert);
  },

  async revoke(req: Request, res: Response) {
    const orgId  = req.orgId!;
    const certId = str(req.params.id);
    const { reason } = req.body;

    const cert = await prisma.certificate.findFirst({ where: { id: certId, organizationId: orgId } });
    if (!cert) return notFound(res, 'Certificate not found.');
    if (cert.status === 'REVOKED') return conflict(res, 'Certificate is already revoked.');
    if (cert.status === 'DRAFT') return badRequest(res, 'Cannot revoke a certificate that is still in DRAFT (pending review). Reject it through the review process instead.');

    await prisma.$transaction([
      prisma.certificate.update({
        where: { id: certId },
        data:  { status: 'REVOKED' },
      }),
      prisma.revocation.create({
        data: { certificateId: certId, reason, revokedById: req.user!.userId },
      }),
    ]);

    await audit({
      userId: req.user!.userId, organizationId: orgId,
      action: 'CERTIFICATE_REVOKED', resourceType: 'Certificate', resourceId: certId,
      metadata: { reason }, ipAddress: req.ip,
    });

    if (cert.certificateHash && blockchainService.isEnabled) {
      blockchainService.revokeCertificate(cert.certificateHash).then(async (result) => {
        if (result.success) {
          await audit({
            userId: req.user!.userId, organizationId: orgId,
            action:       'BLOCKCHAIN_REGISTERED',   // re-use for on-chain revoke tx
            resourceType: 'Certificate',
            resourceId:   certId,
            metadata:     { event: 'REVOKED', txHash: result.txHash },
            ipAddress:    req.ip,
          });
        } else {
          logger.warn('[Blockchain] On-chain revocation failed', {
            certId: cert.certificateId, error: result.error,
          });
        }
      }).catch(() => {});
    }

    return ok(res, null, 'Certificate has been revoked.');
  },

  async downloadPdf(req: Request, res: Response) {
    const orgId = req.orgId!;
    const id    = str(req.params.id);
    const cert  = await prisma.certificate.findFirst({
      where:   { id, organizationId: orgId },
      include: { recipient: true },
    });
    if (!cert) return notFound(res, 'Certificate not found.');

    await audit({
      userId: req.user!.userId, organizationId: orgId,
      action: 'CERTIFICATE_DOWNLOADED', resourceType: 'Certificate', resourceId: cert.id,
    });

    return ok(res, { pdfUrl: cert.pdfUrl, filename: `Certificate-${cert.certificateId}.pdf` });
  },

  async blockchainRetry(req: Request, res: Response) {
    const orgId  = req.orgId!;
    const certId = str(req.params.id);

    const cert = await prisma.certificate.findFirst({
      where: { id: certId, organizationId: orgId },
    });
    if (!cert) return notFound(res, 'Certificate not found.');

    if (cert.blockchainStatus === 'CONFIRMED') {
      return ok(res, { blockchainStatus: cert.blockchainStatus }, 'Already registered on blockchain.');
    }

    if (!blockchainService.isEnabled) {
      return badRequest(res, 'Blockchain is not enabled. Set BLOCKCHAIN_ENABLED=true and configure RPC/key/contract.');
    }

    if (!cert.certificateHash) {
      return badRequest(res, 'Certificate is missing its hash — cannot register on blockchain.');
    }

    // Reset to PENDING so the UI reflects the in-progress state
    await prisma.certificate.update({
      where: { id: certId },
      data:  { blockchainStatus: 'PENDING' },
    });

    // Fire-and-forget — same pattern as initial issuance
    registerOnBlockchain(cert.id, cert.certificateId, cert.certificateHash, orgId, req.user!.userId, req.ip)
      .catch(() => {});

    const updated = await prisma.certificate.findUnique({ where: { id: certId } });
    return ok(res, updated, 'Blockchain registration queued.');
  },

  async bulkCreate(req: Request, res: Response) {
    const orgId = req.orgId!;
    if (!req.file) return badRequest(res, 'CSV file is required.');

    let rows: any[];
    try {
      rows = parseCsv(req.file.buffer.toString(), {
        columns:          true,
        skip_empty_lines: true,
        trim:             true,
      });
    } catch {
      return badRequest(res, 'Invalid CSV format.');
    }

    const required = ['name', 'email', 'certificate_title', 'issue_date'];
    const errors: string[] = [];
    const valid: typeof rows = [];

    rows.forEach((row, i) => {
      const missing = required.filter(f => !row[f]);
      if (missing.length) {
        errors.push(`Row ${i + 2}: missing ${missing.join(', ')}`);
      } else {
        valid.push(row);
      }
    });

    if (errors.length && valid.length === 0) {
      return badRequest(res, 'CSV validation failed.', errors);
    }

    const results: any[]  = [];
    const failedRows: string[] = [...errors];

    for (const row of valid) {
      try {
        const recipient = await prisma.recipient.upsert({
          where:  { organizationId_email: { organizationId: orgId, email: row.email } },
          update: { name: row.name },
          create: { organizationId: orgId, name: row.name, email: row.email },
        });

        const { certId, verificationUrl, pdfUrl, qrUrl, certHash } = await buildCertificate(
          orgId, recipient.id,
          { title: row.certificate_title, issueDate: row.issue_date, achievement: row.achievement },
          req.user!.userId
        );

        const cert = await prisma.certificate.create({
          data: {
            certificateId:   certId,
            organizationId:  orgId,
            recipientId:     recipient.id,
            title:           row.certificate_title,
            issueDate:       new Date(row.issue_date),
            status:          'ACTIVE',
            pdfUrl,
            qrCodeUrl:       qrUrl,
            verificationUrl,
            certificateHash: certHash,
            issuedById:      req.user!.userId,
            blockchainStatus: blockchainService.isEnabled ? 'PENDING' : 'FAILED',
          },
        });

        registerOnBlockchain(cert.id, certId, certHash, orgId, req.user!.userId, req.ip).catch((err: any) => {
          logger.error('[Blockchain] bulk fire-and-forget registerOnBlockchain threw', { certId, error: err?.message });
        });

        results.push({ certificateId: certId, name: row.name, email: row.email });
      } catch (err: any) {
        failedRows.push(`Row for ${row.email}: ${err.message}`);
      }
    }

    await audit({
      userId: req.user!.userId, organizationId: orgId,
      action: 'BULK_CERTIFICATES_ISSUED', metadata: { count: results.length },
    });

    return ok(res, { issued: results, errors: failedRows },
      `${results.length} certificate(s) issued.${failedRows.length ? ` ${failedRows.length} failed.` : ''}`);
  },
};
