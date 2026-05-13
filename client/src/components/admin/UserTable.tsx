import { ChevronLeft, ChevronRight } from 'lucide-react';
import { memo } from 'react';
import UserActions from '@/components/admin/UserActions';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import type { UserRole } from '@/types/api';
import type { UserListItem, UserListPagination } from '@/types/user.types';

interface UserTableProps {
  currentUserId: string;
  users: UserListItem[];
  currentUserRole: UserRole;
  pagination: UserListPagination;
  loading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (limit: number) => void;
  onChangeRole: (user: UserListItem) => void;
  onToggleStatus: (user: UserListItem) => void;
  togglingUserId: string | null;
}

interface UserRowProps {
  currentUserId: string;
  currentUserRole: UserRole;
  user: UserListItem;
  onChangeRole: (user: UserListItem) => void;
  onToggleStatus: (user: UserListItem) => void;
  statusUpdating: boolean;
}

function getVisiblePages(page: number, totalPages: number): number[] {
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  const pages: number[] = [];

  for (let currentPage = start; currentPage <= end; currentPage += 1) {
    pages.push(currentPage);
  }

  return pages;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function getRoleBadgeClass(role: UserRole): string {
  switch (role) {
    case 'ATTENDEE':
      return 'border border-blue-100 bg-blue-50 text-blue-700 ring-0';
    case 'ORGANIZER':
      return 'border border-blue-200 bg-blue-100/80 text-blue-900 ring-0';
    case 'ADMIN':
      return 'border border-violet-100 bg-violet-50 text-violet-700 ring-0';
    case 'SUPER_ADMIN':
      return 'border border-rose-100 bg-rose-50 text-rose-700 ring-0';
  }
}

const UserRow = memo(function UserRow({ currentUserId, currentUserRole, user, onChangeRole, onToggleStatus, statusUpdating }: UserRowProps) {
  return (
    <tr className="border-b border-[#E2E8F0] bg-white transition-all duration-300 hover:bg-[#F8FAFF]">
      <td className="px-6 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#DBEAFE_0%,#BFDBFE_100%)] text-sm font-semibold text-[#071B4D] shadow-[0_8px_20px_rgba(37,99,255,0.12)]">
            {getInitials(user.name) || 'U'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#0F172A]">{user.name}</p>
            <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#64748B]">{user.status}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-[#475569]">{user.email}</td>
      <td className="px-6 py-4">
        <Badge role={user.role} className={`px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.08em] ${getRoleBadgeClass(user.role)}`} />
      </td>
      <td className="px-6 py-4">
        <UserActions
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          user={user}
          onChangeRole={onChangeRole}
          onToggleStatus={onToggleStatus}
          statusUpdating={statusUpdating}
        />
      </td>
    </tr>
  );
});

function UserTable({
  currentUserId,
  users,
  currentUserRole,
  pagination,
  loading,
  onPageChange,
  onPageSizeChange,
  onChangeRole,
  onToggleStatus,
  togglingUserId,
}: UserTableProps) {
  const visiblePages = getVisiblePages(pagination.page, pagination.totalPages);

  return (
    <div className="overflow-hidden rounded-[24px] border border-[#E2E8F0] bg-white shadow-[0_8px_30px_rgba(37,99,255,0.08)] transition-all duration-300">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="sticky top-0 z-10 border-b border-[#E2E8F0] bg-[#F8FBFF]/95 backdrop-blur-sm">
            <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.28em] text-[#64748B]">
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: pagination.limit }).map((_, index) => (
                  <tr key={`skeleton-${index}`} className="border-b border-[#E2E8F0]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 animate-pulse rounded-full bg-slate-200" />
                        <div>
                          <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
                          <div className="mt-2 h-3 w-14 animate-pulse rounded bg-slate-100" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-48 animate-pulse rounded bg-slate-200" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 w-24 animate-pulse rounded-full bg-slate-200" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <div className="h-10 w-10 animate-pulse rounded-2xl bg-slate-200" />
                        <div className="h-10 w-10 animate-pulse rounded-2xl bg-slate-200" />
                      </div>
                    </td>
                  </tr>
                ))
              : users.map((user) => (
                  <UserRow
                    key={user.id}
                    currentUserId={currentUserId}
                    currentUserRole={currentUserRole}
                    user={user}
                    onChangeRole={onChangeRole}
                    onToggleStatus={onToggleStatus}
                    statusUpdating={togglingUserId === user.id}
                  />
                ))}
          </tbody>
        </table>
      </div>

      {!loading && users.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <p className="text-sm font-semibold text-[#0F172A]">No users found</p>
          <p className="mt-1 text-sm text-[#64748B]">Try a different search, role filter, or status filter.</p>
        </div>
      ) : null}

      <div className="flex flex-col gap-4 border-t border-[#E2E8F0] bg-[#FCFDFF] px-6 py-4 text-sm text-[#64748B] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <p className="font-medium">
            Page {pagination.page} of {pagination.totalPages} | {pagination.total} users
          </p>
          <label className="flex items-center gap-2">
            <span className="font-medium">Rows</span>
            <select
              value={pagination.limit}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="rounded-2xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#0F172A] outline-none transition-all duration-300 focus:border-[#2563FF] focus:ring-4 focus:ring-[#2563FF]/10"
            >
              {[10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            disabled={pagination.page <= 1}
            onClick={() => onPageChange(pagination.page - 1)}
            variant="ghost"
            className="rounded-2xl border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-[#334155] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#F8FAFF] hover:shadow-[0_10px_20px_rgba(37,99,255,0.08)]"
            icon={<ChevronLeft className="h-4 w-4" />}
          >
            Previous
          </Button>
          {visiblePages.map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => onPageChange(pageNumber)}
              aria-current={pageNumber === pagination.page ? 'page' : undefined}
              className={`rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-300 ${
                pageNumber === pagination.page
                  ? 'bg-[linear-gradient(90deg,#2563FF_0%,#3B82F6_100%)] text-white shadow-[0_12px_24px_rgba(37,99,255,0.24)]'
                  : 'border border-[#E2E8F0] bg-white text-[#334155] hover:-translate-y-0.5 hover:bg-[#F8FAFF] hover:shadow-[0_10px_20px_rgba(37,99,255,0.08)]'
              }`}
            >
              {pageNumber}
            </button>
          ))}
          <Button
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => onPageChange(pagination.page + 1)}
            variant="ghost"
            className="rounded-2xl border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-[#334155] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#F8FAFF] hover:shadow-[0_10px_20px_rgba(37,99,255,0.08)]"
            icon={<ChevronRight className="h-4 w-4" />}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

export default UserTable;
