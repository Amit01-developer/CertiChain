import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { unauthorized, forbidden } from '../utils/apiResponse';
import prisma from '../config/prisma';
import { OrgMemberRole } from '@prisma/client';

export type { OrgMemberRole };

export interface AuthPayload {
  userId: string;
  email:  string;
  role:   string;
}

declare global {
  namespace Express {
    interface Request {
      user?:       AuthPayload;
      orgRole?:    OrgMemberRole;
      orgId?:      string;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token  = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return unauthorized(res, 'No authentication token provided.');

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    return unauthorized(res, 'Invalid or expired token.');
  }
}

export async function requireVerifiedEmail(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return unauthorized(res);
  const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
  if (!user?.emailVerified) {
    return forbidden(res, 'Please verify your email address first.');
  }
  next();
}

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== 'SUPER_ADMIN') return forbidden(res, 'Super admin access required.');
  next();
}

export function requireOrgRole(...minRoles: OrgMemberRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const orgId = Array.isArray(req.params.orgId) ? req.params.orgId[0] : (req.params.orgId ?? req.body.organizationId ?? req.query.orgId as string);
    if (!orgId) return forbidden(res, 'Organization context required.');
    if (!req.user) return unauthorized(res);

    const member = await prisma.orgMember.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId: req.user.userId } },
    });

    if (!member) return forbidden(res, 'You are not a member of this organization.');

    const hierarchy: OrgMemberRole[] = ['STAFF', 'ADMIN', 'OWNER'];
    const memberLevel = hierarchy.indexOf(member.role);
    const minLevel    = Math.min(...minRoles.map(r => hierarchy.indexOf(r)));

    if (memberLevel < minLevel) {
      return forbidden(res, `This action requires at least ${minRoles.join(' or ')} role.`);
    }

    req.orgRole = member.role as OrgMemberRole;
    req.orgId   = orgId;
    next();
  };
}
