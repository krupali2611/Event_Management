import { Menu, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  onCollapseChange?: (collapsed: boolean) => void;
}

function Sidebar({ items, role, theme, onCollapseChange }: SidebarProps) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const dark = theme === 'dark';
  const dashboardTitle = role === 'ORGANIZER' ? 'Organizer Dashboard' : role === 'SUPER_ADMIN' ? 'Super Admin Dashboard' : 'Admin Dashboard';

  const shellClass = useMemo(
    () =>
      dark
        ? 'border-[#1F2937] bg-[#111827] text-[#E5E7EB]'
        : 'border-slate-200 bg-white/95 text-slate-700',
    [dark],
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1023px)');
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      const matches = event.matches;

      if (matches) {
        setCollapsed(true);
        setOpen(false);
      } else {
        setOpen(false);
      }
    };

    handleChange(mediaQuery);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    onCollapseChange?.(collapsed);
  }, [collapsed, onCollapseChange]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`fixed left-4 top-4 z-50 inline-flex h-10 w-10 items-center justify-center rounded-xl border lg:hidden ${shellClass}`}
        aria-label="Toggle sidebar"
      >
        {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      <button
        type="button"
        onClick={() => setCollapsed((current) => !current)}
        className={`fixed left-4 top-16 z-40 hidden h-10 w-10 items-center justify-center rounded-xl border transition lg:inline-flex ${shellClass}`}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
      </button>

      <aside
        className={`fixed inset-y-0 left-0 z-40 border-r px-4 py-4 transition-all duration-300 lg:translate-x-0 ${collapsed ? 'w-24' : 'w-72'} ${shellClass} ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className={`${dark ? 'border-[#1F2937] bg-[#0B1220]' : 'border-slate-200 bg-slate-50'} rounded-2xl border p-4`}>
          <p className={`text-[11px] font-semibold uppercase tracking-[0.32em] ${dark ? 'text-[#9CA3AF]' : 'text-slate-500'} ${collapsed ? 'text-center' : ''}`}>
            Eventify
          </p>
          {!collapsed ? (
            <>
              <h2 className="mt-3 text-lg font-semibold">{dashboardTitle}</h2>
              <p className={`mt-1 text-sm ${dark ? 'text-[#9CA3AF]' : 'text-slate-500'}`}>{role.replace('_', ' ')}</p>
            </>
          ) : null}
        </div>

        <nav className="mt-5 space-y-1.5">
          {items.map((item) => {
            const active = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={`flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition ${collapsed ? 'justify-center' : 'gap-3'} ${
                  dark
                    ? active
                      ? 'bg-[#6366F1]/15 text-[#E5E7EB]'
                      : 'text-[#9CA3AF] hover:bg-[#0B1220] hover:text-[#E5E7EB]'
                    : active
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`h-4 w-4 ${active && dark ? 'text-[#6366F1]' : ''}`} />
                {!collapsed ? <span>{item.label}</span> : null}
              </Link>
            );
          })}
        </nav>
      </aside>

      {open ? <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setOpen(false)} /> : null}
    </>
  );
}

export default Sidebar;
