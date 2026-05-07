import { Bell, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProfileDropdown from '@/components/layout/ProfileDropdown';
import { useAuth } from '@/hooks/useAuth';

interface NavbarProps {
  title: string;
  subtitle?: string;
  theme: 'dark' | 'light' | 'visual';
}

function Navbar({ title, subtitle, theme }: NavbarProps) {
  const { isAuthenticated, logout } = useAuth();
  const isDark = theme === 'dark';

  return (
    <header className={`sticky top-0 z-20 border-b backdrop-blur ${isDark ? 'border-slate-800 bg-slate-950/80' : 'border-slate-200/80 bg-white/80'}`}>
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="min-w-0">
          {subtitle ? <p className={`text-xs font-semibold uppercase tracking-[0.3em] ${isDark ? 'text-blue-300' : 'text-brand-700'}`}>{subtitle}</p> : null}
          <h1 className={`truncate text-xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-950'}`}>{title}</h1>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <button
                type="button"
                className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl transition ${isDark ? 'bg-slate-900 text-slate-300 hover:bg-slate-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
              </button>
              <ProfileDropdown theme={theme} />
              <button
                type="button"
                onClick={logout}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl transition ${isDark ? 'bg-slate-900 text-slate-200 hover:bg-slate-800' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" to="/login">
                Login
              </Link>
              <Link className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800" to="/register">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
