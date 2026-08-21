import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import { Award, TrendingUp, XCircle, Calendar, Eye } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface Analytics {
  total: number; active: number; revoked: number;
  thisMonth: number; verifications: number;
  trend: any[];
}

const COLORS = ['#167862', '#a33c38', '#aeb9b1'];

export default function Analytics() {
  const { organization } = useAuth();
  const orgId = organization?.id ?? '';
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    api.get(`/organizations/${orgId}/analytics`).then(r => setData(r.data.data)).finally(() => setLoading(false));
  }, [orgId]);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!data) return <p className="text-gray-500">Failed to load analytics.</p>;

  const stats = [
    { label: 'Total Certificates', value: data.total,         icon: Award,      color: 'bg-blue-50 text-blue-700' },
    { label: 'Active',             value: data.active,        icon: TrendingUp, color: 'bg-green-50 text-green-700' },
    { label: 'Revoked',            value: data.revoked,       icon: XCircle,    color: 'bg-red-50 text-red-700' },
    { label: 'Issued This Month',  value: data.thisMonth,     icon: Calendar,   color: 'bg-amber-50 text-amber-700' },
    { label: 'Verifications (30d)',value: data.verifications, icon: Eye,        color: 'bg-purple-50 text-purple-700' },
  ];

  const pieData = [
    { name: 'Active',  value: data.active },
    { name: 'Revoked', value: data.revoked },
    { name: 'Expired', value: Math.max(0, data.total - data.active - data.revoked) },
  ].filter(d => d.value > 0);

  const trendData: { month: string; count: number }[] = data.trend ?? [];

  return (
    <div>
      <h1 className="font-serif text-3xl text-brand-dark mb-8">Analytics</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-10">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${color}`}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-xl font-bold text-brand-dark">{value}</p>
              <p className="text-xs text-gray-500 leading-tight">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-serif text-lg text-brand-dark mb-6">Certificates Issued Over Time</h2>
          {trendData.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-10">Not enough data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trendData}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#167862" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h2 className="font-serif text-lg text-brand-dark mb-6">Certificate Status Distribution</h2>
          {pieData.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-10">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
