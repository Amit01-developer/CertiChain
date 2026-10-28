import { env } from '../config/env';
import { logger } from '../utils/logger';

interface SendOptions {
  to:      string;
  subject: string;
  html:    string;
  text?:   string;
}

export class EmailService {
  async send(opts: SendOptions): Promise<void> {
    switch (env.EMAIL_PROVIDER) {
      case 'smtp':   return this.sendSmtp(opts);
      case 'resend': return this.sendResend(opts);
      default:       return this.logEmail(opts);
    }
  }

  private logEmail(opts: SendOptions): void {
    logger.info('📧 [EMAIL LOG — configure EMAIL_PROVIDER for real delivery]', {
      to:      opts.to,
      subject: opts.subject,
    });
  }

  private async sendSmtp(opts: SendOptions): Promise<void> {
    if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
      logger.warn('[EMAIL] SMTP is enabled but missing SMTP_HOST / SMTP_USER / SMTP_PASS. Falling back to log mode.');
      return this.logEmail(opts);
    }

    const nodemailer = await import('nodemailer');
    const transport = nodemailer.default.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      requireTLS: env.SMTP_REQUIRE_TLS,
      tls: { rejectUnauthorized: env.SMTP_TLS_REJECT_UNAUTHORIZED },
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
      connectionTimeout: 20000,
      greetingTimeout: 15000,
    });

    await transport.sendMail({
      from:    `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM}>`,
      to:      opts.to,
      subject: opts.subject,
      html:    opts.html,
      text:    opts.text,
    });
  }

  private async sendResend(opts: SendOptions): Promise<void> {
    const { Resend } = await import('resend');
    const resend = new Resend(env.RESEND_API_KEY);
    await resend.emails.send({
      from:    `${env.EMAIL_FROM_NAME} <${env.EMAIL_FROM}>`,
      to:      opts.to,
      subject: opts.subject,
      html:    opts.html,
    });
  }


  verificationEmail(name: string, token: string): Pick<SendOptions, 'subject' | 'html'> {
    const url = `${env.FRONTEND_URL}/verify-email?token=${token}`;
    return {
      subject: 'Verify your CertiChain email address',
      html: `
        <h2>Welcome to CertiChain, ${name}!</h2>
        <p>Please verify your email address to activate your account.</p>
        <a href="${url}" style="background:#112a29;color:#ddf05c;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;margin:16px 0;">
          Verify Email
        </a>
        <p>Or copy this link: ${url}</p>
        <p>This link expires in 24 hours.</p>
      `,
    };
  }

  passwordResetEmail(name: string, token: string): Pick<SendOptions, 'subject' | 'html'> {
    const url = `${env.FRONTEND_URL}/reset-password?token=${token}`;
    return {
      subject: 'Reset your CertiChain password',
      html: `
        <h2>Hi ${name},</h2>
        <p>You requested a password reset. Click the link below:</p>
        <a href="${url}" style="background:#112a29;color:#ddf05c;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;margin:16px 0;">
          Reset Password
        </a>
        <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>
      `,
    };
  }

  certificateIssuedEmail(
    recipientName:  string,
    recipientEmail: string,
    certId:         string,
    certTitle:      string,
    orgName:        string,
    verifyUrl:      string
  ): SendOptions {
    return {
      to:      recipientEmail,
      subject: `Your certificate has been issued — ${certTitle}`,
      html: `
        <h2>Hi ${recipientName},</h2>
        <p>Your certificate <strong>${certTitle}</strong> has been issued by <strong>${orgName}</strong>.</p>
        <p><strong>Certificate ID:</strong> ${certId}</p>
        <a href="${verifyUrl}" style="background:#112a29;color:#ddf05c;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;margin:16px 0;">
          View &amp; Verify Certificate
        </a>
        <p>You can share this link to let anyone verify your certificate's authenticity.</p>
      `,
    };
  }

  /**
   * Sent when an existing user is directly added as staff (no invitation link needed).
   */
  staffAddedEmail(name: string, email: string, orgName: string, dashboardUrl: string): SendOptions {
    return {
      to:      email,
      subject: `You have been added as a Staff Member of ${orgName} on CertiChain`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <h2 style="color:#112a29;">Welcome to ${orgName}, ${name}!</h2>
          <p>You have been added as a <strong>Staff Member</strong> of <strong>${orgName}</strong> on CertiChain.</p>
          <p>As a staff member you can:</p>
          <ul>
            <li>Issue certificates on behalf of ${orgName}</li>
            <li>View certificate records</li>
            <li>Participate in certificate review/verification tasks</li>
          </ul>
          <a href="${dashboardUrl}" style="background:#112a29;color:#ddf05c;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;margin:16px 0;">
            Go to Dashboard
          </a>
          <p style="color:#666;font-size:13px;">If you have any questions, contact your organization administrator.</p>
        </div>
      `,
    };
  }

  /**
   * Sent to a reviewer (staff or owner) when they are assigned to review a certificate.
   */
  reviewAssignedEmail(
    reviewerName:  string,
    reviewerEmail: string,
    certTitle:     string,
    recipientName: string,
    orgName:       string,
    reviewUrl:     string,
  ): SendOptions {
    return {
      to:      reviewerEmail,
      subject: `Action required: Review certificate "${certTitle}" — ${orgName}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <h2 style="color:#112a29;">Certificate Review Assigned</h2>
          <p>Hi ${reviewerName},</p>
          <p>You have been assigned to review the following certificate in <strong>${orgName}</strong>:</p>
          <table style="border-collapse:collapse;width:100%;margin:16px 0;">
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Certificate</td><td style="padding:8px;border:1px solid #ddd;">${certTitle}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Recipient</td><td style="padding:8px;border:1px solid #ddd;">${recipientName}</td></tr>
          </table>
          <p>Please review and either <strong>Approve</strong> or <strong>Reject</strong> the certificate. It will only be issued once both the staff reviewer and the owner/admin have approved.</p>
          <a href="${reviewUrl}" style="background:#112a29;color:#ddf05c;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;margin:16px 0;">
            Review Certificate
          </a>
          <p style="color:#888;font-size:12px;">If you believe this was sent in error, contact your organization administrator.</p>
        </div>
      `,
    };
  }

  /**
   * Sent to a new (unregistered) user who has been invited as staff.
   */
  staffInvitationEmail(email: string, orgName: string, inviteUrl: string): SendOptions {
    return {
      to:      email,
      subject: `You have been invited as a Staff Member of ${orgName} on CertiChain`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <h2 style="color:#112a29;">You've been invited to join ${orgName}</h2>
          <p>You have been invited to join <strong>${orgName}</strong> as a <strong>Staff Member</strong> on CertiChain — a blockchain-backed digital certificate platform.</p>
          <p>As a staff member you will be able to:</p>
          <ul>
            <li>Issue digital certificates on behalf of ${orgName}</li>
            <li>View and manage certificate records</li>
            <li>Participate in certificate review and verification tasks</li>
          </ul>
          <p><strong>To accept this invitation, click the button below:</strong></p>
          <a href="${inviteUrl}" style="background:#112a29;color:#ddf05c;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;margin:16px 0;">
            Accept Invitation
          </a>
          <p>Or copy this link:<br/><small style="color:#666;word-break:break-all;">${inviteUrl}</small></p>
          <p style="color:#888;font-size:12px;">This invitation expires in 72 hours. If you did not expect this email, you can safely ignore it.</p>
        </div>
      `,
    };
  }
}

export const emailService = new EmailService();
