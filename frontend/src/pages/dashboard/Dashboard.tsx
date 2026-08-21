import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import { Award, TrendingUp, XCircle, Calendar, Plus } from 'lucide-react';
import type { Certificate } from '../../types';

interface Analytics { total: number; active: number; revoked: number; thisMonth: number; }

const fmt = (d: string) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(d));

export default function Dashboard() {
  const { organization } = useAuth();
  const orgId = organization?.id;
  const [stats, setStats] = useState<Analytics | null>(null);
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    Promise.all([
      api.get(`/organizations/${orgId}/analytics`),
      api.get(`/organizations/${orgId}/certificates?limit=5&page=1`),
    ]).then(([a, c]) => {
      setStats(a.data.data);
      setCerts(c.data.data.certificates ?? []);
    }).finally(() => setLoading(false));
  }, [orgId]);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  const statCards = [
    { label: 'Total Certificates', value: stats?.total ?? 0,      icon: Award,      color: 'bg-blue-50 text-blue-700' },
    { label: 'Active',             value: stats?.active ?? 0,     icon: TrendingUp, color: 'bg-green-50 text-green-700' },
    { label: 'Revoked',            value: stats?.revoked ?? 0,    icon: XCircle,    color: 'bg-red-50 text-red-700' },
    { label: 'Issued This Month',  value: stats?.thisMonth ?? 0,  icon: Calendar,   color: 'bg-amber-50 text-amber-700' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-brand-dark">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">{organization?.name}</p>
        </div>
        <Link to="/dashboard/certificates/new" className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Issue Certificate
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-dark">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-xl text-brand-dark">Recent Certificates</h2>
          <Link to="/dashboard/certificates" className="text-sm text-brand-mid hover:underline">View all →</Link>
        </div>

        {certs.length === 0 ? (
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
                  <th className="pb-3 font-semibold text-xs text-gray-500">Certificate ID</th>
                  <th className="pb-3 font-semibold text-xs text-gray-500">Recipient</th>
                  <th className="pb-3 font-semibold text-xs text-gray-500">Title</th>
                  <th className="pb-3 font-semibold text-xs text-gray-500">Status</th>
                  <th className="pb-3 font-semibold text-xs text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {certs.map(c => (
                  <tr key={c.id} className="border-b border-brand-border/50 hover:bg-brand-cream/50">
                    <td className="py-3">
                      <Link to={`/dashboard/certificates/${c.id}`} className="font-mono text-xs text-brand-mid hover:underline">
                        {c.certificateId}
                      </Link>
                    </td>
                    <td className="py-3 text-gray-700">{c.recipient?.name}</td>
                    <td className="py-3 text-gray-600 max-w-[200px] truncate">{c.title}</td>
                    <td className="py-3"><Badge status={c.status} /></td>
                    <td className="py-3 text-gray-500 text-xs">{fmt(c.createdAt)}</td>
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
