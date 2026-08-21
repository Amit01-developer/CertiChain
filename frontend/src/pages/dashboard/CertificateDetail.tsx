import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { Download, Copy, ExternalLink, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';
import type { Certificate } from '../../types';

const fmt = (d: string) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(d));

export default function CertificateDetail() {
  const { id } = useParams<{ id: string }>();
  const { organization } = useAuth();
  const orgId = organization?.id ?? '';
  const [cert, setCert] = useState<Certificate & { revocation?: { reason: string; revokedAt: string } } | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrSrc, setQrSrc] = useState('');
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    if (!orgId || !id) return;
    api.get(`/organizations/${orgId}/certificates/${id}`)
      .then(r => setCert(r.data.data))
      .finally(() => setLoading(false));
  }, [orgId, id]);

  useEffect(() => {
    if (cert?.verificationUrl) {
      QRCode.toDataURL(cert.verificationUrl, { width: 150, margin: 1 }).then(setQrSrc);
    }
  }, [cert]);

  async function handleRevoke() {
    if (!revokeReason.trim()) { toast.error('Reason is required.'); return; }
    setRevoking(true);
    try {
      await api.post(`/organizations/${orgId}/certificates/${id}/revoke`, { reason: revokeReason });
      toast.success('Certificate revoked.');
      setRevokeOpen(false);
      setCert(c => c ? { ...c, status: 'REVOKED' } : c);
    } catch {
      toast.error('Failed to revoke.');
    } finally { setRevoking(false); }
  }

  function copyLink() {
    if (cert?.verificationUrl) { navigator.clipboard.writeText(cert.verificationUrl); toast.success('Link copied!'); }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!cert)   return <div className="text-center py-20 text-gray-500">Certificate not found.</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link to="/dashboard/certificates" className="text-sm text-gray-400 hover:text-brand-mid mb-1 block">← Certificates</Link>
          <h1 className="font-serif text-2xl text-brand-dark">{cert.title}</h1>
          <p className="font-mono text-sm text-brand-mid mt-1">{cert.certificateId}</p>
        </div>
        <Badge status={cert.status} />
      </div>

      <div className="card mb-5">
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
          {([
            ['Recipient',   cert.recipient?.name],
            ['Email',       cert.recipient?.email],
            ['Issue Date',  fmt(cert.issueDate)],
            ...(cert.expiryDate ? [['Expiry Date', fmt(cert.expiryDate)]] : []),
            ...(cert.achievement ? [['Achievement', cert.achievement]] : []),
            ...(cert.description ? [['Description', cert.description]] : []),
          ] as [string, string][]).map(([k, v]) => (
            <div key={k as string}>
              <p className="text-xs font-mono text-gray-400 uppercase tracking-wide">{k}</p>
              <p className="text-sm text-brand-dark mt-0.5">{v as string}</p>
            </div>
          ))}
        </div>

        {(cert as any).revocation && (
          <div className="mt-5 bg-red-50 border border-red-100 px-4 py-3">
            <p className="text-xs font-mono text-red-400 uppercase mb-1">Revocation Reason</p>
            <p className="text-sm text-red-700">{(cert as any).revocation.reason}</p>
            <p className="text-xs text-red-400 mt-1">Revoked on {fmt((cert as any).revocation.revokedAt)}</p>
          </div>
        )}
      </div>

      <div className="card mb-5">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {qrSrc && (
            <div className="text-center shrink-0">
              <img src={qrSrc} alt="QR" width={150} height={150} />
              <p className="text-xs text-gray-400 mt-1">Verification QR</p>
            </div>
          )}
          <div className="flex-1 space-y-3">
            {cert.pdfUrl && (
              <a href={cert.pdfUrl} target="_blank" rel="noreferrer" className="btn-secondary flex items-center gap-2 w-full justify-center">
                <Download size={14} /> Download PDF
              </a>
            )}
            <button onClick={copyLink} className="btn-secondary flex items-center gap-2 w-full justify-center">
              <Copy size={14} /> Copy Verification Link
            </button>
            <a href={cert.verificationUrl} target="_blank" rel="noreferrer" className="btn-secondary flex items-center gap-2 w-full justify-center">
              <ExternalLink size={14} /> Open Public Page
            </a>
            {cert.status === 'ACTIVE' && (
              <button onClick={() => setRevokeOpen(true)} className="btn-danger flex items-center gap-2 w-full justify-center">
                <AlertTriangle size={14} /> Revoke Certificate
              </button>
            )}
          </div>
        </div>
      </div>

      <Modal open={revokeOpen} onClose={() => setRevokeOpen(false)} title="Revoke Certificate">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Revoking <strong>{cert.certificateId}</strong> will mark it as invalid. This action cannot be undone.
          </p>
          <div>
            <label className="label">Reason for revocation *</label>
            <textarea
              className="input h-24 resize-none"
              value={revokeReason}
              onChange={e => setRevokeReason(e.target.value)}
              placeholder="e.g. Issued in error, incorrect details…"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={handleRevoke} disabled={revoking} className="btn-danger flex-1 py-2.5">
              {revoking ? 'Revoking…' : 'Confirm Revoke'}
            </button>
            <button onClick={() => setRevokeOpen(false)} className="btn-secondary px-6 py-2.5">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
