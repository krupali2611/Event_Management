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
  dark?: boolean;
}

function UserFilters({ filters, availableRoles, onSearchChange, onRoleChange, dark = false }: UserFiltersProps) {
  const handleRoleChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    onRoleChange(event.target.value as '' | UserRole);
  };

  return (
    <div className={`grid gap-4 rounded-3xl p-5 shadow-panel md:grid-cols-[minmax(0,1fr)_220px] ${
      dark ? 'border border-slate-800 bg-slate-900/95' : 'border border-slate-200 bg-white/90'
    }`}>
      <label className="block">
        <span className={`mb-2 block text-sm font-semibold ${dark ? 'text-slate-200' : 'text-slate-700'}`}>Search users</span>
        <div className="relative">
          <Search className={`pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${dark ? 'text-slate-500' : 'text-slate-400'}`} />
          <Input
            type="text"
            value={filters.search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by name or email"
            className={`pl-11 ${dark ? 'border-slate-800 bg-slate-950 text-slate-100 focus:bg-slate-950' : ''}`}
          />
        </div>
      </label>

      <label className="block">
        <span className={`mb-2 block text-sm font-semibold ${dark ? 'text-slate-200' : 'text-slate-700'}`}>Filter by role</span>
        <select
          value={filters.role}
          onChange={handleRoleChange}
          className={`w-full rounded-2xl px-4 py-3 outline-none transition ${
            dark
              ? 'border border-slate-800 bg-slate-950 text-slate-100 focus:border-blue-500'
              : 'border border-slate-200 bg-slate-50 text-slate-900 focus:border-brand-500 focus:bg-white'
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
    </div>
  );
}

export default UserFilters;
