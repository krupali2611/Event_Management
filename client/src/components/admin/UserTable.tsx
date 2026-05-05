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

const UserRow = memo(function UserRow({ currentUserId, currentUserRole, user, onChangeRole, onToggleStatus, statusUpdating }: UserRowProps) {
  return (
    <tr className="border-b border-slate-200 even:bg-slate-50/70 hover:bg-slate-50">
      <td className="px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
          <p className="mt-0.5 text-xs uppercase tracking-[0.18em] text-slate-500">{user.status}</p>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">{user.email}</td>
      <td className="px-4 py-3">
        <Badge role={user.role} />
      </td>
      <td className="px-4 py-3">
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
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-panel">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: pagination.limit }).map((_, index) => (
                  <tr key={`skeleton-${index}`} className="border-b border-slate-200">
                    <td className="px-4 py-3">
                      <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
                      <div className="mt-2 h-3 w-14 animate-pulse rounded bg-slate-100" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-48 animate-pulse rounded bg-slate-200" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-6 w-24 animate-pulse rounded-full bg-slate-200" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <div className="h-9 w-9 animate-pulse rounded-lg bg-slate-200" />
                        <div className="h-9 w-9 animate-pulse rounded-lg bg-slate-200" />
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
        <div className="px-4 py-10 text-center">
          <p className="text-sm font-medium text-slate-900">No users found</p>
          <p className="mt-1 text-sm text-slate-500">Try a different search, role filter, or status filter.</p>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <p>
            Page {pagination.page} of {pagination.totalPages} | {pagination.total} users
          </p>
          <label className="flex items-center gap-2">
            <span>Rows</span>
            <select
              value={pagination.limit}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900 outline-none focus:border-brand-500"
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
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 hover:bg-slate-50"
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
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                pageNumber === pagination.page
                  ? 'bg-brand-500 text-white'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {pageNumber}
            </button>
          ))}
          <Button
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => onPageChange(pagination.page + 1)}
            variant="ghost"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 hover:bg-slate-50"
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
