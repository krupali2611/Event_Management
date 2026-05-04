import { Bell, LogOut, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';

interface NavbarProps {
  title: string;
  subtitle: string;
  theme: 'dark' | 'light' | 'visual';
}

function Navbar({ title, subtitle, theme }: NavbarProps) {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const isDark = theme === 'dark';

  return (
    <header className={`sticky top-0 z-20 border-b backdrop-blur ${isDark ? 'border-slate-800 bg-slate-950/80' : 'border-slate-200/80 bg-white/80'}`}>
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <p className={`text-xs font-semibold uppercase tracking-[0.3em] ${isDark ? 'text-blue-300' : 'text-brand-700'}`}>{subtitle}</p>
          <h1 className={`truncate text-xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-950'}`}>{title}</h1>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <div className="hidden w-56 xl:block">
                <div className="relative">
                  <Search className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                  <Input
                    placeholder="Quick search"
                    className={`pl-10 ${isDark ? 'border-slate-800 bg-slate-900 text-slate-100 focus:bg-slate-900' : ''}`}
                  />
                </div>
              </div>
              <button
                type="button"
                className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl transition ${isDark ? 'bg-slate-900 text-slate-300 hover:bg-slate-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
              </button>
              {currentUser ? <Badge role={currentUser.role} /> : null}
              <div className={`hidden rounded-2xl px-4 py-2 text-sm md:block ${isDark ? 'bg-slate-900 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                {currentUser?.name}
              </div>
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
