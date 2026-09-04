import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { blockchainService } from '../services/blockchain';
import { audit } from '../utils/auditLog';
import { env } from '../config/env';
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

    let blockchainVerification: {
      enabled:        boolean;
      onChain:        boolean;
      hashMatch:      boolean;
      revoked:        boolean;
      txHash:         string | null;
      txUrl:          string | null;
      network:        string | null;
      registeredAt:   number | null;
      status:         'VERIFIED' | 'HASH_MISMATCH' | 'NOT_FOUND' | 'REVOKED' | 'DISABLED' | 'ERROR';
      error?:         string;
    } = {
      enabled:      blockchainService.isEnabled,
      onChain:      false,
      hashMatch:    false,
      revoked:      false,
      txHash:       cert.blockchainTxHash ?? null,
      txUrl:        cert.blockchainTxHash
                      ? `${env.BLOCKCHAIN_EXPLORER_URL}/tx/${cert.blockchainTxHash}`
                      : null,
      network:      cert.blockchainNetwork ?? null,
      registeredAt: null,
      status:       'DISABLED',
    };

    if (blockchainService.isEnabled && cert.certificateHash) {
      const bcResult = await blockchainService.verifyCertificate(cert.certificateHash);

      if (bcResult.error && !bcResult.onChain) {
        blockchainVerification.status = 'ERROR';
        blockchainVerification.error  = bcResult.error;
      } else if (!bcResult.exists) {
        blockchainVerification.status = 'NOT_FOUND';
        blockchainVerification.onChain = bcResult.onChain;
      } else if (bcResult.revoked) {
        blockchainVerification.status      = 'REVOKED';
        blockchainVerification.onChain     = true;
        blockchainVerification.revoked     = true;
        blockchainVerification.hashMatch   = true;
        blockchainVerification.registeredAt = bcResult.timestamp;
      } else {
        blockchainVerification.status      = 'VERIFIED';
        blockchainVerification.onChain     = true;
        blockchainVerification.hashMatch   = true;
        blockchainVerification.registeredAt = bcResult.timestamp;
      }

      if (bcResult.exists) {
        audit({
          action:       'BLOCKCHAIN_VERIFIED',
          resourceType: 'Certificate',
          resourceId:   cert.id,
          metadata:     {
            certificateId,
            onChain:   bcResult.exists,
            hashMatch: true,
            revoked:   bcResult.revoked,
          },
          ipAddress: req.ip,
        }).catch(() => {});
      }
    }

    const currentVerificationUrl = `${env.FRONTEND_URL}/verify/${cert.certificateId}`;

    const base = {
      certificateId:   cert.certificateId,
      title:           cert.title,
      recipientName:   cert.recipient.name,
      organization:    cert.organization,
      issueDate:       cert.issueDate,
      expiryDate:      cert.expiryDate,
      status:          cert.status,
      verificationUrl: currentVerificationUrl,
      pdfUrl:          cert.pdfUrl,
      qrCodeUrl:       cert.qrCodeUrl,
      blockchain:      blockchainVerification,
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
