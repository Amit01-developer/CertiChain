import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Award, FileText, Users, BarChart2,
  ScrollText, Building2, Settings, LogOut, CheckCircle, Menu, X,
} from 'lucide-react';
import { useState } from 'react';

const nav = [
  { to: '/dashboard',              icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dashboard/certificates', icon: Award,           label: 'Certificates' },
  { to: '/dashboard/templates',    icon: FileText,        label: 'Templates' },
  { to: '/dashboard/recipients',   icon: Users,           label: 'Recipients' },
  { to: '/dashboard/analytics',    icon: BarChart2,       label: 'Analytics' },
  { to: '/dashboard/audit-logs',   icon: ScrollText,      label: 'Audit Logs' },
  { to: '/dashboard/organization', icon: Building2,       label: 'Organization' },
  { to: '/dashboard/settings',     icon: Settings,        label: 'Settings' },
];

export default function DashboardLayout() {
  const { user, organization, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-brand-dark text-white w-60 shrink-0">
      <div className="h-16 flex items-center px-5 border-b border-white/10">
        <CheckCircle size={20} className="text-brand-light mr-2" />
        <span className="font-bold text-lg">CertiChain</span>
      </div>

      {organization && (
        <div className="px-5 py-4 border-b border-white/10">
          <p className="text-xs text-white/50 mb-0.5">Organization</p>
          <p className="text-sm font-semibold truncate">{organization.name}</p>
          <p className="text-xs text-white/40">{organization.type}</p>
        </div>
      )}

      <nav className="flex-1 py-3 px-3 overflow-y-auto">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium mb-0.5 transition-colors ${
                isActive ? 'bg-white/15 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon size={16} /> {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-white/10">
        <p className="text-xs text-white/40 truncate mb-1">{user?.email}</p>
        <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
          <LogOut size={14} /> Logout
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-brand-cream">
      <div className="hidden md:flex flex-col"><Sidebar /></div>

      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="flex flex-col"><Sidebar /></div>
          <div className="flex-1 bg-black/40" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-brand-border bg-white flex items-center px-5 gap-4">
          <button className="md:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar">
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <span className="text-sm text-gray-500">{user?.name}</span>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
