import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { generateCertificateId, hashCertificateData } from '../utils/certId';
import { generateCertificatePdf } from '../services/pdf.service';
import { storageService } from '../services/storage.service';
import { emailService } from '../services/email.service';
import { audit } from '../utils/auditLog';
import { logger } from '../utils/logger';
import { env } from '../config/env';
import { str } from '../utils/param';
import {
  ok, created, notFound, conflict, forbidden, serverError, badRequest
} from '../utils/apiResponse';
import { parse as parseCsv } from 'csv-parse/sync';
import QRCode from 'qrcode';
import type { CertificateStatus } from '@prisma/client';

async function buildCertificate(orgId: string, recipientId: string, data: any, userId: string) {
  const certId = generateCertificateId();
  const verificationUrl = `${env.FRONTEND_URL}/verify/${certId}`;

  // Generate QR code
  const qrBuffer = Buffer.from(
    (await QRCode.toDataURL(verificationUrl, { width: 200, margin: 1 })).split(',')[1],
    'base64'
  );

  // Get org + recipient + template info for PDF
  const [org, recipient, template] = await Promise.all([
    prisma.organization.findUnique({ where: { id: orgId } }),
    prisma.recipient.findUnique({ where: { id: recipientId } }),
    data.templateId ? prisma.certificateTemplate.findUnique({ where: { id: data.templateId } }) : Promise.resolve(null),
  ]);

  // Generate PDF
  const pdfBuffer = await generateCertificatePdf({
    certificateId:    certId,
    recipientName:    recipient?.name ?? data.recipientName,
    title:            data.title,
    achievement:      data.achievement,
    description:      data.description,
    customMessage:    data.customMessage,
    issueDate:        new Date(data.issueDate),
    expiryDate:       data.expiryDate ? new Date(data.expiryDate) : null,
    organizationName: org?.name ?? 'Unknown Organization',
    verificationUrl,
    template:         template?.configuration as any,
  });

  // Upload PDF and QR
  const [pdfResult, qrResult] = await Promise.all([
    storageService.upload(pdfBuffer, `cert-${certId}.pdf`, 'application/pdf'),
    storageService.upload(qrBuffer,  `qr-${certId}.png`,  'image/png'),
  ]);

  // Compute integrity hash
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
        include: { recipient: true, template: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip:    (page - 1) * limit,
        take:    limit,
      }),
      prisma.certificate.count({ where }),
    ]);

    return ok(res, { certificates, total, page, pages: Math.ceil(total / limit) });
  },

  async create(req: Request, res: Response) {
    const orgId = req.orgId!;
    const {
      recipientName, recipientEmail, title, description, achievement,
      customMessage, issueDate, expiryDate, templateId, sendEmail,
    } = req.body;

    // Upsert recipient
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

    const cert = await prisma.certificate.create({
      data: {
        certificateId:   certId,
        organizationId:  orgId,
        templateId:      templateId ?? null,
        recipientId:     recipient.id,
        title, description, achievement, customMessage,
        issueDate:       new Date(issueDate),
        expiryDate:      expiryDate ? new Date(expiryDate) : null,
        status:          'ACTIVE',
        pdfUrl,
        qrCodeUrl:       qrUrl,
        verificationUrl,
        certificateHash: certHash,
        issuedById:      req.user!.userId,
      },
      include: { recipient: true },
    });

    await audit({
      userId: req.user!.userId, organizationId: orgId,
      action: 'CERTIFICATE_ISSUED', resourceType: 'Certificate', resourceId: cert.id,
      metadata: { certificateId: certId, recipientEmail },
      ipAddress: req.ip,
    });

    // Optional email — failure must not roll back an already-committed certificate
    if (sendEmail) {
      try {
        const org = await prisma.organization.findUnique({ where: { id: orgId } });
        await emailService.send(
          emailService.certificateIssuedEmail(
            recipientName, recipientEmail, certId, title, org?.name ?? 'CertiChain', verificationUrl
          )
        );
      } catch (emailErr: any) {
        // Log the failure but still return 201 — the certificate was issued successfully
        logger.warn('Certificate issued but notification email failed', {
          certId,
          recipientEmail,
          error: emailErr?.message,
        });
      }
    }

    return created(res, cert, `Certificate ${certId} issued successfully.`);
  },

  async getById(req: Request, res: Response) {
    const orgId = req.orgId!;
    const id    = str(req.params.id);
    const cert  = await prisma.certificate.findFirst({
      where:   { id, organizationId: orgId },
      include: { recipient: true, template: true, revocation: true },
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

    const results: any[] = [];
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
            pdfUrl, qrCodeUrl: qrUrl, verificationUrl,
            certificateHash: certHash,
            issuedById:      req.user!.userId,
          },
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
