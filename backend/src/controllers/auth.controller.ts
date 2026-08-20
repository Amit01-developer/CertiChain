import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import prisma from '../config/prisma';
import { env } from '../config/env';
import { emailService } from '../services/email.service';
import { audit } from '../utils/auditLog';
import {
  ok, created, badRequest, unauthorized, conflict, notFound, serverError
} from '../utils/apiResponse';

function signToken(userId: string, email: string, role: string): string {
  return jwt.sign({ userId, email, role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });
}

export const authController = {

  async register(req: Request, res: Response) {
    const { name, email, password, organizationName, organizationType, website } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return conflict(res, 'An account with this email already exists.');

    const passwordHash  = await bcrypt.hash(password, 12);
    const emailToken    = randomBytes(32).toString('hex');

    const user = await prisma.user.create({
      data: {
        name, email, passwordHash,
        emailToken,
        emailVerified: false,
      },
    });

    // Create organization and set user as OWNER
    const org = await prisma.organization.create({
      data: {
        name:    organizationName,
        type:    organizationType ?? 'Other',
        email,
        website: website ?? null,
        members: { create: { userId: user.id, role: 'OWNER' } },
      },
    });

    // Send verification email
    const { subject, html } = emailService.verificationEmail(name, emailToken);
    await emailService.send({ to: email, subject, html });

    await audit({ userId: user.id, organizationId: org.id, action: 'USER_REGISTERED', resourceType: 'User', resourceId: user.id, ipAddress: req.ip });

    return created(res, { userId: user.id, email: user.name }, 'Account created. Please verify your email.');
  },

  async login(req: Request, res: Response) {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return unauthorized(res, 'Invalid email or password.');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return unauthorized(res, 'Invalid email or password.');

    // Fetch first org membership
    const membership = await prisma.orgMember.findFirst({
      where:   { userId: user.id },
      include: { organization: true },
      orderBy: { createdAt: 'asc' },
    });

    const token = signToken(user.id, user.email, user.role);
    await audit({ userId: user.id, organizationId: membership?.organizationId, action: 'USER_LOGIN', ipAddress: req.ip });

    return ok(res, {
      token,
      user: {
        id:            user.id,
        name:          user.name,
        email:         user.email,
        emailVerified: user.emailVerified,
        role:          user.role,
      },
      organization: membership?.organization ?? null,
    }, 'Login successful.');
  },

  async verifyEmail(req: Request, res: Response) {
    const { token } = req.query as { token: string };
    if (!token) return badRequest(res, 'Verification token is required.');

    const user = await prisma.user.findFirst({ where: { emailToken: token } });
    if (!user) return badRequest(res, 'Invalid or expired verification token.');

    await prisma.user.update({
      where: { id: user.id },
      data:  { emailVerified: true, emailToken: null },
    });

    await audit({ userId: user.id, action: 'EMAIL_VERIFIED', ipAddress: req.ip });
    return ok(res, null, 'Email verified successfully.');
  },

  async forgotPassword(req: Request, res: Response) {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    // Always return same message to prevent email enumeration
    if (!user) return ok(res, null, 'If that email exists, a reset link has been sent.');

    const resetToken = randomBytes(32).toString('hex');
    const resetExp   = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data:  { resetToken, resetTokenExp: resetExp },
    });

    const { subject, html } = emailService.passwordResetEmail(user.name, resetToken);
    await emailService.send({ to: email, subject, html });

    await audit({ userId: user.id, action: 'PASSWORD_RESET_REQUESTED', ipAddress: req.ip });
    return ok(res, null, 'If that email exists, a reset link has been sent.');
  },

  async resetPassword(req: Request, res: Response) {
    const { token, password } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        resetToken:    token,
        resetTokenExp: { gt: new Date() },
      },
    });

    if (!user) return badRequest(res, 'Invalid or expired reset token.');

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data:  { passwordHash, resetToken: null, resetTokenExp: null },
    });

    await audit({ userId: user.id, action: 'PASSWORD_RESET', ipAddress: req.ip });
    return ok(res, null, 'Password reset successfully. Please log in.');
  },

  async me(req: Request, res: Response) {
    const user = await prisma.user.findUnique({
      where:  { id: req.user!.userId },
      select: { id: true, name: true, email: true, emailVerified: true, role: true, createdAt: true },
    });
    if (!user) return notFound(res, 'User not found.');

    const memberships = await prisma.orgMember.findMany({
      where:   { userId: user.id },
      include: { organization: true },
    });

    return ok(res, { user, organizations: memberships.map((m: any) => ({ ...m.organization, role: m.role })) });
  },

  async changePassword(req: Request, res: Response) {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) return notFound(res, 'User not found.');

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return unauthorized(res, 'Current password is incorrect.');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data:  { passwordHash },
    });

    await audit({ userId: user.id, action: 'PASSWORD_CHANGED', ipAddress: req.ip });
    return ok(res, null, 'Password updated successfully.');
  },
};
