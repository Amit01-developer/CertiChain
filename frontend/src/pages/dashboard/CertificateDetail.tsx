import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { Download, Copy, ExternalLink, AlertTriangle, ShieldCheck, ShieldX, ShieldAlert, ShieldOff, Loader, UserPlus, CheckCircle2, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';
import type { Certificate, BlockchainStatus, OrgMember, CertificateReview } from '../../types';

const fmt = (d: string) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(d));

function BlockchainStatusBadge({ status }: { status: BlockchainStatus | null | undefined }) {
  if (!status) return null;
  const map: Record<BlockchainStatus, { label: string; cls: string; Icon: React.ElementType }> = {
    CONFIRMED: { label: 'Blockchain Verified', cls: 'text-emerald-700 bg-emerald-50 border-emerald-200', Icon: ShieldCheck },
    PENDING:   { label: 'Blockchain Pending',  cls: 'text-amber-700  bg-amber-50  border-amber-200',  Icon: Loader       },
    FAILED:    { label: 'Blockchain Failed',   cls: 'text-red-700    bg-red-50    border-red-200',    Icon: ShieldX      },
  };
  const { label, cls, Icon } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 border ${cls}`}>
      <Icon size={11} /> {label}
    </span>
  );
}

function BlockchainInfoPanel({ cert, orgId, onRetrySuccess }: { cert: Certificate; orgId: string; onRetrySuccess: (updated: Partial<Certificate>) => void }) {
  const { blockchainStatus, blockchainTxHash, blockchainNetwork, blockchainHash } = cert;
  if (!blockchainStatus) return null;

  const [retrying, setRetrying] = useState(false);

  const explorerBase = import.meta.env.VITE_BLOCKCHAIN_EXPLORER_URL || 'https://amoy.polygonscan.com';
  const txUrl = blockchainTxHash ? `${explorerBase}/tx/${blockchainTxHash}` : null;

  const statusConfig: Record<BlockchainStatus, { icon: React.ReactNode; heading: string; cls: string }> = {
    CONFIRMED: {
      icon:    <ShieldCheck size={16} className="text-emerald-600 shrink-0" />,
      heading: '✓ Anchored on Blockchain',
      cls:     'bg-emerald-50 border-emerald-200 text-emerald-800',
    },
    PENDING: {
      icon:    <ShieldAlert size={16} className="text-amber-600 shrink-0" />,
      heading: 'Blockchain Registration Pending',
      cls:     'bg-amber-50 border-amber-200 text-amber-800',
    },
    FAILED: {
      icon:    <ShieldX size={16} className="text-red-600 shrink-0" />,
      heading: 'Blockchain Registration Failed',
      cls:     'bg-red-50 border-red-200 text-red-800',
    },
  };

  const cfg = statusConfig[blockchainStatus];

  async function handleRetry() {
    setRetrying(true);
    try {
      const r = await api.post(`/organizations/${orgId}/certificates/${cert.id}/blockchain-retry`);
      const updated = r.data.data ?? {};
      onRetrySuccess(updated);
      toast.success('Blockchain registration queued — status will update shortly.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Retry failed. Please try again.');
    } finally {
      setRetrying(false);
    }
  }

  return (
    <div className="card mb-5">
      <p className="overline mb-3">Blockchain</p>

      <div className={`flex items-center gap-2 border px-4 py-2.5 mb-4 ${cfg.cls}`}>
        {cfg.icon}
        <p className="text-sm font-semibold">{cfg.heading}</p>
      </div>

      {blockchainStatus === 'FAILED' && (
        <div className="bg-red-50 border border-red-100 px-4 py-3 mb-4 text-sm text-red-700">
          <p className="font-medium mb-1">Why did this happen?</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>RPC endpoint was unreachable at issuance time</li>
            <li>Wallet was not authorised on the smart contract</li>
            <li>Insufficient MATIC for gas fees</li>
            <li>Chain ID mismatch (expected Polygon Amoy 80002)</li>
          </ul>
          <p className="text-xs mt-2 text-red-500">The certificate itself is valid — only the on-chain anchor failed.</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
        <div>
          <p className="text-xs font-mono text-gray-400 uppercase tracking-wide">Network</p>
          <p className="text-brand-dark mt-0.5">{blockchainNetwork ?? 'Polygon Amoy'}</p>
        </div>
        {blockchainHash && (
          <div>
            <p className="text-xs font-mono text-gray-400 uppercase tracking-wide">Certificate Hash</p>
            <p className="font-mono text-xs text-brand-dark mt-0.5 break-all">{blockchainHash.slice(0, 20)}…</p>
          </div>
        )}
        {blockchainTxHash && (
          <div className="sm:col-span-2">
            <p className="text-xs font-mono text-gray-400 uppercase tracking-wide">Transaction Hash</p>
            <p className="font-mono text-xs text-brand-dark mt-0.5 break-all">{blockchainTxHash}</p>
          </div>
        )}
      </div>

      {txUrl && (
        <a
          href={txUrl}
          target="_blank"
          rel="noreferrer"
          className="btn-secondary flex items-center gap-2 w-full justify-center mt-4"
        >
          <ExternalLink size={13} /> View on Blockchain Explorer
        </a>
      )}

      {blockchainStatus === 'FAILED' && (
        <button
          onClick={handleRetry}
          disabled={retrying}
          className="btn-secondary flex items-center gap-2 w-full justify-center mt-3 border-red-200 text-red-700 hover:bg-red-50"
        >
          <ShieldAlert size={13} /> {retrying ? 'Retrying…' : 'Retry Blockchain Registration'}
        </button>
      )}
    </div>
  );
}

const decisionCls: Record<string, string> = {
  PENDING:  'bg-amber-50 text-amber-700 border border-amber-200',
  APPROVED: 'bg-green-50 text-green-700 border border-green-200',
  REJECTED: 'bg-red-50   text-red-700   border border-red-200',
};

export default function CertificateDetail() {
  const { id } = useParams<{ id: string }>();
  const { organization } = useAuth();
  const orgId  = organization?.id ?? '';
  const myRole = organization?.role;
  const isAdmin = myRole === 'OWNER' || myRole === 'ADMIN';

  const [cert, setCert] = useState<Certificate & { revocation?: { reason: string; revokedAt: string } } | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrSrc, setQrSrc] = useState('');
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');
  const [revoking, setRevoking] = useState(false);

  // Reviews state
  const [reviews,    setReviews]    = useState<CertificateReview[]>([]);
  const [reviewSummary, setReviewSummary] = useState<{ total: number; pending: number; approved: number; rejected: number } | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [staffList,  setStaffList]  = useState<OrgMember[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [assigning,  setAssigning]  = useState(false);

  useEffect(() => {
    if (!orgId || !id) return;
    api.get(`/organizations/${orgId}/certificates/${id}`)
      .then(r => setCert(r.data.data))
      .finally(() => setLoading(false));

    // Load reviews
    api.get(`/organizations/${orgId}/certificates/${id}/reviews`)
      .then(r => {
        setReviews(r.data.data.reviews ?? []);
        setReviewSummary(r.data.data.summary ?? null);
      })
      .catch(() => {}); // reviews section is optional
  }, [orgId, id]);

  // Load staff members when assign modal opens
  useEffect(() => {
    if (!assignOpen || !orgId) return;
    api.get(`/organizations/${orgId}/members`)
      .then(r => setStaffList((r.data.data.members ?? []).filter((m: OrgMember) => m.role === 'STAFF')))
      .catch(() => {});
  }, [assignOpen, orgId]);

  useEffect(() => {
    if (cert?.certificateId) {
      const publicUrl = `${window.location.origin}/verify/${cert.certificateId}`;
      QRCode.toDataURL(publicUrl, { width: 150, margin: 1 }).then(setQrSrc);
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

  async function handleAssignReviewers() {
    if (selectedIds.length === 0) { toast.error('Select at least one reviewer.'); return; }
    setAssigning(true);
    try {
      const r = await api.post(`/organizations/${orgId}/certificates/${id}/reviews`, { reviewerIds: selectedIds });
      toast.success(r.data.message ?? 'Reviewers assigned.');
      setAssignOpen(false);
      setSelectedIds([]);
      // Reload reviews
      const rv = await api.get(`/organizations/${orgId}/certificates/${id}/reviews`);
      setReviews(rv.data.data.reviews ?? []);
      setReviewSummary(rv.data.data.summary ?? null);
    } finally { setAssigning(false); }
  }

  function toggleReviewer(userId: string) {
    setSelectedIds(prev => prev.includes(userId) ? prev.filter(i => i !== userId) : [...prev, userId]);
  }

  function copyLink() {
    if (cert?.verificationUrl) {
      // Always use the current window origin so stored URLs with wrong port/host still work
      const publicUrl = `${window.location.origin}/verify/${cert.certificateId}`;
      navigator.clipboard.writeText(publicUrl);
      toast.success('Link copied!');
    }
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
        <div className="flex flex-col items-end gap-2">
          <Badge status={cert.status} />
          <BlockchainStatusBadge status={cert.blockchainStatus} />
        </div>
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

      <BlockchainInfoPanel cert={cert} orgId={orgId} onRetrySuccess={updates => setCert(c => c ? { ...c, ...updates } : c)} />

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
              <a
                href={cert.pdfUrl}
                download={`Certificate-${cert.certificateId}.pdf`}
                onClick={async (e) => {
                  e.preventDefault();
                  try {
                    const resp = await fetch(cert.pdfUrl!);
                    const blob = await resp.blob();
                    const url  = URL.createObjectURL(blob);
                    const a    = document.createElement('a');
                    a.href     = url;
                    a.download = `Certificate-${cert.certificateId}.pdf`;
                    a.click();
                    URL.revokeObjectURL(url);
                  } catch {
                    window.open(cert.pdfUrl!, '_blank');
                  }
                }}
                className="btn-secondary flex items-center gap-2 w-full justify-center"
              >
                <Download size={14} /> Download PDF
              </a>
            )}
            <button onClick={copyLink} className="btn-secondary flex items-center gap-2 w-full justify-center">
              <Copy size={14} /> Copy Verification Link
            </button>
            <a href={`${window.location.origin}/verify/${cert.certificateId}`} target="_blank" rel="noreferrer" className="btn-secondary flex items-center gap-2 w-full justify-center">
              <ExternalLink size={14} /> Open Public Page
            </a>
            {/* Revoke: admin/owner only */}
            {isAdmin && cert.status === 'ACTIVE' && (
              <button onClick={() => setRevokeOpen(true)} className="btn-danger flex items-center gap-2 w-full justify-center">
                <AlertTriangle size={14} /> Revoke Certificate
              </button>
            )}
            {/* Assign reviewers: admin/owner only */}
            {isAdmin && (
              <button onClick={() => setAssignOpen(true)} className="btn-secondary flex items-center gap-2 w-full justify-center">
                <UserPlus size={14} /> Assign Reviewers
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reviews panel */}
      {(reviews.length > 0 || isAdmin) && (
        <div className="card mb-5">
          <p className="overline mb-3">Multi-Party Review</p>

          {reviewSummary && reviewSummary.total > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Pending',  value: reviewSummary.pending,  cls: 'text-amber-600' },
                { label: 'Approved', value: reviewSummary.approved, cls: 'text-green-600' },
                { label: 'Rejected', value: reviewSummary.rejected, cls: 'text-red-600'   },
              ].map(({ label, value, cls }) => (
                <div key={label} className="bg-brand-cream border border-brand-border px-3 py-2 text-center">
                  <p className={`text-lg font-bold ${cls}`}>{value}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              ))}
            </div>
          )}

          {reviews.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">No reviewers assigned yet.</p>
          ) : (
            <div className="space-y-2">
              {reviews.map(rv => (
                <div key={rv.id} className="flex items-center justify-between text-sm py-2 border-b border-brand-border/50 last:border-0">
                  <div>
                    <p className="font-medium text-brand-dark">{rv.reviewer?.name ?? rv.reviewerId}</p>
                    <p className="text-xs text-gray-400">{rv.reviewer?.email}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs font-medium px-2 py-0.5 ${decisionCls[rv.decision]}`}>
                      {rv.decision}
                    </span>
                    {rv.comment && (
                      <p className="text-xs text-gray-500 max-w-[200px] text-right">{rv.comment}</p>
                    )}
                    {rv.decidedAt && (
                      <p className="text-xs text-gray-400">{fmt(rv.decidedAt)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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

      <Modal open={assignOpen} onClose={() => { setAssignOpen(false); setSelectedIds([]); }} title="Assign Reviewers">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Select staff members to review this certificate. Each reviewer will see it in their review tasks.
          </p>
          {staffList.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">
              No staff members in your organization yet.{' '}
              <a href="/dashboard/members" className="text-brand-mid underline">Add staff first.</a>
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {staffList.map(m => {
                const alreadyAssigned = reviews.some(r => r.reviewerId === m.userId);
                return (
                  <label
                    key={m.id}
                    className={`flex items-center gap-3 p-3 border cursor-pointer transition-colors ${
                      selectedIds.includes(m.userId)
                        ? 'border-brand-mid bg-brand-cream'
                        : alreadyAssigned
                        ? 'border-brand-border bg-gray-50 opacity-60'
                        : 'border-brand-border hover:bg-brand-cream/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(m.userId)}
                      onChange={() => !alreadyAssigned && toggleReviewer(m.userId)}
                      disabled={alreadyAssigned}
                      className="accent-brand-dark"
                    />
                    <div>
                      <p className="text-sm font-medium text-brand-dark">{m.user.name}</p>
                      <p className="text-xs text-gray-400">{m.user.email}</p>
                    </div>
                    {alreadyAssigned && (
                      <span className="ml-auto text-xs text-gray-400">Already assigned</span>
                    )}
                  </label>
                );
              })}
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={handleAssignReviewers} disabled={assigning || selectedIds.length === 0} className="btn-primary flex-1 py-2.5">
              {assigning ? 'Assigning…' : `Assign ${selectedIds.length > 0 ? `(${selectedIds.length})` : ''}`}
            </button>
            <button onClick={() => { setAssignOpen(false); setSelectedIds([]); }} className="btn-secondary px-5 py-2.5">
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
