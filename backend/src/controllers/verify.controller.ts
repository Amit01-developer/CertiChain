import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { str } from '../utils/param';

export const verifyController = {

  async verify(req: Request, res: Response) {
    const certificateId = str(req.params.certificateId);

    prisma.verificationLog.create({
      data: {
        certificateId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    }).catch(() => {});

    const cert = await prisma.certificate.findUnique({
      where:   { certificateId },
      include: {
        organization: { select: { id: true, name: true, logoUrl: true, website: true, type: true } },
        recipient:    { select: { name: true } },
        revocation:   true,
      },
    });

    if (!cert) {
      return res.status(404).json({
        success:  false,
        verified: false,
        status:   'NOT_FOUND',
        message:  'No certificate found with this ID. Please check and try again.',
      });
    }

    if (cert.status === 'ACTIVE' && cert.expiryDate && cert.expiryDate < new Date()) {
      await prisma.certificate.update({ where: { id: cert.id }, data: { status: 'EXPIRED' } });
      (cert as any).status = 'EXPIRED';
    }

    const base = {
      certificateId:   cert.certificateId,
      title:           cert.title,
      recipientName:   cert.recipient.name,
      organization:    cert.organization,
      issueDate:       cert.issueDate,
      expiryDate:      cert.expiryDate,
      status:          cert.status,
      verificationUrl: cert.verificationUrl,
      pdfUrl:          cert.pdfUrl,
      qrCodeUrl:       cert.qrCodeUrl,
    };

    if (cert.status === 'REVOKED') {
      return res.status(200).json({
        success:  true,
        verified: false,
        status:   'REVOKED',
        message:  'This certificate has been revoked and is no longer valid.',
        data: {
          ...base,
          revocation: {
            reason:    cert.revocation?.reason,
            revokedAt: cert.revocation?.revokedAt,
          },
        },
      });
    }

    if (cert.status === 'EXPIRED') {
      return res.status(200).json({
        success:  true,
        verified: false,
        status:   'EXPIRED',
        message:  'This certificate has expired.',
        data: base,
      });
    }

    return res.status(200).json({
      success:  true,
      verified: true,
      status:   'ACTIVE',
      message:  'Certificate successfully verified.',
      data: base,
    });
  },
};
