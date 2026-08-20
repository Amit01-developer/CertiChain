import { Outlet, Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function PublicLayout() {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-brand-border bg-brand-cream sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg text-brand-dark">
            <CheckCircle size={22} className="text-brand-mid" />
            CertiChain
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <NavLink to="/#features" className="text-gray-600 hover:text-brand-dark">Features</NavLink>
            <NavLink to="/verify" className="text-gray-600 hover:text-brand-dark">Verify</NavLink>
            {user ? (
              <Link to="/dashboard" className="btn-primary">Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-brand-dark">Login</Link>
                <Link to="/register" className="btn-primary">Get Started</Link>
              </>
            )}
          </nav>

          {/* Mobile toggle */}
          <button className="md:hidden" onClick={() => setMobileOpen(o => !o)} aria-label="Menu">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-brand-border bg-white px-5 py-4 flex flex-col gap-3 text-sm font-medium">
            <Link to="/verify" onClick={() => setMobileOpen(false)} className="text-gray-700">Verify Certificate</Link>
            {user ? (
              <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="btn-primary text-center">Dashboard</Link>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="text-gray-700">Login</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="btn-primary text-center">Get Started</Link>
              </>
            )}
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-brand-border py-8">
        <div className="max-w-6xl mx-auto px-5 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2 font-bold text-brand-dark">
            <CheckCircle size={16} className="text-brand-mid" /> CertiChain
          </div>
          <nav className="flex gap-5">
            <Link to="/verify" className="hover:text-brand-dark">Verify</Link>
            <Link to="/login"  className="hover:text-brand-dark">Login</Link>
            <Link to="/register" className="hover:text-brand-dark">Register</Link>
          </nav>
          <span>© {new Date().getFullYear()} CertiChain</span>
        </div>
      </footer>
    </div>
  );
}
