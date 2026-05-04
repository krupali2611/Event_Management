import { ChevronLeft, ChevronRight } from 'lucide-react';
import { memo } from 'react';
import UserActions from '@/components/admin/UserActions';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import type { UserRole } from '@/types/api';
import type { UserListItem, UserListPagination } from '@/types/user.types';

interface UserTableProps {
  users: UserListItem[];
  currentUserRole: UserRole;
  pagination: UserListPagination;
  loading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (limit: number) => void;
  onChangeRole: (user: UserListItem) => void;
  onDelete: (user: UserListItem) => void;
}

interface UserRowProps {
  currentUserRole: UserRole;
  user: UserListItem;
  onChangeRole: (user: UserListItem) => void;
  onDelete: (user: UserListItem) => void;
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

const UserRow = memo(function UserRow({ currentUserRole, user, onChangeRole, onDelete }: UserRowProps) {
  return (
    <tr className="border-b border-[#1F2937] even:bg-white/[0.01] hover:bg-white/[0.03]">
      <td className="px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[#E5E7EB]">{user.name}</p>
          <p className="mt-0.5 text-xs uppercase tracking-[0.18em] text-[#9CA3AF]">{user.isActive ? 'Active' : 'Inactive'}</p>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-[#9CA3AF]">{user.email}</td>
      <td className="px-4 py-3">
        <Badge role={user.role} />
      </td>
      <td className="px-4 py-3">
        <UserActions
          currentUserRole={currentUserRole}
          user={user}
          onChangeRole={onChangeRole}
          onDelete={onDelete}
        />
      </td>
    </tr>
  );
});

function UserTable({
  users,
  currentUserRole,
  pagination,
  loading,
  onPageChange,
  onPageSizeChange,
  onChangeRole,
  onDelete,
}: UserTableProps) {
  const visiblePages = getVisiblePages(pagination.page, pagination.totalPages);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#1F2937] bg-[#111827]">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="border-b border-[#1F2937] bg-[#0F172A]">
            <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.28em] text-[#9CA3AF]">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: pagination.limit }).map((_, index) => (
                  <tr key={`skeleton-${index}`} className="border-b border-[#1F2937]">
                    <td className="px-4 py-3">
                      <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
                      <div className="mt-2 h-3 w-14 animate-pulse rounded bg-white/5" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-48 animate-pulse rounded bg-white/10" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-6 w-24 animate-pulse rounded-full bg-white/10" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <div className="h-9 w-9 animate-pulse rounded-lg bg-white/10" />
                        <div className="h-9 w-9 animate-pulse rounded-lg bg-white/10" />
                        <div className="h-9 w-9 animate-pulse rounded-lg bg-white/10" />
                      </div>
                    </td>
                  </tr>
                ))
              : users.map((user) => (
                  <UserRow
                    key={user.id}
                    currentUserRole={currentUserRole}
                    user={user}
                    onChangeRole={onChangeRole}
                    onDelete={onDelete}
                  />
                ))}
          </tbody>
        </table>
      </div>

      {!loading && users.length === 0 ? (
        <div className="px-4 py-10 text-center">
          <p className="text-sm font-medium text-[#E5E7EB]">No users found</p>
          <p className="mt-1 text-sm text-[#9CA3AF]">Try a different search or role filter.</p>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-[#1F2937] px-4 py-3 text-sm text-[#9CA3AF] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <p>
            Page {pagination.page} of {pagination.totalPages} | {pagination.total} users
          </p>
          <label className="flex items-center gap-2">
            <span>Rows</span>
            <select
              value={pagination.limit}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="rounded-lg border border-[#1F2937] bg-[#0B1220] px-2.5 py-1.5 text-sm text-[#E5E7EB] outline-none focus:border-[#6366F1]"
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
            className="rounded-lg border border-[#1F2937] bg-[#0B1220] px-3 py-2 text-[#E5E7EB] hover:bg-white/[0.04]"
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
                  ? 'bg-[#6366F1] text-white'
                  : 'border border-[#1F2937] bg-[#0B1220] text-[#E5E7EB] hover:bg-white/[0.04]'
              }`}
            >
              {pageNumber}
            </button>
          ))}
          <Button
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => onPageChange(pagination.page + 1)}
            variant="ghost"
            className="rounded-lg border border-[#1F2937] bg-[#0B1220] px-3 py-2 text-[#E5E7EB] hover:bg-white/[0.04]"
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
