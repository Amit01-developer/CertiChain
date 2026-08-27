/**
 * CertificatePreview
 * ------------------
 * Renders a live canvas preview that mirrors the PDFKit landscape certificate.
 * No backend call — everything is drawn client-side via the Canvas 2D API.
 *
 * PDF A4 landscape: 841.89 × 595.28 pt.
 * We scale the canvas to fit the modal width while keeping that aspect ratio.
 */

import { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import type { TemplateConfig } from '../../types';

export interface PreviewProps {
  config:       TemplateConfig;
  orgName:      string;
  orgLogoUrl?:  string | null;
  onClose:      () => void;
}

// ─── PDF coordinate constants (points at 1:1 scale) ───────────────────────────
const PDF_W = 841.89;
const PDF_H = 595.28;

// Helper: load an image URL into an HTMLImageElement, return null on failure
async function loadImg(url: string): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

// Draw the CertiChain badge (circle + checkmark + wordmark) at (cx, cy, r)
function drawBadge(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  primaryColor: string, accentColor: string,
  scale: number,
) {
  // Circle
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = primaryColor;
  ctx.fill();

  // Checkmark path — same points as PDFKit version, scaled
  ctx.beginPath();
  ctx.moveTo(cx - 8 * scale,  cy);
  ctx.lineTo(cx - 2 * scale,  cy + 6 * scale);
  ctx.lineTo(cx + 9 * scale,  cy - 7 * scale);
  ctx.strokeStyle   = accentColor;
  ctx.lineWidth     = 2.8 * scale;
  ctx.lineCap       = 'round';
  ctx.lineJoin      = 'round';
  ctx.stroke();

  // "CertiChain" wordmark below
  ctx.font         = `bold ${Math.round(7 * scale)}px Helvetica, Arial, sans-serif`;
  ctx.fillStyle    = primaryColor;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.letterSpacing = `${0.5 * scale}px`;
  ctx.fillText('CertiChain', cx, cy + r + 4 * scale);
  ctx.letterSpacing = '0px';
}

export default function CertificatePreview({ config, orgName, orgLogoUrl, onClose }: PreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const primaryColor = config.primaryColor ?? '#112a29';
  const accentColor  = config.accentColor  ?? '#ddf05c';
  const showLogo     = config.showLogo !== false;
  const showQR       = config.showQR  !== false;
  const customImgUrl = config.customImageUrl ?? null;

  const draw = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Scale to fit canvas element width
    const scale  = canvas.width / PDF_W;
    const W      = canvas.width;
    const H      = canvas.height;

    // ── Background ──────────────────────────────────────────────────────────
    ctx.fillStyle = '#f7f4ed';
    ctx.fillRect(0, 0, W, H);

    // ── Side bars ───────────────────────────────────────────────────────────
    ctx.fillStyle = primaryColor;
    ctx.fillRect(0,         0, 28 * scale, H);
    ctx.fillRect(W - 28 * scale, 0, 28 * scale, H);

    // ── Accent strips ───────────────────────────────────────────────────────
    ctx.fillStyle = accentColor;
    ctx.fillRect(28 * scale, 0,              W - 56 * scale, 8 * scale);
    ctx.fillRect(28 * scale, H - 8 * scale,  W - 56 * scale, 8 * scale);

    // ── Custom watermark ────────────────────────────────────────────────────
    if (customImgUrl) {
      const img = await loadImg(customImgUrl);
      if (img) {
        const sz = 140 * scale;
        ctx.save();
        ctx.globalAlpha = 0.12;
        ctx.drawImage(img, (W - sz) / 2, (H - sz) / 2, sz, sz);
        ctx.restore();
      }
    }

    // ── Decorative inner border ─────────────────────────────────────────────
    ctx.strokeStyle = '#c9c1af';
    ctx.lineWidth   = 1.5 * scale;
    ctx.strokeRect(40 * scale, 20 * scale, W - 80 * scale, H - 40 * scale);

    // ── Org logo (top-right) ────────────────────────────────────────────────
    if (showLogo && orgLogoUrl) {
      const img = await loadImg(orgLogoUrl);
      if (img) {
        const maxW = 64 * scale, maxH = 40 * scale;
        const ratio = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
        const iw = img.naturalWidth  * ratio;
        const ih = img.naturalHeight * ratio;
        ctx.drawImage(img, W - 130 * scale, 28 * scale, iw, ih);
      }
    }

    // ── Header label ────────────────────────────────────────────────────────
    ctx.font         = `bold ${Math.round(9 * scale)}px Helvetica, Arial, sans-serif`;
    ctx.fillStyle    = '#637472';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.letterSpacing = `${2 * scale}px`;
    ctx.fillText('OFFICIAL ACADEMIC CERTIFICATE', W / 2, 44 * scale);
    ctx.letterSpacing = '0px';

    // ── CertiChain badge ─────────────────────────────────────────────────────
    drawBadge(ctx, W / 2, 85 * scale, 20 * scale, primaryColor, accentColor, scale);

    // ── Certificate title ────────────────────────────────────────────────────
    ctx.font         = `bold ${Math.round(26 * scale)}px Georgia, serif`;
    ctx.fillStyle    = primaryColor;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Certificate of Completion', W / 2, 120 * scale);

    // ── Divider ──────────────────────────────────────────────────────────────
    ctx.beginPath();
    ctx.moveTo(W / 2 - 80 * scale, 168 * scale);
    ctx.lineTo(W / 2 + 80 * scale, 168 * scale);
    ctx.strokeStyle = '#c9c1af';
    ctx.lineWidth   = 1 * scale;
    ctx.stroke();

    // ── "presented to" label ─────────────────────────────────────────────────
    ctx.font         = `${Math.round(11 * scale)}px Helvetica, Arial, sans-serif`;
    ctx.fillStyle    = '#637472';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('This certificate is proudly presented to', W / 2, 182 * scale);

    // ── Recipient name ────────────────────────────────────────────────────────
    ctx.font         = `bold ${Math.round(32 * scale)}px Georgia, serif`;
    ctx.fillStyle    = primaryColor;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Recipient Name', W / 2, 200 * scale);

    // ── Achievement ───────────────────────────────────────────────────────────
    ctx.font         = `${Math.round(12 * scale)}px Helvetica, Arial, sans-serif`;
    ctx.fillStyle    = '#637472';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('for successfully completing', W / 2, 248 * scale);

    ctx.font         = `bold ${Math.round(18 * scale)}px Helvetica, Arial, sans-serif`;
    ctx.fillStyle    = '#167862';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('B.Tech — Information Technology', W / 2, 268 * scale);

    // ── Footer divider ────────────────────────────────────────────────────────
    const footerY = H - 95 * scale;
    ctx.beginPath();
    ctx.moveTo(60 * scale,      footerY - 10 * scale);
    ctx.lineTo(W - 60 * scale,  footerY - 10 * scale);
    ctx.strokeStyle = '#d9d4c8';
    ctx.lineWidth   = 0.5 * scale;
    ctx.stroke();

    // ── Issue date ────────────────────────────────────────────────────────────
    const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    ctx.font         = `${Math.round(9 * scale)}px Helvetica, Arial, sans-serif`;
    ctx.fillStyle    = '#637472';
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('ISSUE DATE', 70 * scale, footerY);
    ctx.font      = `bold ${Math.round(10 * scale)}px Helvetica, Arial, sans-serif`;
    ctx.fillStyle = primaryColor;
    ctx.fillText(todayStr, 70 * scale, footerY + 12 * scale);

    // ── Issued by ─────────────────────────────────────────────────────────────
    ctx.font         = `${Math.round(9 * scale)}px Helvetica, Arial, sans-serif`;
    ctx.fillStyle    = '#637472';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('ISSUED BY', W / 2, footerY);
    ctx.font      = `bold ${Math.round(10 * scale)}px Helvetica, Arial, sans-serif`;
    ctx.fillStyle = primaryColor;
    ctx.fillText(orgName, W / 2, footerY + 12 * scale);

    // ── Certificate ID ────────────────────────────────────────────────────────
    ctx.font         = `${Math.round(9 * scale)}px Helvetica, Arial, sans-serif`;
    ctx.fillStyle    = '#637472';
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('CERTIFICATE ID', (W - 220 * scale), footerY);
    ctx.font      = `bold ${Math.round(9 * scale)}px Helvetica, Arial, sans-serif`;
    ctx.fillStyle = '#167862';
    ctx.fillText('CC-PREVIEW-2026', (W - 220 * scale), footerY + 12 * scale);

    // ── QR placeholder ────────────────────────────────────────────────────────
    if (showQR) {
      const qx = W - 115 * scale, qy = H - 120 * scale, qs = 72 * scale;
      ctx.fillStyle   = '#e8e4dc';
      ctx.fillRect(qx, qy, qs, qs);
      ctx.strokeStyle = '#c9c1af';
      ctx.lineWidth   = 1 * scale;
      ctx.strokeRect(qx, qy, qs, qs);
      ctx.font         = `${Math.round(7 * scale)}px Helvetica, Arial, sans-serif`;
      ctx.fillStyle    = '#637472';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('QR', qx + qs / 2, qy + qs / 2);
      ctx.font         = `${Math.round(6 * scale)}px Helvetica, Arial, sans-serif`;
      ctx.fillStyle    = '#637472';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('Scan to verify', qx + qs / 2, qy + qs + 2 * scale);
    }

    // ── Footer watermark ──────────────────────────────────────────────────────
    ctx.font         = `${Math.round(7 * scale)}px Helvetica, Arial, sans-serif`;
    ctx.fillStyle    = '#aeb9b1';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Verified by CertiChain — certichain.app', W / 2, H - 5 * scale);

  }, [primaryColor, accentColor, showLogo, showQR, orgName, orgLogoUrl, customImgUrl]);

  useEffect(() => { draw(); }, [draw]);

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      {/* Modal panel */}
      <div
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <div>
            <p className="font-semibold text-brand-dark text-sm">Certificate Preview</p>
            <p className="text-xs text-gray-400">Sample data — colours and layout reflect your template settings</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors"
            aria-label="Close preview"
          >
            <X size={20} />
          </button>
        </div>

        {/* Canvas */}
        <div className="p-4 bg-gray-50 rounded-b-xl overflow-auto">
          <canvas
            ref={canvasRef}
            width={800}
            height={Math.round(800 / PDF_W * PDF_H)}
            className="w-full rounded border border-gray-200 shadow"
            style={{ aspectRatio: `${PDF_W} / ${PDF_H}` }}
          />
        </div>

        {/* Footer note */}
        <div className="px-5 py-2 border-t border-gray-100 bg-white rounded-b-xl">
          <p className="text-xs text-gray-400 text-center">
            Preview uses sample data. Actual certificates will show real recipient details and a live QR code.
          </p>
        </div>
      </div>
    </div>
  );
}
