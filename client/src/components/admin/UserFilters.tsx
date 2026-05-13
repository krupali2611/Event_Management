import type { ChangeEvent } from 'react';
import { Search } from 'lucide-react';
import Input from '@/components/ui/Input';
import type { UserRole } from '@/types/api';
import type { UserListFilters } from '@/types/user.types';

interface UserFiltersProps {
  filters: UserListFilters;
  availableRoles: UserRole[];
  onSearchChange: (value: string) => void;
  onRoleChange: (value: '' | UserRole) => void;
  onStatusChange: (value: '' | 'ACTIVE' | 'INACTIVE') => void;
  onReset: () => void;
  dark?: boolean;
}

function UserFilters({ filters, availableRoles, onSearchChange, onRoleChange, onStatusChange, onReset, dark = false }: UserFiltersProps) {
  const handleRoleChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    onRoleChange(event.target.value as '' | UserRole);
  };

  const handleStatusChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    onStatusChange(event.target.value as '' | 'ACTIVE' | 'INACTIVE');
  };

  return (
    <div className={`rounded-[24px] border p-5 shadow-[0_8px_30px_rgba(37,99,255,0.08)] backdrop-blur-sm transition-all duration-300 ${
      dark ? 'border-slate-800 bg-slate-900/95' : 'border-[#E2E8F0] bg-white/90'
    }`}>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_220px_220px_170px]">
        <label className="block">
          <span className={`mb-2.5 block text-sm font-semibold ${dark ? 'text-slate-200' : 'text-[#0F172A]'}`}>Search users</span>
          <div className="relative">
            <Search className={`pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${dark ? 'text-slate-500' : 'text-[#64748B]'}`} />
            <Input
              type="text"
              value={filters.search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search by name, email, or status"
              className={`h-[54px] rounded-2xl border px-4 pl-11 text-sm shadow-sm transition-all duration-300 ${
                dark
                  ? 'border-slate-800 bg-slate-950 text-slate-100 focus:border-blue-500 focus:bg-slate-950 focus:ring-4 focus:ring-blue-500/10'
                  : 'border-[#E2E8F0] bg-white text-[#0F172A] focus:border-[#2563FF] focus:bg-white focus:ring-4 focus:ring-[#2563FF]/10'
              }`}
            />
          </div>
        </label>

        <label className="block">
          <span className={`mb-2.5 block text-sm font-semibold ${dark ? 'text-slate-200' : 'text-[#0F172A]'}`}>Status</span>
          <select
            value={filters.status ?? ''}
            onChange={handleStatusChange}
            className={`h-[54px] w-full rounded-2xl border px-4 text-sm outline-none transition-all duration-300 ${
              dark
                ? 'border-slate-800 bg-slate-950 text-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                : 'border-[#E2E8F0] bg-white text-[#0F172A] focus:border-[#2563FF] focus:ring-4 focus:ring-[#2563FF]/10'
            }`}
          >
            <option value="">All Users</option>
            <option value="ACTIVE">Active Users</option>
            <option value="INACTIVE">Inactive Users</option>
          </select>
        </label>

        <label className="block">
          <span className={`mb-2.5 block text-sm font-semibold ${dark ? 'text-slate-200' : 'text-[#0F172A]'}`}>Role</span>
          <select
            value={filters.role}
            onChange={handleRoleChange}
            className={`h-[54px] w-full rounded-2xl border px-4 text-sm outline-none transition-all duration-300 ${
              dark
                ? 'border-slate-800 bg-slate-950 text-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                : 'border-[#E2E8F0] bg-white text-[#0F172A] focus:border-[#2563FF] focus:ring-4 focus:ring-[#2563FF]/10'
            }`}
          >
            <option value="">All visible roles</option>
            {availableRoles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-end">
          <button
            type="button"
            onClick={onReset}
            className={`h-[54px] w-full rounded-2xl border text-sm font-semibold transition-all duration-300 ${
              dark
                ? 'border-blue-500/40 bg-slate-950 text-slate-100 hover:bg-blue-500/10'
                : 'border-[#2563FF] bg-white text-[#2563FF] hover:bg-[#2563FF] hover:text-white'
            }`}
          >
            Reset Filters
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserFilters;
