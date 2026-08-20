import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { ok, notFound } from '../utils/apiResponse';
import { str } from '../utils/param';

export const recipientController = {

  async list(req: Request, res: Response) {
    const orgId  = req.orgId!;
    const page   = parseInt(req.query.page as string ?? '1', 10);
    const limit  = 20;
    const search = req.query.search as string | undefined;

    const where: any = { organizationId: orgId };
    if (search) where.OR = [
      { name:  { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];

    const [recipients, total] = await Promise.all([
      prisma.recipient.findMany({
        where,
        include: { _count: { select: { certificates: true } } },
        orderBy: { createdAt: 'desc' },
        skip:    (page - 1) * limit,
        take:    limit,
      }),
      prisma.recipient.count({ where }),
    ]);

    return ok(res, { recipients, total, page, pages: Math.ceil(total / limit) });
  },

  async getById(req: Request, res: Response) {
    const id = str(req.params.id);
    const r = await prisma.recipient.findFirst({
      where:   { id, organizationId: req.orgId! },
      include: {
        certificates: {
          select: { id: true, certificateId: true, title: true, status: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!r) return notFound(res, 'Recipient not found.');
    return ok(res, r);
  },
};
