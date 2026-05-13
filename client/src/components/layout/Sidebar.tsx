import { LogOut, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types/api';

export interface SidebarItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

interface SidebarProps {
  items: SidebarItem[];
  role: UserRole;
  theme: 'dark' | 'light';
  isOpen: boolean;
  isDesktopCollapsed: boolean;
  onOpenChange: (open: boolean) => void;
  onDesktopCollapseChange: (collapsed: boolean) => void;
  onCollapseChange?: (collapsed: boolean) => void;
}

function Sidebar({
  items,
  role,
  theme,
  isOpen,
  isDesktopCollapsed,
  onOpenChange,
  onDesktopCollapseChange,
  onCollapseChange,
}: SidebarProps) {
  const [isDesktop, setIsDesktop] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const dark = theme === 'dark';
  const dashboardTitle = role === 'ORGANIZER' ? 'Organizer Dashboard' : role === 'SUPER_ADMIN' ? 'Super Admin Dashboard' : 'Admin Dashboard';
  const initials = currentUser?.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  const shellClass = useMemo(
    () =>
      dark
        ? 'border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,#071B4D_0%,#0A235F_100%)] text-[#EAF1FF] shadow-[0_34px_68px_-34px_rgba(2,6,23,0.8)]'
        : 'border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,#071B4D_0%,#0A235F_100%)] text-[#EAF1FF] shadow-[0_34px_68px_-34px_rgba(2,6,23,0.45)]',
    [dark],
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1023px)');
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      const matches = event.matches;

      if (matches) {
        onOpenChange(false);
        onDesktopCollapseChange(false);
        setIsDesktop(false);
      } else {
        onOpenChange(true);
        setIsDesktop(true);
      }
    };

    handleChange(mediaQuery);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [onDesktopCollapseChange, onOpenChange]);

  useEffect(() => {
    onCollapseChange?.(isDesktop ? isDesktopCollapsed : false);
  }, [isDesktop, isDesktopCollapsed, onCollapseChange]);

  const activeItemPath = useMemo(() => {
    let bestMatch: string | null = null;

    for (const item of items) {
      const matches = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);

      if (!matches) {
        continue;
      }

      if (!bestMatch || item.to.length > bestMatch.length) {
        bestMatch = item.to;
      }
    }

    return bestMatch;
  }, [items, location.pathname]);

  const handleLogout = (): void => {
    logout();
    navigate('/events', { replace: true });
  };

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r px-4 py-5 transition-all duration-300 ease-out lg:translate-x-0 ${isDesktop && isDesktopCollapsed ? 'w-24' : 'w-72'} ${shellClass} ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="rounded-none border-b border-white/10 bg-transparent p-1 pb-5">
          <div className={`flex items-center ${isDesktop && isDesktopCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2d5be3_0%,#2347ba_55%,#1a3180_100%)] text-white shadow-lg shadow-slate-950/30">
              <Sparkles className="h-5 w-5" />
            </div>
            {!(isDesktop && isDesktopCollapsed) ? (
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#D6E4FF]/70">EventHub</p>
                <h2 className="truncate text-lg font-semibold text-white">{dashboardTitle}</h2>
              </div>
            ) : null}
          </div>

          <div
            className={`mt-5 rounded-[1.5rem] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.04)] p-3 transition-all duration-300 ease-out ${isDesktop && isDesktopCollapsed ? 'px-2' : ''}`}
          >
            <div className={`flex items-center ${isDesktop && isDesktopCollapsed ? 'justify-center' : 'gap-3'}`}>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#fde68a_0%,#f59e0b_100%)] text-sm font-bold text-slate-900">
                {initials || 'EM'}
              </div>
              {!(isDesktop && isDesktopCollapsed) ? (
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{currentUser?.name ?? 'Workspace User'}</p>
                  <p className="mt-0.5 truncate text-xs text-[#D6E4FF]/72">{currentUser?.email ?? 'workspace@example.com'}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <nav className="mt-6 space-y-2">
          {items.map((item) => {
            const active = activeItemPath === item.to;
            const Icon = item.icon;

            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => onOpenChange(false)}
                className={`flex items-center rounded-[14px] px-3.5 py-3 text-sm font-medium transition-all duration-300 ease-out ${isDesktop && isDesktopCollapsed ? 'justify-center' : 'gap-3'} ${
                  active
                    ? 'bg-[linear-gradient(90deg,#2563FF_0%,#3B82F6_100%)] text-white shadow-[0_16px_30px_-16px_rgba(37,99,255,0.9),0_0_0_1px_rgba(147,197,253,0.28)]'
                    : 'bg-transparent text-[#EAF1FF] hover:bg-[rgba(255,255,255,0.08)] hover:text-white'
                }`}
                title={isDesktop && isDesktopCollapsed ? item.label : undefined}
              >
                <Icon className={`h-4 w-4 transition-colors duration-300 ${active ? 'text-white' : 'text-[#D6E4FF]'}`} />
                {!(isDesktop && isDesktopCollapsed) ? <span>{item.label}</span> : null}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-white/10 pt-5">
          <button
            type="button"
            onClick={handleLogout}
            className={`flex w-full items-center rounded-[14px] px-3.5 py-3 text-sm font-medium text-[#EAF1FF] transition-all duration-300 ease-out hover:bg-[rgba(255,255,255,0.08)] hover:text-white ${isDesktop && isDesktopCollapsed ? 'justify-center' : 'gap-3'}`}
          >
            <LogOut className="h-4 w-4 text-[#D6E4FF] transition-colors duration-300 hover:text-white" />
            {!(isDesktop && isDesktopCollapsed) ? <span>Logout</span> : null}
          </button>
        </div>
      </aside>

      {isOpen ? <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => onOpenChange(false)} /> : null}
    </>
  );
}

export default Sidebar;
