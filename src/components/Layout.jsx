import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { initials, roleLabel } from '../lib/utils';
import {
  LayoutDashboard, Search, FileText, MessageSquare,
  User, LogOut, Menu, X,
} from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
  { to: '/dashboard',     label: 'Dashboard',      icon: LayoutDashboard },
  { to: '/find-partners', label: 'Find Partners',   icon: Search },
  { to: '/proposals',     label: 'Proposals',       icon: FileText },
  { to: '/messages',      label: 'Messages',        icon: MessageSquare },
  { to: '/profile',       label: 'My Profile',      icon: User },
];

export default function Layout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  return (
    <div className="min-h-screen flex bg-surface-50">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-surface-200">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-surface-100">
          <h1 className="font-display text-xl text-surface-800">Venueo</h1>
          <p className="text-xs text-surface-400 mt-0.5">Creator × Business Partnerships</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? 'bg-surface-100 text-surface-900'
                    : 'text-surface-500 hover:bg-surface-50 hover:text-surface-700'
                }`
              }
            >
              <Icon size={18} strokeWidth={1.8} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-surface-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold">
              {initials(profile?.full_name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-surface-800 truncate">{profile?.full_name || 'User'}</p>
              <p className="text-xs text-surface-400">{roleLabel(profile?.role)}</p>
            </div>
            <button onClick={handleSignOut} className="btn-ghost p-1.5" title="Sign out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile Header ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-surface-200 px-4 py-3 flex items-center justify-between">
        <h1 className="font-display text-lg text-surface-800">Venueo</h1>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="btn-ghost p-1.5">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* ── Mobile Slide-out Nav ── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/20" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 h-full bg-white shadow-xl flex flex-col">
            <div className="px-6 py-5 border-b border-surface-100">
              <h1 className="font-display text-xl text-surface-800">Venueo</h1>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-0.5">
              {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                      isActive
                        ? 'bg-surface-100 text-surface-900'
                        : 'text-surface-500 hover:bg-surface-50 hover:text-surface-700'
                    }`
                  }
                >
                  <Icon size={18} strokeWidth={1.8} />
                  {label}
                </NavLink>
              ))}
            </nav>
            <div className="p-4 border-t border-surface-100">
              <button onClick={handleSignOut} className="btn-secondary w-full">
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ── Main content ── */}
      <main className="flex-1 min-w-0 lg:ml-0 mt-14 lg:mt-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
