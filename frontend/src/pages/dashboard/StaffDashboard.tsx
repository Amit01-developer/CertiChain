import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import { Award, Plus, ClipboardCheck, Shield, CheckCircle2, Clock } from 'lucide-react';
import type { Certificate, CertificateReview, OrgMemberRole } from '../../types';

const fmt = (d: string) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(d));

const decisionStyle: Record<string, string> = {
  PENDING:  'bg-amber-50 text-amber-700 border border-amber-200',
  APPROVED: 'bg-green-50 text-green-700 border border-green-200',
  REJECTED: 'bg-red-50   text-red-700   border border-red-200',
};

interface StaffDashboardData {
  organization:  { id: string; name: string; type: string; logoUrl: string | null };
  role:          OrgMemberRole;
  issuedByMe:    number;
  recentCerts:   Certificate[];
  pendingReviews: (CertificateReview & {
    certificate: Certificate & { recipient: { name: string; email: string } };
  })[];
}

export default function StaffDashboard() {
  const { organization } = useAuth();
  const orgId = organization?.id;
  const [data,    setData]    = useState<StaffDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    api.get(`/organizations/${orgId}/staff-dashboard`)
      .then(r => setData(r.data.data))
      .finally(() => setLoading(false));
  }, [orgId]);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!data)   return <div className="text-center py-20 text-gray-500">Could not load dashboard.</div>;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-brand-dark">Staff Dashboard</h1>
          <div className="flex items-center gap-2 mt-1.5">
            <p className="text-gray-500 text-sm">{data.organization.name}</p>
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 bg-green-100 text-green-800">
              <Shield size={10} /> Staff
            </span>
          </div>
        </div>
        <Link to="/dashboard/certificates/new" className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Issue Certificate
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center">
            <Award size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-brand-dark">{data.issuedByMe}</p>
            <p className="text-xs text-gray-500">Issued by You</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-brand-dark">{data.pendingReviews.length}</p>
            <p className="text-xs text-gray-500">Pending Reviews</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-brand-dark">{data.recentCerts.length}</p>
            <p className="text-xs text-gray-500">Org Certificates</p>
          </div>
        </div>
      </div>

      {/* Pending review tasks */}
      {data.pendingReviews.length > 0 && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-xl text-brand-dark flex items-center gap-2">
              <ClipboardCheck size={18} className="text-amber-500" /> Pending Review Tasks
            </h2>
            <Link to="/dashboard/reviews" className="text-sm text-brand-mid hover:underline">View all →</Link>
          </div>

          <div className="space-y-3">
            {data.pendingReviews.slice(0, 5).map(r => (
              <div key={r.id} className="flex items-start justify-between p-4 border border-brand-border hover:bg-brand-cream/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-brand-dark text-sm truncate">{r.certificate.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Recipient: {r.certificate.recipient.name}</p>
                  <p className="text-xs font-mono text-brand-mid mt-0.5">{(r.certificate as any).certificateId}</p>
                </div>
                <div className="flex items-center gap-3 ml-4 shrink-0">
                  <span className={`text-xs font-medium px-2 py-0.5 ${decisionStyle.PENDING}`}>
                    Awaiting Your Decision
                  </span>
                  <Link
                    to={`/dashboard/certificates/${r.certificateId}`}
                    className="btn-secondary text-xs px-3 py-1.5"
                  >
                    Review
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent certificates */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-xl text-brand-dark">Recent Certificates</h2>
          <Link to="/dashboard/certificates" className="text-sm text-brand-mid hover:underline">View all →</Link>
        </div>

        {data.recentCerts.length === 0 ? (
          <div className="py-12 text-center">
            <Award size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No certificates issued yet.</p>
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
                {data.recentCerts.map(c => (
                  <tr key={c.id} className="border-b border-brand-border/50 hover:bg-brand-cream/50">
                    <td className="py-3">
                      <Link to={`/dashboard/certificates/${c.id}`} className="font-mono text-xs text-brand-mid hover:underline">
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
    </div>
  );
}
