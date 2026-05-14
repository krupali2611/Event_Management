import { LogOut, Menu, PanelLeftClose, PanelLeftOpen, Search, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import NotificationBell from '@/components/notifications/NotificationBell';
import ProfileDropdown from '@/components/layout/ProfileDropdown';
import { useAuth } from '@/hooks/useAuth';
import { useAuthModal } from '@/hooks/useAuthModal';

interface NavbarProps {
  title: string;
  subtitle?: string;
  theme: 'dark' | 'light' | 'visual';
  showVisualSearch?: boolean;
  sidebarOpen?: boolean;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

function Navbar({ title, subtitle, theme, showVisualSearch = true, sidebarOpen = false, sidebarCollapsed = false, onToggleSidebar }: NavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, logout } = useAuth();
  const { openModal } = useAuthModal();
  const isDark = theme === 'dark';
  const isVisual = theme === 'visual';
  const isAttendeeVisual = isVisual && currentUser?.role === 'ATTENDEE';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const firstName = currentUser?.name?.split(' ')[0] ?? 'there';

  const handleLogout = (): void => {
    logout();
    navigate('/events', { replace: true });
  };

  const currentPath = `${location.pathname}${location.search}${location.hash}`;

  return (
    <header
      className={`sticky top-0 z-20 border-b backdrop-blur ${
        isDark
          ? 'border-slate-800 bg-slate-950/80'
          : isVisual
            ? 'border-white/50 bg-white/55'
            : 'border-slate-200/80 bg-white/80'
      }`}
    >
      <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex min-w-0 items-start gap-3">
          {onToggleSidebar ? (
            <>
              <button
                type="button"
                onClick={onToggleSidebar}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200/80 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 lg:hidden"
                aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
              >
                {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>

              <button
                type="button"
                onClick={onToggleSidebar}
                className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200/80 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 lg:inline-flex"
                aria-label={sidebarCollapsed ? 'Open sidebar' : 'Close sidebar'}
              >
                {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </button>
            </>
          ) : null}

          <div className="min-w-0">
            {isAttendeeVisual ? (
              <>
                <h1 className="truncate text-[1.45rem] font-bold leading-tight text-slate-950 sm:text-[1.75rem]">
                  {greeting}, {firstName}!
                </h1>
              </>
            ) : (
              <>
                {subtitle ? (
                  <p className={`text-xs font-semibold uppercase tracking-[0.3em] ${isDark ? 'text-blue-300' : isVisual ? 'text-orange-600' : 'text-brand-700'}`}>
                    {subtitle}
                  </p>
                ) : null}
                <h1 className={`truncate text-xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-950'}`}>{title}</h1>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          {isVisual && showVisualSearch ? (
            <div className="flex h-14 min-w-0 items-center gap-3 rounded-[1.35rem] border border-white/70 bg-white/80 px-4 shadow-[0_20px_55px_-38px_rgba(15,23,42,0.35)] sm:w-[20rem] lg:w-[21rem]">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value=""
                readOnly
                aria-label="Search events"
                placeholder="Search events..."
                className="w-full border-none bg-transparent text-sm text-slate-600 outline-none placeholder:text-slate-400"
              />
              <span className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-400">Ctrl + K</span>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            {isAuthenticated ? (
              <>
                {isAttendeeVisual ? (
                  <Link
                    to="/my-tickets"
                    className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-white/80 bg-white/85 px-4 text-sm font-semibold text-orange-700 shadow-[0_20px_40px_-32px_rgba(15,23,42,0.45)] transition hover:bg-orange-50 hover:text-orange-800 sm:w-auto"
                  >
                    My Tickets
                  </Link>
                ) : null}
                <NotificationBell theme={theme} />
                {isAttendeeVisual ? <ProfileDropdown theme={theme} /> : null}
                {isAttendeeVisual ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/80 bg-white/85 text-orange-600 shadow-[0_20px_40px_-32px_rgba(15,23,42,0.45)] transition hover:bg-orange-50 hover:text-orange-700"
                    aria-label="Logout"
                    title="Logout"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                ) : null}
              </>
            ) : (
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => openModal('login', { redirectTo: currentPath })}
                  className={`w-full rounded-full px-4 py-2 text-sm font-semibold transition sm:w-auto ${
                    isVisual
                      ? 'border border-orange-200 bg-white text-orange-700 hover:bg-orange-50'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => openModal('register', { redirectTo: currentPath })}
                  className={`w-full rounded-full px-4 py-2 text-sm font-semibold text-white transition sm:w-auto ${
                    isVisual ? 'bg-orange-500 hover:bg-orange-600' : 'bg-slate-950 hover:bg-slate-800'
                  }`}
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
