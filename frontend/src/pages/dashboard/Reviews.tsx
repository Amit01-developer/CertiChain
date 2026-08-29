import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import { ClipboardCheck, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import type { CertificateReview } from '../../types';

const fmt = (d: string) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(d));

const decisionCls: Record<string, string> = {
  PENDING:  'bg-amber-50 text-amber-700 border border-amber-200',
  APPROVED: 'bg-green-50 text-green-700 border border-green-200',
  REJECTED: 'bg-red-50   text-red-700   border border-red-200',
};

type PendingReview = CertificateReview & {
  certificate: {
    id: string;
    certificateId: string;
    title: string;
    status: string;
    recipient: { name: string; email: string };
    organization: { id: string; name: string };
  };
};

export default function Reviews() {
  const { organization } = useAuth();
  const orgId = organization?.id ?? '';

  const [reviews,  setReviews]  = useState<PendingReview[]>([]);
  const [loading,  setLoading]  = useState(true);

  // Decision modal
  const [target,   setTarget]   = useState<PendingReview | null>(null);
  const [decision, setDecision] = useState<'APPROVED' | 'REJECTED' | ''>('');
  const [comment,  setComment]  = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const r = await api.get(`/organizations/${orgId}/reviews/pending`);
      setReviews(r.data.data ?? []);
    } finally { setLoading(false); }
  }, [orgId]);

  useEffect(() => { load(); }, [load]);

  async function submitDecision() {
    if (!target || !decision) return;
    setSubmitting(true);
    try {
      await api.post(
        `/organizations/${orgId}/certificates/${target.certificate.id}/reviews/decide`,
        { decision, comment: comment.trim() || undefined }
      );
      toast.success(`Decision recorded: ${decision}.`);
      setTarget(null);
      setDecision('');
      setComment('');
      load();
    } finally { setSubmitting(false); }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-brand-dark">My Review Tasks</h1>
        <p className="text-gray-500 text-sm mt-1">Certificates awaiting your approval or rejection</p>
      </div>

      {reviews.length === 0 ? (
        <EmptyState
          icon={<ClipboardCheck size={48} />}
          title="No pending reviews"
          message="You have no certificates awaiting your review. Check back later."
        />
      ) : (
        <div className="space-y-3">
          {reviews.map(r => (
            <div key={r.id} className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-medium px-2 py-0.5 ${decisionCls[r.decision]}`}>
                    {r.decision}
                  </span>
                  <Link
                    to={`/dashboard/certificates/${r.certificate.id}`}
                    className="font-mono text-xs text-brand-mid hover:underline"
                  >
                    {r.certificate.certificateId}
                  </Link>
                </div>
                <p className="font-medium text-brand-dark truncate">{r.certificate.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Recipient: {r.certificate.recipient.name} &middot; {r.certificate.recipient.email}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Assigned: {fmt(r.createdAt)}</p>
              </div>

              {r.decision === 'PENDING' && (
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => { setTarget(r); setDecision('APPROVED'); }}
                    className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors"
                  >
                    <CheckCircle2 size={14} /> Approve
                  </button>
                  <button
                    onClick={() => { setTarget(r); setDecision('REJECTED'); }}
                    className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
                  >
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Decision confirmation modal */}
      <Modal
        open={!!target && !!decision}
        onClose={() => { setTarget(null); setDecision(''); setComment(''); }}
        title={`${decision === 'APPROVED' ? 'Approve' : 'Reject'} Certificate`}
      >
        <div className="space-y-4">
          <div className={`px-4 py-2.5 border text-sm font-medium ${decisionCls[decision]}`}>
            {decision === 'APPROVED'
              ? '✓ You are approving this certificate.'
              : '✗ You are rejecting this certificate.'}
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">Certificate</p>
            <p className="font-medium text-brand-dark text-sm">{target?.certificate.title}</p>
            <p className="text-xs text-gray-500">Recipient: {target?.certificate.recipient.name}</p>
          </div>

          <div>
            <label className="label">
              Comment <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              className="input h-20 resize-none"
              placeholder={decision === 'REJECTED' ? 'Reason for rejection…' : 'Notes for the admin…'}
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={submitDecision}
              disabled={submitting}
              className={`flex-1 py-2.5 font-semibold text-sm transition-colors ${
                decision === 'APPROVED'
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-red-600 text-white hover:bg-red-700'
              } disabled:opacity-50`}
            >
              {submitting ? 'Submitting…' : `Confirm ${decision === 'APPROVED' ? 'Approval' : 'Rejection'}`}
            </button>
            <button
              onClick={() => { setTarget(null); setDecision(''); setComment(''); }}
              className="btn-secondary px-6 py-2.5"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
