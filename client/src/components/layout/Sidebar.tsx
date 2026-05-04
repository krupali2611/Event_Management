import { Menu, X } from 'lucide-react';
import { useMemo, useState } from 'react';
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
  title: string;
  subtitle: string;
  role: UserRole;
  theme: 'dark' | 'light';
}

function Sidebar({ items, title, subtitle, role, theme }: SidebarProps) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const dark = theme === 'dark';

  const shellClass = useMemo(
    () =>
      dark
        ? 'border-[#1F2937] bg-[#111827] text-[#E5E7EB]'
        : 'border-slate-200 bg-white/95 text-slate-700',
    [dark],
  );

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

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 border-r px-4 py-4 transition duration-200 lg:translate-x-0 ${shellClass} ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className={`${dark ? 'border-[#1F2937] bg-[#0B1220]' : 'border-slate-200 bg-slate-50'} rounded-2xl border p-4`}>
          <p className={`text-[11px] font-semibold uppercase tracking-[0.28em] ${dark ? 'text-[#9CA3AF]' : 'text-slate-500'}`}>
            {role}
          </p>
          <h2 className="mt-2 text-lg font-semibold">{title}</h2>
          <p className={`mt-1 text-sm ${dark ? 'text-[#9CA3AF]' : 'text-slate-500'}`}>{subtitle}</p>
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
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  dark
                    ? active
                      ? 'bg-[#6366F1]/15 text-[#E5E7EB]'
                      : 'text-[#9CA3AF] hover:bg-[#0B1220] hover:text-[#E5E7EB]'
                    : active
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-4 w-4 ${active && dark ? 'text-[#6366F1]' : ''}`} />
                <span>{item.label}</span>
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
