import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { ok, created, notFound } from '../utils/apiResponse';
import { audit } from '../utils/auditLog';
import { str } from '../utils/param';

export const templateController = {

  async list(req: Request, res: Response) {
    const templates = await prisma.certificateTemplate.findMany({
      where:   { organizationId: req.orgId! },
      orderBy: { createdAt: 'desc' },
    });
    return ok(res, templates);
  },

  async create(req: Request, res: Response) {
    const { name, configuration } = req.body;
    const template = await prisma.certificateTemplate.create({
      data: { organizationId: req.orgId!, name, configuration },
    });
    await audit({ userId: req.user!.userId, organizationId: req.orgId!, action: 'TEMPLATE_CREATED', resourceType: 'Template', resourceId: template.id });
    return created(res, template, 'Template created.');
  },

  async getById(req: Request, res: Response) {
    const id = str(req.params.id);
    const t = await prisma.certificateTemplate.findFirst({
      where: { id, organizationId: req.orgId! },
    });
    if (!t) return notFound(res, 'Template not found.');
    return ok(res, t);
  },

  async update(req: Request, res: Response) {
    const id = str(req.params.id);
    const t = await prisma.certificateTemplate.findFirst({
      where: { id, organizationId: req.orgId! },
    });
    if (!t) return notFound(res, 'Template not found.');

    const updated = await prisma.certificateTemplate.update({
      where: { id },
      data:  { name: req.body.name, configuration: req.body.configuration },
    });
    await audit({ userId: req.user!.userId, organizationId: req.orgId!, action: 'TEMPLATE_UPDATED', resourceId: t.id });
    return ok(res, updated, 'Template updated.');
  },

  async delete(req: Request, res: Response) {
    const id = str(req.params.id);
    const t = await prisma.certificateTemplate.findFirst({
      where: { id, organizationId: req.orgId! },
    });
    if (!t) return notFound(res, 'Template not found.');

    await prisma.certificateTemplate.delete({ where: { id } });
    await audit({ userId: req.user!.userId, organizationId: req.orgId!, action: 'TEMPLATE_DELETED', resourceId: t.id });
    return ok(res, null, 'Template deleted.');
  },
};
