import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import {
  Award, TrendingUp, XCircle, Calendar, Plus, Users, FileText,
  BarChart2, ScrollText, Eye, Crown, ShieldCheck, Shield, UserPlus,
  ArrowRight, AlertTriangle, CheckCircle2, Clock, Building2,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { Certificate, OrgMemberRole } from '../../types';

interface Analytics {
  total: number; active: number; revoked: number;
  thisMonth: number; verifications: number;
  trend: { month: string; count: number }[];
}

interface RecentMember {
  id: string; role: OrgMemberRole;
  user: { name: string; email: string };
  createdAt: string;
}

const fmt = (d: string) =>
  new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(d));

const roleMeta: Record<OrgMemberRole, { label: string; cls: string; Icon: React.ElementType }> = {
  OWNER: { label: 'Owner', cls: 'bg-purple-100 text-purple-800', Icon: Crown       },
  ADMIN: { label: 'Admin', cls: 'bg-blue-100   text-blue-800',   Icon: ShieldCheck },
  STAFF: { label: 'Staff', cls: 'bg-green-100  text-green-800',  Icon: Shield      },
};

function RoleBadge({ role }: { role: OrgMemberRole }) {
  const { label, cls, Icon } = roleMeta[role];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 ${cls}`}>
      <Icon size={10} /> {label}
    </span>
  );
}

export default function Dashboard() {
  const { organization, user } = useAuth();
  const orgId  = organization?.id ?? '';
  const myRole = (organization?.role ?? 'ADMIN') as OrgMemberRole;

  const [stats,   setStats]   = useState<Analytics | null>(null);
  const [certs,   setCerts]   = useState<Certificate[]>([]);
  const [members, setMembers] = useState<RecentMember[]>([]);
  const [loading, setLoading] = useState(true);
  const isStaffView = myRole === 'STAFF';

  useEffect(() => {
    if (!orgId) return;
    Promise.all([
      api.get(`/organizations/${orgId}/analytics`),
      api.get(`/organizations/${orgId}/certificates?limit=5&page=1`),
      api.get(`/organizations/${orgId}/members`),
    ])
      .then(([a, c, m]) => {
        setStats(a.data.data);
        setCerts(c.data.data.certificates ?? []);
        setMembers((m.data.data.members ?? []).slice(0, 5));
      })
      .finally(() => setLoading(false));
  }, [orgId]);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  const statCards = [
    { label: 'Total Certificates', value: stats?.total ?? 0,         icon: Award,      color: 'bg-blue-50   text-blue-700',   to: '/dashboard/certificates' },
    { label: 'Active',             value: stats?.active ?? 0,        icon: TrendingUp, color: 'bg-green-50  text-green-700',  to: '/dashboard/certificates?status=ACTIVE' },
    { label: 'Revoked',            value: stats?.revoked ?? 0,       icon: XCircle,    color: 'bg-red-50    text-red-700',    to: '/dashboard/certificates?status=REVOKED' },
    { label: 'Issued This Month',  value: stats?.thisMonth ?? 0,     icon: Calendar,   color: 'bg-amber-50  text-amber-700', to: '/dashboard/certificates' },
    { label: 'Verifications (30d)',value: stats?.verifications ?? 0, icon: Eye,        color: 'bg-purple-50 text-purple-700',to: '/dashboard/analytics' },
  ];

  const quickActions = [
    { label: 'Issue Certificate', to: '/dashboard/certificates/new', icon: Plus,     desc: 'Issue a new certificate to a recipient',   primary: true  },
    { label: 'Add Staff Member',  to: '/dashboard/members',          icon: UserPlus, desc: 'Invite a team member via email',           primary: false },
    { label: 'Create Template',   to: '/dashboard/templates/new',    icon: FileText, desc: 'Design a reusable certificate template',  primary: false },
    { label: 'View Analytics',    to: '/dashboard/analytics',        icon: BarChart2,desc: 'Charts, trends, and issuance stats',       primary: false },
    { label: 'Audit Logs',        to: '/dashboard/audit-logs',       icon: ScrollText,desc: 'Full activity log for your organization', primary: false },
  ];

  const trendData = stats?.trend ?? [];

  const healthPct = stats && stats.total > 0
    ? Math.round((stats.active / stats.total) * 100)
    : 100;

  return (
    <div className="space-y-8">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl text-brand-dark">{isStaffView ? 'Staff Dashboard' : 'Admin Dashboard'}</h1>
          <div className="flex items-center gap-2 mt-1.5">
            <p className="text-gray-500 text-sm">{organization?.name}</p>
            <RoleBadge role={myRole} />
          </div>
        </div>
        <Link to="/dashboard/certificates/new" className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Issue Certificate
        </Link>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, to }) => (
          <Link
            key={label}
            to={to}
            className="card flex items-center gap-3 hover:shadow-md transition-shadow group"
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${color}`}>
              <Icon size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold text-brand-dark">{value}</p>
              <p className="text-xs text-gray-500 leading-tight">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Quick actions ───────────────────────────────────────── */}
      <div>
        <h2 className="font-serif text-xl text-brand-dark mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {quickActions.map(({ label, to, icon: Icon, desc, primary }) => (
            <Link
              key={label}
              to={to}
              className={`p-4 border flex flex-col gap-2 hover:shadow-md transition-all group ${
                primary
                  ? 'bg-brand-dark text-white border-brand-dark'
                  : 'bg-white border-brand-border hover:border-brand-mid'
              }`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                primary ? 'bg-white/15' : 'bg-brand-cream'
              }`}>
                <Icon size={16} className={primary ? 'text-brand-light' : 'text-brand-mid'} />
              </div>
              <p className={`text-sm font-semibold ${primary ? 'text-white' : 'text-brand-dark'}`}>{label}</p>
              <p className={`text-xs leading-relaxed ${primary ? 'text-white/60' : 'text-gray-500'}`}>{desc}</p>
              <ArrowRight size={14} className={`mt-auto self-end transition-transform group-hover:translate-x-0.5 ${primary ? 'text-brand-light' : 'text-brand-mid'}`} />
            </Link>
          ))}
        </div>
      </div>

      {/* ── Middle row: trend chart + health + team ─────────────── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Issuance trend */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-lg text-brand-dark">Issuance Trend</h2>
            <Link to="/dashboard/analytics" className="text-xs text-brand-mid hover:underline flex items-center gap-1">
              Full Analytics <ArrowRight size={11} />
            </Link>
          </div>
          {trendData.length === 0 ? (
            <div className="py-14 text-center text-gray-400 text-sm">
              No data yet — issue your first certificates to see trends.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={trendData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#167862" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Org health + team size */}
        <div className="space-y-4">

          {/* Org health */}
          <div className="card">
            <h3 className="font-serif text-base text-brand-dark mb-4 flex items-center gap-2">
              {healthPct >= 90 ? <CheckCircle2 size={15} className="text-green-500" /> : <AlertTriangle size={15} className="text-amber-500" />}
              Certificate Health
            </h3>
            <div className="flex items-end gap-2 mb-2">
              <p className="text-3xl font-bold text-brand-dark">{healthPct}%</p>
              <p className="text-xs text-gray-500 pb-1">active</p>
            </div>
            <div className="w-full h-2 bg-brand-border rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${healthPct >= 90 ? 'bg-green-500' : healthPct >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${healthPct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>{stats?.active ?? 0} active</span>
              <span>{stats?.revoked ?? 0} revoked</span>
            </div>
          </div>

          {/* Team overview */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif text-base text-brand-dark flex items-center gap-2">
                <Users size={14} className="text-brand-mid" /> Team
              </h3>
              <Link to="/dashboard/members" className="text-xs text-brand-mid hover:underline">
                Manage →
              </Link>
            </div>
            {members.length === 0 ? (
              <p className="text-xs text-gray-400">No members yet.</p>
            ) : (
              <div className="space-y-2">
                {members.map(m => (
                  <div key={m.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-brand-dark truncate">{m.user.name}</p>
                      <p className="text-xs text-gray-400 truncate">{m.user.email}</p>
                    </div>
                    <RoleBadge role={m.role} />
                  </div>
                ))}
              </div>
            )}
            <Link to="/dashboard/members" className="mt-4 flex items-center gap-1.5 text-xs text-brand-mid hover:underline">
              <UserPlus size={11} /> Invite staff member
            </Link>
          </div>
        </div>
      </div>

      {/* ── Recent Certificates ──────────────────────────────────── */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-xl text-brand-dark">Recent Certificates</h2>
          <Link to="/dashboard/certificates" className="text-sm text-brand-mid hover:underline flex items-center gap-1">
            View all <ArrowRight size={13} />
          </Link>
        </div>

        {certs.length === 0 ? (
          <div className="py-14 text-center">
            <Award size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 mb-5">No certificates issued yet.</p>
            <Link to="/dashboard/certificates/new" className="btn-primary">Issue First Certificate</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border text-left">
                  {['Certificate ID', 'Recipient', 'Title', 'Blockchain', 'Status', 'Date'].map(h => (
                    <th key={h} className="pb-3 text-xs font-semibold text-gray-500">{h}</th>
                  ))}
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
                    <td className="py-3 text-gray-700 text-sm">{c.recipient?.name}</td>
                    <td className="py-3 text-gray-600 text-xs max-w-[180px] truncate">{c.title}</td>
                    <td className="py-3">
                      {c.blockchainStatus === 'CONFIRMED' ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                          <CheckCircle2 size={11} /> On-chain
                        </span>
                      ) : c.blockchainStatus === 'PENDING' ? (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-500">
                          <Clock size={11} /> Pending
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3"><Badge status={c.status} /></td>
                    <td className="py-3 text-gray-400 text-xs whitespace-nowrap">{fmt(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Admin links footer ──────────────────────────────────── */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: 'Organization Profile', to: '/dashboard/organization', icon: Building2 as React.ElementType, desc: 'Update name, logo, contact info' },
          { label: 'Audit Logs',           to: '/dashboard/audit-logs',   icon: ScrollText as React.ElementType, desc: 'Full activity trail' },
          { label: 'Settings',             to: '/dashboard/settings',     icon: BarChart2 as React.ElementType,  desc: 'Manage your account settings' },
        ].map(({ label, to, icon: Icon, desc }) => (
          <Link key={label} to={to} className="card hover:shadow-md transition-shadow flex items-center gap-4 group">
            <div className="w-10 h-10 rounded-full bg-brand-cream flex items-center justify-center shrink-0">
              <Icon size={16} className="text-brand-mid" />
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-dark">{label}</p>
              <p className="text-xs text-gray-500">{desc}</p>
            </div>
            <ArrowRight size={14} className="ml-auto text-gray-400 group-hover:text-brand-mid transition-colors" />
          </Link>
        ))}
      </div>

    </div>
  );
}
