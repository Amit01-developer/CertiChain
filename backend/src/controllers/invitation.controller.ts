import { Request, Response } from 'express';
import { randomBytes, createHash } from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { env } from '../config/env';
import { emailService } from '../services/email.service';
import { audit } from '../utils/auditLog';
import { str } from '../utils/param';
import {
  ok, created, badRequest, notFound, conflict, forbidden, serverError,
} from '../utils/apiResponse';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function signToken(userId: string, email: string, role: string): string {
  return jwt.sign({ userId, email, role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });
}

export const invitationController = {

  /** POST /api/organizations/:orgId/invitations
   *  Admin/Owner sends an invitation to an email address.
   *  – If user exists → add directly + send notification email.
   *  – If not → create pending invitation + send invite link.
   */
  async invite(req: Request, res: Response) {
    try {
    const orgId = req.orgId!;
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return badRequest(res, 'A valid email address is required.');
    }

    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) return notFound(res, 'Organization not found.');

    // Check if already a member
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const existingMember = await prisma.orgMember.findUnique({
        where: { organizationId_userId: { organizationId: orgId, userId: existingUser.id } },
      });
      if (existingMember) {
        return conflict(res, `${email} is already a member of this organization.`);
      }

      // User exists — add directly as STAFF
      const member = await prisma.orgMember.create({
        data: { organizationId: orgId, userId: existingUser.id, role: 'STAFF' },
      });

      // Send notification email (fire-and-forget)
      emailService.send(
        emailService.staffAddedEmail(existingUser.name, email, org.name, `${env.FRONTEND_URL}/dashboard`)
      ).catch(() => {});

      await audit({
        userId: req.user!.userId, organizationId: orgId,
        action: 'STAFF_INVITED_EXISTING',
        resourceType: 'OrgMember', resourceId: member.id,
        metadata: { email, method: 'direct_add' },
        ipAddress: req.ip,
      });

      return created(res, { type: 'added', email }, `${email} has been added as Staff.`);
    }

    // User does NOT exist — create a secure pending invitation
    // Check for existing pending invitation for this email+org
    const existingInvite = await prisma.staffInvitation.findUnique({
      where: { organizationId_email: { organizationId: orgId, email } },
    });

    if (existingInvite && existingInvite.status === 'PENDING' && existingInvite.expiresAt > new Date()) {
      return conflict(res, `A pending invitation already exists for ${email}. It expires soon.`);
    }

    // Upsert: replace expired/old invitations
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours

    await prisma.staffInvitation.upsert({
      where: { organizationId_email: { organizationId: orgId, email } },
      update: {
        tokenHash,
        status: 'PENDING',
        invitedById: req.user!.userId,
        expiresAt,
        acceptedAt: null,
      },
      create: {
        organizationId: orgId,
        email,
        tokenHash,
        role: 'STAFF',
        status: 'PENDING',
        invitedById: req.user!.userId,
        expiresAt,
      },
    });

    // Send invitation email
    const inviteUrl = `${env.FRONTEND_URL}/accept-invitation?token=${rawToken}`;
    emailService.send(
      emailService.staffInvitationEmail(email, org.name, inviteUrl)
    ).catch(() => {});

    await audit({
      userId: req.user!.userId, organizationId: orgId,
      action: 'STAFF_INVITATION_SENT',
      resourceType: 'StaffInvitation',
      metadata: { email, expiresAt },
      ipAddress: req.ip,
    });

    // Never return the raw token in API response
    return created(res, { type: 'invited', email }, `Invitation sent to ${email}.`);
    } catch (err: any) {
      return serverError(res, err?.message || 'Failed to send invitation.');
    }
  },

  /** POST /api/invitations/accept
   *  Public endpoint — called when invitee clicks the link.
   *  Body: { token, name?, password? } — name+password only needed if new user.
   */
  async accept(req: Request, res: Response) {
    const { token, name, password } = req.body;
    if (!token) return badRequest(res, 'Invitation token is required.');

    const tokenHash = hashToken(token);

    const invitation = await prisma.staffInvitation.findUnique({
      where: { tokenHash },
      include: { organization: true },
    });

    if (!invitation) return badRequest(res, 'Invalid or expired invitation token.');
    if (invitation.status !== 'PENDING') return badRequest(res, 'This invitation has already been used or expired.');
    if (invitation.expiresAt < new Date()) {
      await prisma.staffInvitation.update({
        where: { id: invitation.id },
        data:  { status: 'EXPIRED' },
      });
      return badRequest(res, 'This invitation has expired. Please ask your admin to re-invite you.');
    }

    const org = invitation.organization;

    // Find or create user
    let user = await prisma.user.findUnique({ where: { email: invitation.email } });

    if (user) {
      // Existing user — check not already a member (race condition safety)
      const existingMember = await prisma.orgMember.findUnique({
        where: { organizationId_userId: { organizationId: org.id, userId: user.id } },
      });
      if (!existingMember) {
        await prisma.orgMember.create({
          data: { organizationId: org.id, userId: user.id, role: invitation.role },
        });
      }
    } else {
      // New user — require name and password
      if (!name || !name.trim()) return badRequest(res, 'Your name is required to create an account.');
      if (!password || password.length < 8) return badRequest(res, 'Password must be at least 8 characters.');

      const passwordHash = await bcrypt.hash(password, 12);
      user = await prisma.user.create({
        data: {
          name:          name.trim(),
          email:         invitation.email,
          passwordHash,
          emailVerified: true, // invited by admin → email confirmed by invitation flow
        },
      });

      // Create org membership
      await prisma.orgMember.create({
        data: { organizationId: org.id, userId: user.id, role: invitation.role },
      });
    }

    // Mark invitation accepted
    await prisma.staffInvitation.update({
      where: { id: invitation.id },
      data:  { status: 'ACCEPTED', acceptedAt: new Date() },
    });

    await audit({
      userId: user.id, organizationId: org.id,
      action: 'STAFF_INVITATION_ACCEPTED',
      resourceType: 'StaffInvitation', resourceId: invitation.id,
      metadata: { email: invitation.email },
    });

    // Sign in the user immediately
    const jwtToken = signToken(user.id, user.email, user.role);

    return ok(res, {
      token: jwtToken,
      user:  { id: user.id, name: user.name, email: user.email, emailVerified: user.emailVerified, role: user.role },
      organization: { id: org.id, name: org.name, type: org.type, role: invitation.role },
    }, `Welcome to ${org.name}! You are now a Staff member.`);
  },

  /** GET /api/invitations/preview?token=...
   *  Public endpoint — returns invitation details so the frontend can show
   *  "You've been invited to <OrgName> as STAFF" before accepting.
   */
  async preview(req: Request, res: Response) {
    const { token } = req.query as { token: string };
    if (!token) return badRequest(res, 'Token is required.');

    const tokenHash = hashToken(token);
    const invitation = await prisma.staffInvitation.findUnique({
      where: { tokenHash },
      include: { organization: { select: { id: true, name: true, type: true, logoUrl: true } } },
    });

    if (!invitation) return badRequest(res, 'Invalid invitation token.');
    if (invitation.status !== 'PENDING') {
      return badRequest(res, invitation.status === 'ACCEPTED' ? 'This invitation has already been accepted.' : 'This invitation has expired.');
    }
    if (invitation.expiresAt < new Date()) {
      return badRequest(res, 'This invitation has expired.');
    }

    const userExists = !!(await prisma.user.findUnique({ where: { email: invitation.email } }));

    return ok(res, {
      email:        invitation.email,
      role:         invitation.role,
      organization: invitation.organization,
      expiresAt:    invitation.expiresAt,
      userExists,
    });
  },

  /** GET /api/organizations/:orgId/members
   *  Lists all members + pending invitations.
   */
  async listMembers(req: Request, res: Response) {
    const orgId = req.orgId!;

    const [members, pendingInvites] = await Promise.all([
      prisma.orgMember.findMany({
        where:   { organizationId: orgId },
        include: { user: { select: { id: true, name: true, email: true, avatarUrl: true, createdAt: true } } },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.staffInvitation.findMany({
        where:   { organizationId: orgId, status: 'PENDING', expiresAt: { gt: new Date() } },
        select:  { id: true, email: true, role: true, expiresAt: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return ok(res, { members, pendingInvites });
  },

  /** DELETE /api/organizations/:orgId/members/:memberId
   *  Remove a staff member. (Extended from existing to allow ADMIN role.)
   */
  async removeMember(req: Request, res: Response) {
    const orgId    = req.orgId!;
    const memberId = str(req.params.memberId);

    const member = await prisma.orgMember.findUnique({ where: { id: memberId } });
    if (!member || member.organizationId !== orgId) return notFound(res, 'Member not found.');
    if (member.role === 'OWNER') return forbidden(res, 'Cannot remove the organization owner.');

    // ADMIN cannot remove other ADMINs — only OWNER can
    if (req.orgRole === 'ADMIN' && member.role === 'ADMIN') {
      return forbidden(res, 'Admins cannot remove other admins. Only the owner can do this.');
    }

    await prisma.orgMember.delete({ where: { id: memberId } });

    await audit({
      userId: req.user!.userId, organizationId: orgId,
      action: 'MEMBER_REMOVED',
      metadata: { memberId, role: member.role },
      ipAddress: req.ip,
    });

    return ok(res, null, 'Member removed.');
  },

  /** DELETE /api/organizations/:orgId/invitations/:inviteId
   *  Cancel a pending invitation.
   */
  async cancelInvitation(req: Request, res: Response) {
    const orgId     = req.orgId!;
    const inviteId  = str(req.params.inviteId);

    const invite = await prisma.staffInvitation.findUnique({ where: { id: inviteId } });
    if (!invite || invite.organizationId !== orgId) return notFound(res, 'Invitation not found.');

    await prisma.staffInvitation.update({
      where: { id: inviteId },
      data:  { status: 'EXPIRED' },
    });

    await audit({
      userId: req.user!.userId, organizationId: orgId,
      action: 'STAFF_INVITATION_CANCELLED',
      metadata: { email: invite.email },
      ipAddress: req.ip,
    });

    return ok(res, null, 'Invitation cancelled.');
  },
};
