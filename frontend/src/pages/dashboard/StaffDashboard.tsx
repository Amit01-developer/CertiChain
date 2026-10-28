import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import {
  Award, Plus, ClipboardCheck, Shield, ShieldCheck,
  CheckCircle2, Clock, FileText, XCircle,
} from 'lucide-react';
import type { Certificate, CertificateReview, OrgMemberRole } from '../../types';

const fmt = (d: string) =>
  new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(d));

// ── Types matching new backend response ──────────────────────────────────────

interface ReviewWithCert extends CertificateReview {
  certificate: Certificate & {
    recipient:    { name: string; email: string };
    organization: { id: string; name: string };
    reviews?:     CertificateReview[];
  };
}

interface DraftCert extends Omit<Certificate, 'recipient'> {
  recipient: { id?: string; name: string; email: string };
  reviews:   (CertificateReview & { reviewer?: { id: string; name: string } })[];
}

interface StaffDashboardData {
  organization:             { id: string; name: string; type: string; logoUrl: string | null };
  role:                     OrgMemberRole;
  issuedByMe:               number;
  myPendingReviews:         ReviewWithCert[];
  myReviewHistory:          ReviewWithCert[];
  draftCertificates:        DraftCert[];        // only for OWNER / ADMIN
  recentActiveCertificates: Certificate[];
  stats: {
    pendingReviewCount:   number;
    completedReviewCount: number;
    draftCount:           number;
  };
}

// ── helpers ──────────────────────────────────────────────────────────────────

const decisionStyle: Record<string, string> = {
  PENDING:  'bg-amber-50 text-amber-700 border border-amber-200',
  APPROVED: 'bg-green-50 text-green-700 border border-green-200',
  REJECTED: 'bg-red-50   text-red-700   border border-red-200',
};

function ReviewProgress({ reviews }: { reviews: CertificateReview[] }) {
  const total    = reviews.length;
  const approved = reviews.filter(r => r.decision === 'APPROVED').length;
  const rejected = reviews.filter(r => r.decision === 'REJECTED').length;
  const pending  = total - approved - rejected;

  return (
    <span className="text-xs text-gray-500">
      {approved}/{total} approved
      {rejected > 0 && <span className="text-red-500 ml-1">· {rejected} rejected</span>}
      {pending  > 0 && <span className="text-amber-500 ml-1">· {pending} pending</span>}
    </span>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export default function StaffDashboard() {
  const { organization } = useAuth();
  const orgId = organization?.id;
  const [data,    setData]    = useState<StaffDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    api.get(`/organizations/${orgId}/staff-dashboard`)
      .then(r => setData(r.data.data))
      .catch(() => {/* handled by null check below */})
      .finally(() => setLoading(false));
  }, [orgId]);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!data)   return <div className="text-center py-20 text-gray-500">Could not load dashboard.</div>;

  const isOwnerOrAdmin = data.role === 'OWNER' || data.role === 'ADMIN';

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-brand-dark">
            {isOwnerOrAdmin ? 'Dashboard' : 'Staff Dashboard'}
          </h1>
          <div className="flex items-center gap-2 mt-1.5">
            <p className="text-gray-500 text-sm">{data.organization.name}</p>
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded ${
              isOwnerOrAdmin
                ? 'bg-brand-dark text-brand-lime'
                : 'bg-green-100 text-green-800'
            }`}>
              {isOwnerOrAdmin ? <ShieldCheck size={10} /> : <Shield size={10} />}
              {data.role}
            </span>
          </div>
        </div>
        <Link to="/dashboard/certificates/new" className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Issue Certificate
        </Link>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────────────── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <Award size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-brand-dark">{data.issuedByMe}</p>
            <p className="text-xs text-gray-500">Issued by You</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-brand-dark">{data.stats.pendingReviewCount}</p>
            <p className="text-xs text-gray-500">Pending Reviews</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-brand-dark">{data.stats.completedReviewCount}</p>
            <p className="text-xs text-gray-500">Reviews Done</p>
          </div>
        </div>

        {isOwnerOrAdmin && (
          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
              <FileText size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-dark">{data.stats.draftCount}</p>
              <p className="text-xs text-gray-500">Awaiting Approval</p>
            </div>
          </div>
        )}
      </div>

      {/* ── My Pending Review Tasks ─────────────────────────────────────────── */}
      {data.myPendingReviews.length > 0 ? (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-xl text-brand-dark flex items-center gap-2">
              <ClipboardCheck size={18} className="text-amber-500" />
              Pending Review Tasks
              <span className="ml-1 text-xs font-semibold px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                {data.myPendingReviews.length}
              </span>
            </h2>
            <Link to="/dashboard/reviews" className="text-sm text-brand-mid hover:underline">
              View all →
            </Link>
          </div>

          <div className="space-y-3">
            {data.myPendingReviews.slice(0, 5).map(r => (
              <div
                key={r.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border border-amber-200 bg-amber-50/40 hover:bg-amber-50 transition-colors rounded"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-brand-dark text-sm truncate">{r.certificate.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Recipient: <span className="font-medium">{r.certificate.recipient.name}</span>
                    {' '}· {r.certificate.recipient.email}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <code className="text-xs font-mono text-brand-mid">{r.certificate.certificateId}</code>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${decisionStyle.PENDING}`}>
                      Awaiting Your Decision
                    </span>
                    {/* show role slot */}
                    <span className="text-xs text-gray-400">
                      ({r.reviewerRole === 'STAFF' ? 'Staff review' : 'Owner/Admin review'})
                    </span>
                  </div>
                  {/* Progress of all reviewers */}
                  {r.certificate.reviews && r.certificate.reviews.length > 0 && (
                    <div className="mt-1">
                      <ReviewProgress reviews={r.certificate.reviews} />
                    </div>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link
                    to={`/dashboard/certificates/${r.certificateId}`}
                    className="btn-secondary text-xs px-4 py-2"
                  >
                    Review
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {data.myPendingReviews.length > 5 && (
            <div className="mt-4 text-center">
              <Link to="/dashboard/reviews" className="text-sm text-brand-mid hover:underline">
                View {data.myPendingReviews.length - 5} more →
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="card mb-6 py-8 text-center">
          <CheckCircle2 size={36} className="text-green-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-600">No pending review tasks</p>
          <p className="text-xs text-gray-400 mt-1">All caught up! You'll be notified when a new certificate is assigned.</p>
        </div>
      )}

      {/* ── Draft Certificates (Owner / Admin only) ─────────────────────────── */}
      {isOwnerOrAdmin && data.draftCertificates.length > 0 && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-xl text-brand-dark flex items-center gap-2">
              <FileText size={18} className="text-purple-500" />
              Awaiting Approval
              <span className="ml-1 text-xs font-semibold px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                {data.draftCertificates.length}
              </span>
            </h2>
            <Link to="/dashboard/certificates?status=DRAFT" className="text-sm text-brand-mid hover:underline">
              View all →
            </Link>
          </div>

          <div className="space-y-3">
            {data.draftCertificates.slice(0, 5).map(c => {
              const myReview = c.reviews.find(r => r.reviewerRole === 'OWNER' || r.reviewerRole === 'ADMIN');
              return (
                <div
                  key={c.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border border-purple-100 bg-purple-50/30 hover:bg-purple-50/60 transition-colors rounded"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-brand-dark text-sm truncate">{c.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Recipient: <span className="font-medium">{c.recipient.name}</span>
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <code className="text-xs font-mono text-brand-mid">{c.certificateId}</code>
                      <Badge status={c.status} />
                    </div>
                    {c.reviews.length > 0 && (
                      <div className="mt-1">
                        <ReviewProgress reviews={c.reviews} />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {myReview?.decision === 'PENDING' && (
                      <Link
                        to={`/dashboard/certificates/${c.id}`}
                        className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors rounded"
                      >
                        <CheckCircle2 size={13} /> Approve
                      </Link>
                    )}
                    <Link
                      to={`/dashboard/certificates/${c.id}`}
                      className="btn-secondary text-xs px-4 py-2"
                    >
                      View
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Recent Active Certificates ──────────────────────────────────────── */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-xl text-brand-dark">Recent Active Certificates</h2>
          <Link to="/dashboard/certificates" className="text-sm text-brand-mid hover:underline">
            View all →
          </Link>
        </div>

        {data.recentActiveCertificates.length === 0 ? (
          <div className="py-12 text-center">
            <Award size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No active certificates yet.</p>
            <Link to="/dashboard/certificates/new" className="btn-primary">Issue First Certificate</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border text-left">
                  <th className="pb-3 text-xs font-semibold text-gray-500">Certificate ID</th>
                  <th className="pb-3 text-xs font-semibold text-gray-500">Recipient</th>
                  <th className="pb-3 text-xs font-semibold text-gray-500">Title</th>
                  <th className="pb-3 text-xs font-semibold text-gray-500">Status</th>
                  <th className="pb-3 text-xs font-semibold text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recentActiveCertificates.map(c => (
                  <tr key={c.id} className="border-b border-brand-border/50 hover:bg-brand-cream/50">
                    <td className="py-3">
                      <Link
                        to={`/dashboard/certificates/${c.id}`}
                        className="font-mono text-xs text-brand-mid hover:underline"
                      >
                        {c.certificateId}
                      </Link>
                    </td>
                    <td className="py-3 text-gray-700">{c.recipient?.name}</td>
                    <td className="py-3 text-gray-600 max-w-[180px] truncate">{c.title}</td>
                    <td className="py-3"><Badge status={c.status} /></td>
                    <td className="py-3 text-gray-400 text-xs">{fmt(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Review History ──────────────────────────────────────────────────── */}
      {data.myReviewHistory.length > 0 && (
        <div className="card mt-6">
          <h2 className="font-serif text-xl text-brand-dark mb-5">My Review History</h2>
          <div className="space-y-2">
            {data.myReviewHistory.slice(0, 5).map(r => (
              <div
                key={r.id}
                className="flex items-center justify-between p-3 border border-brand-border/60 hover:bg-brand-cream/30 rounded text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-brand-dark truncate">{r.certificate?.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {r.decidedAt ? fmt(r.decidedAt) : 'Recently'}
                    {r.comment && <span className="ml-2 italic">"{r.comment}"</span>}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4 shrink-0">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${decisionStyle[r.decision]}`}>
                    {r.decision}
                  </span>
                  <Link
                    to={`/dashboard/certificates/${r.certificateId}`}
                    className="text-xs text-brand-mid hover:underline"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
