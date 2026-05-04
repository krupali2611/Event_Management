import { useEffect, useState } from 'react';
import UserFilters from '@/components/admin/UserFilters';
import UserRoleModal from '@/components/admin/UserRoleModal';
import UserTable from '@/components/admin/UserTable';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { userService } from '@/services/user.service';
import type { UserRole } from '@/types/api';
import type { UserListData, UserListFilters, UserListItem } from '@/types/user.types';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

const defaultFilters: UserListFilters = {
  page: 1,
  limit: 10,
  search: '',
  role: '',
};

const emptyData: UserListData = {
  users: [],
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  },
};

function getVisibleFilterRoles(currentUserRole: UserRole): UserRole[] {
  return currentUserRole === 'SUPER_ADMIN' ? ['SUPER_ADMIN', 'ADMIN', 'ORGANIZER', 'ATTENDEE'] : ['ORGANIZER', 'ATTENDEE'];
}

function UserManagementPage() {
  const { currentUser } = useAuth();
  const [filters, setFilters] = useState<UserListFilters>(defaultFilters);
  const [debouncedSearch, setDebouncedSearch] = useState(defaultFilters.search);
  const [data, setData] = useState<UserListData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserListItem | null>(null);
  const [isRoleSubmitting, setIsRoleSubmitting] = useState(false);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(filters.search.trim());
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [filters.search]);

  useEffect(() => {
    void loadUsers({
      ...filters,
      search: debouncedSearch,
    });
  }, [debouncedSearch, filters.page, filters.limit, filters.role]);

  const loadUsers = async (nextFilters: UserListFilters): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const response = await userService.getUsers(nextFilters);
      setData(response.data ?? emptyData);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (value: string): void => {
    setFilters((current) => ({
      ...current,
      page: 1,
      search: value,
    }));
  };

  const handleRoleChange = (value: '' | UserRole): void => {
    setFilters((current) => ({
      ...current,
      page: 1,
      role: value,
    }));
  };

  const handlePageChange = (page: number): void => {
    setFilters((current) => ({
      ...current,
      page,
    }));
  };

  const handlePageSizeChange = (limit: number): void => {
    setFilters((current) => ({
      ...current,
      page: 1,
      limit,
    }));
  };

  const handleRoleConfirm = async (role: UserRole): Promise<void> => {
    if (!selectedUser) {
      return;
    }

    try {
      setIsRoleSubmitting(true);
      await userService.updateUserRole(selectedUser.id, { role });
      setSelectedUser(null);
      await loadUsers({
        ...filters,
        search: debouncedSearch,
      });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsRoleSubmitting(false);
    }
  };

  const handleDeleteConfirm = async (): Promise<void> => {
    if (!deleteTarget) {
      return;
    }

    try {
      setIsDeleteSubmitting(true);
      await userService.deleteUser(deleteTarget.id);
      setDeleteTarget(null);
      await loadUsers({
        ...filters,
        search: debouncedSearch,
      });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsDeleteSubmitting(false);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-[#1F2937] bg-[#111827] px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#9CA3AF]">Admin</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#E5E7EB]">User Management</h2>
            <p className="mt-1 text-sm text-[#9CA3AF]">Search users, review roles, and update permissions with server-backed pagination.</p>
          </div>
          <div className="rounded-2xl border border-[#1F2937] bg-[#0B1220] px-4 py-3 text-sm text-[#9CA3AF]">
            {data.pagination.total} visible users
          </div>
        </div>
      </div>

      <UserFilters
        filters={filters}
        availableRoles={getVisibleFilterRoles(currentUser.role)}
        onSearchChange={handleSearchChange}
        onRoleChange={handleRoleChange}
        dark
      />

      {error ? <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div> : null}

      <UserTable
        users={data.users}
        currentUserRole={currentUser.role}
        pagination={data.pagination}
        loading={loading}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onChangeRole={(user) => setSelectedUser(user)}
        onDelete={(user) => setDeleteTarget(user)}
      />

      <UserRoleModal
        currentUserRole={currentUser.role}
        user={selectedUser}
        submitting={isRoleSubmitting}
        onClose={() => setSelectedUser(null)}
        onConfirm={(role) => void handleRoleConfirm(role)}
      />

      {deleteTarget ? (
        <Modal
          eyebrow="Delete User"
          title={`Delete ${deleteTarget.name}?`}
          description="This will call the existing backend delete endpoint. Permission checks remain enforced on the server."
          onClose={() => setDeleteTarget(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button variant="danger" disabled={isDeleteSubmitting} onClick={() => void handleDeleteConfirm()}>
                {isDeleteSubmitting ? 'Deleting...' : 'Delete'}
              </Button>
            </>
          }
        >
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            This action is intended for `SUPER_ADMIN` only and cannot be undone from this screen.
          </div>
        </Modal>
      ) : null}
    </section>
  );
}

export default UserManagementPage;
