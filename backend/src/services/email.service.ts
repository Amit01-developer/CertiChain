import { env } from '../config/env';
import { logger } from '../utils/logger';

interface SendOptions {
  to:      string;
  subject: string;
  html:    string;
  text?:   string;
}

/**
 * Email service — pluggable provider (log / smtp / resend).
 * Set EMAIL_PROVIDER in .env. In dev the 'log' provider prints to console.
 */
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
    const nodemailer = await import('nodemailer');
    const transport = nodemailer.default.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
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
    // @ts-ignore — optional dep: install resend package if using Resend provider
    const { Resend } = await import('resend');
    const resend = new Resend(env.RESEND_API_KEY);
    await resend.emails.send({
      from:    `${env.EMAIL_FROM_NAME} <${env.EMAIL_FROM}>`,
      to:      opts.to,
      subject: opts.subject,
      html:    opts.html,
    });
  }

  // ── Template helpers ──────────────────────────────────────────────────────

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
}

export const emailService = new EmailService();
