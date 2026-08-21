import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { env } from '../config/env';

export interface CertificateData {
  certificateId:  string;
  recipientName:  string;
  title:          string;
  achievement?:   string;
  description?:   string;
  customMessage?: string;
  issueDate:      Date;
  expiryDate?:    Date | null;
  organizationName: string;
  verificationUrl: string;
  template?: {
    primaryColor?:  string;
    accentColor?:   string;
    fontFamily?:    string;
    showLogo?:      boolean;
    showQR?:        boolean;
  };
}

export async function generateCertificatePdf(data: CertificateData): Promise<Buffer> {
  const primaryColor = data.template?.primaryColor ?? '#112a29';
  const accentColor  = data.template?.accentColor  ?? '#ddf05c';

  const qrDataUrl = await QRCode.toDataURL(data.verificationUrl, {
    width: 100,
    margin: 1,
    color: { dark: primaryColor, light: '#ffffff' },
  });
  const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];

    const doc = new PDFDocument({
      size:   'A4',
      layout: 'landscape',
      margin: 0,
    });

    doc.on('data',  (c) => chunks.push(c));
    doc.on('end',   ()  => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = doc.page.width;
    const H = doc.page.height;

    doc.rect(0, 0, W, H).fill('#f7f4ed');

    doc.rect(0, 0, 28, H).fill(primaryColor);
    doc.rect(W - 28, 0, 28, H).fill(primaryColor);

    doc.rect(28, 0, W - 56, 8).fill(accentColor);
    doc.rect(28, H - 8, W - 56, 8).fill(accentColor);

    doc
      .rect(40, 20, W - 80, H - 40)
      .lineWidth(1.5)
      .stroke('#c9c1af');

    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor('#637472')
      .text('OFFICIAL ACADEMIC CERTIFICATE', 0, 44, { align: 'center', characterSpacing: 2 });

    doc
      .circle(W / 2, 85, 18)
      .fillAndStroke(primaryColor, primaryColor);
    doc
      .font('Helvetica-Bold')
      .fontSize(16)
      .fillColor(accentColor)
      .text('✓', W / 2 - 6, 78);

    doc
      .font('Helvetica-Bold')
      .fontSize(26)
      .fillColor(primaryColor)
      .text(data.title, 60, 120, { align: 'center', width: W - 120 });

    doc
      .moveTo(W / 2 - 80, 168)
      .lineTo(W / 2 + 80, 168)
      .lineWidth(1)
      .stroke('#c9c1af');

    doc
      .font('Helvetica')
      .fontSize(11)
      .fillColor('#637472')
      .text('This certificate is proudly presented to', 0, 182, { align: 'center' });

    doc
      .font('Helvetica-Bold')
      .fontSize(32)
      .fillColor(primaryColor)
      .text(data.recipientName, 60, 200, { align: 'center', width: W - 120 });

    if (data.achievement) {
      doc
        .font('Helvetica')
        .fontSize(12)
        .fillColor('#637472')
        .text('for successfully completing', 0, 248, { align: 'center' });

      doc
        .font('Helvetica-Bold')
        .fontSize(18)
        .fillColor('#167862')
        .text(data.achievement, 60, 268, { align: 'center', width: W - 120 });
    }

    if (data.customMessage) {
      doc
        .font('Helvetica')
        .fontSize(11)
        .fillColor('#637472')
        .text(data.customMessage, 80, 302, { align: 'center', width: W - 160 });
    }

    const footerY = H - 95;

    doc
      .moveTo(60, footerY - 10)
      .lineTo(W - 60, footerY - 10)
      .lineWidth(0.5)
      .stroke('#d9d4c8');

    const dateStr = data.issueDate.toLocaleDateString('en-GB', {
      day: '2-digit', month: 'long', year: 'numeric',
    });

    doc.font('Helvetica').fontSize(9).fillColor('#637472');
    doc.text('ISSUE DATE', 70, footerY, { continued: false });
    doc.font('Helvetica-Bold').fontSize(10).fillColor(primaryColor)
       .text(dateStr, 70, footerY + 12);

    doc.font('Helvetica').fontSize(9).fillColor('#637472')
       .text('ISSUED BY', W / 2 - 50, footerY, { align: 'center', width: 100 });
    doc.font('Helvetica-Bold').fontSize(10).fillColor(primaryColor)
       .text(data.organizationName, W / 2 - 80, footerY + 12, { align: 'center', width: 160 });

    doc.font('Helvetica').fontSize(9).fillColor('#637472')
       .text('CERTIFICATE ID', W - 220, footerY);
    doc.font('Helvetica-Bold').fontSize(9)
       .fillColor('#167862')
       .text(data.certificateId, W - 220, footerY + 12);

    if (data.template?.showQR !== false) {
      doc.image(qrBuffer, W - 115, H - 120, { width: 72, height: 72 });
      doc.font('Helvetica').fontSize(6).fillColor('#637472')
         .text('Scan to verify', W - 115, H - 44, { width: 72, align: 'center' });
    }

    if (data.expiryDate) {
      const expStr = data.expiryDate.toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
      });
      doc.font('Helvetica').fontSize(8).fillColor('#a33c38')
         .text(`Valid until: ${expStr}`, 70, footerY + 28);
    }

    doc.font('Helvetica').fontSize(7).fillColor('#aeb9b1')
       .text('Verified by CertiChain — certichain.app', 0, H - 18, { align: 'center' });

    doc.end();
  });
}
