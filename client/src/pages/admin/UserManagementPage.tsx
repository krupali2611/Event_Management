import { useEffect, useState } from 'react';
import UserFilters from '@/components/admin/UserFilters';
import UserRoleModal from '@/components/admin/UserRoleModal';
import UserTable from '@/components/admin/UserTable';
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
  status: '',
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
  const [isRoleSubmitting, setIsRoleSubmitting] = useState(false);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

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
  }, [debouncedSearch, filters.page, filters.limit, filters.role, filters.status]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

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

  const handleStatusChange = (value: '' | 'ACTIVE' | 'INACTIVE'): void => {
    setFilters((current) => ({
      ...current,
      page: 1,
      status: value,
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

  const handleToggleStatus = async (user: UserListItem): Promise<void> => {
    if (!currentUser || currentUser.id === user.id) {
      setError('You cannot deactivate your own account from this screen.');
      return;
    }

    const nextStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const previousUsers = data.users;

    setError(null);
    setTogglingUserId(user.id);
    setData((current) => ({
      ...current,
      users: current.users.map((item) =>
        item.id === user.id
          ? {
              ...item,
              isActive: nextStatus === 'ACTIVE',
              status: nextStatus,
            }
          : item,
      ),
    }));

    try {
      const response = await userService.updateUserStatus(user.id);
      const updatedUser = response.data;

      if (updatedUser) {
        setData((current) => ({
          ...current,
          users: current.users.map((item) =>
            item.id === user.id
              ? {
                  ...item,
                  isActive: updatedUser.isActive,
                  status: updatedUser.status,
                }
              : item,
          ),
        }));
      }

      setToast(nextStatus === 'ACTIVE' ? 'User Activated' : 'User Deactivated');
    } catch (requestError) {
      setData((current) => ({
        ...current,
        users: previousUsers,
      }));
      setError(getApiErrorMessage(requestError));
    } finally {
      setTogglingUserId(null);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white/95 px-4 py-4 shadow-panel sm:px-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {data.pagination.total} visible users
          </div>
        </div>
      </div>

      <UserFilters
        filters={filters}
        availableRoles={getVisibleFilterRoles(currentUser.role)}
        onSearchChange={handleSearchChange}
        onRoleChange={handleRoleChange}
        onStatusChange={handleStatusChange}
      />

      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <UserTable
        currentUserId={currentUser.id}
        users={data.users}
        currentUserRole={currentUser.role}
        pagination={data.pagination}
        loading={loading}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onChangeRole={(user) => setSelectedUser(user)}
        onToggleStatus={(user) => void handleToggleStatus(user)}
        togglingUserId={togglingUserId}
      />

      <UserRoleModal
        currentUserRole={currentUser.role}
        user={selectedUser}
        submitting={isRoleSubmitting}
        onClose={() => setSelectedUser(null)}
        onConfirm={(role) => void handleRoleConfirm(role)}
      />

      {toast ? (
        <div className="pointer-events-none fixed bottom-6 right-6 z-50 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-emerald-700 shadow-2xl shadow-emerald-100">
          {toast}
        </div>
      ) : null}
    </section>
  );
}

export default UserManagementPage;
