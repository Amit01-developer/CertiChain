import prisma from '../config/prisma';
import { Prisma } from '@prisma/client';

interface AuditOptions {
  organizationId?: string;
  userId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

export async function audit(opts: AuditOptions): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action:         opts.action,
        organizationId: opts.organizationId ?? null,
        userId:         opts.userId         ?? null,
        resourceType:   opts.resourceType   ?? null,
        resourceId:     opts.resourceId     ?? null,
        metadata:       opts.metadata ? (opts.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
        ipAddress:      opts.ipAddress      ?? null,
      },
    });
  } catch {
    // Audit log failures must never break the main flow
  }
}
