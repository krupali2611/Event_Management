import { Activity, ShieldCheck, ShieldX, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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
  return currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN'
    ? ['SUPER_ADMIN', 'ADMIN', 'ORGANIZER', 'ATTENDEE']
    : ['ORGANIZER', 'ATTENDEE'];
}

interface OverviewStat {
  key: string;
  icon: typeof Users;
  label: string;
  value: number;
  tone: string;
  iconTone: string;
  line: string;
}

interface OverviewStatsState {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  admins: number;
  attendees: number;
  organizers: number;
}

function UserManagementPage() {
  const { currentUser } = useAuth();
  const currentUserRole = currentUser?.role;
  const [filters, setFilters] = useState<UserListFilters>(defaultFilters);
  const [debouncedSearch, setDebouncedSearch] = useState(defaultFilters.search);
  const [data, setData] = useState<UserListData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [isRoleSubmitting, setIsRoleSubmitting] = useState(false);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [overviewStats, setOverviewStats] = useState<OverviewStatsState>({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    admins: 0,
    attendees: 0,
    organizers: 0,
  });

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
    if (!currentUserRole) {
      return;
    }

    void loadOverviewStats(currentUserRole);
  }, [currentUserRole]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const statCards = useMemo<OverviewStat[]>(() => {
    if (!currentUserRole) {
      return [];
    }

    const baseCards: OverviewStat[] = [
      {
        key: 'totalUsers',
        icon: Users,
        label: 'Total Users',
        value: overviewStats.totalUsers,
        tone: 'from-[#E7F0FF] to-[#EEF4FF]',
        iconTone: 'bg-[linear-gradient(180deg,#E9F1FF_0%,#DDEAFF_100%)] text-[#2563FF]',
        line: 'bg-[#2563FF]',
      },
      {
        key: 'activeUsers',
        icon: Activity,
        label: 'Active Users',
        value: overviewStats.activeUsers,
        tone: 'from-[#E8FAF0] to-[#F2FCF6]',
        iconTone: 'bg-[linear-gradient(180deg,#E7F8EE_0%,#DCF5E7_100%)] text-[#16A34A]',
        line: 'bg-[#22C55E]',
      },
      {
        key: 'inactiveUsers',
        icon: ShieldX,
        label: 'Inactive Users',
        value: overviewStats.inactiveUsers,
        tone: 'from-[#FFECEE] to-[#FFF4F5]',
        iconTone: 'bg-[linear-gradient(180deg,#FFE9EC_0%,#FFDDE3_100%)] text-[#FF4D5E]',
        line: 'bg-[#FF4D5E]',
      },
    ];

    if (currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN') {
      return [
        ...baseCards,
        {
          key: 'admins',
          icon: ShieldCheck,
          label: 'Total Admin',
          value: overviewStats.admins,
          tone: 'from-[#F2ECFF] to-[#F8F5FF]',
          iconTone: 'bg-[linear-gradient(180deg,#F1EAFE_0%,#E7DEFF_100%)] text-[#7C3AED]',
          line: 'bg-[#7C3AED]',
        },
        {
          key: 'attendees',
          icon: Users,
          label: 'Total Attendee',
          value: overviewStats.attendees,
          tone: 'from-[#EAF4FF] to-[#F4F9FF]',
          iconTone: 'bg-[linear-gradient(180deg,#E7F0FF_0%,#D8E8FF_100%)] text-[#1D4ED8]',
          line: 'bg-[#3B82F6]',
        },
        {
          key: 'organizers',
          icon: ShieldCheck,
          label: 'Total Organizer',
          value: overviewStats.organizers,
          tone: 'from-[#EEF6FF] to-[#F7FAFF]',
          iconTone: 'bg-[linear-gradient(180deg,#E8F1FF_0%,#DDE9FF_100%)] text-[#0F3FB8]',
          line: 'bg-[#2563FF]',
        },
      ];
    }

    return [
      ...baseCards,
      {
        key: 'attendees',
        icon: Users,
        label: 'Total Attendee',
        value: overviewStats.attendees,
        tone: 'from-[#EAF4FF] to-[#F4F9FF]',
        iconTone: 'bg-[linear-gradient(180deg,#E7F0FF_0%,#D8E8FF_100%)] text-[#1D4ED8]',
        line: 'bg-[#3B82F6]',
      },
      {
        key: 'organizers',
        icon: ShieldCheck,
        label: 'Total Organizer',
        value: overviewStats.organizers,
        tone: 'from-[#EEF6FF] to-[#F7FAFF]',
        iconTone: 'bg-[linear-gradient(180deg,#E8F1FF_0%,#DDE9FF_100%)] text-[#0F3FB8]',
        line: 'bg-[#2563FF]',
      },
    ];
  }, [currentUserRole, overviewStats]);

  const loadOverviewStats = async (role: UserRole): Promise<void> => {
    const getTotal = async (query: Partial<UserListFilters>): Promise<number> => {
      const response = await userService.getUsers({
        page: 1,
        limit: 1,
        search: '',
        role: '',
        status: '',
        ...query,
      });

      return response.data?.pagination.total ?? 0;
    };

    try {
      if (role === 'SUPER_ADMIN') {
        const [totalUsers, activeUsers, inactiveUsers, admins, attendees, organizers] = await Promise.all([
          getTotal({}),
          getTotal({ status: 'ACTIVE' }),
          getTotal({ status: 'INACTIVE' }),
          getTotal({ role: 'ADMIN' }),
          getTotal({ role: 'ATTENDEE' }),
          getTotal({ role: 'ORGANIZER' }),
        ]);

        setOverviewStats({ totalUsers, activeUsers, inactiveUsers, admins, attendees, organizers });
        return;
      }

      const [totalUsers, activeUsers, inactiveUsers, admins, attendees, organizers] = await Promise.all([
        getTotal({}),
        getTotal({ status: 'ACTIVE' }),
        getTotal({ status: 'INACTIVE' }),
        getTotal({ role: 'ADMIN' }),
        getTotal({ role: 'ATTENDEE' }),
        getTotal({ role: 'ORGANIZER' }),
      ]);

      setOverviewStats({
        totalUsers,
        activeUsers,
        inactiveUsers,
        admins,
        attendees,
        organizers,
      });
    } catch {
      setOverviewStats({
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        admins: 0,
        attendees: 0,
        organizers: 0,
      });
    }
  };

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

  const handleResetFilters = (): void => {
    setFilters(defaultFilters);
    setDebouncedSearch(defaultFilters.search);
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
      if (currentUserRole) {
        await loadOverviewStats(currentUserRole);
      }
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
      if (currentUserRole) {
        await loadOverviewStats(currentUserRole);
      }
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

  if (!currentUser || !currentUserRole) {
    return null;
  }

  return (
    <section className="relative overflow-hidden rounded-[24px] bg-[#F4F7FC] p-6 transition-all duration-300">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,255,0.14),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.1),transparent_26%)]" />
      <div className="relative space-y-6">
        <header>
          <div className={`grid gap-3 md:grid-cols-2 ${currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN' ? 'xl:grid-cols-3 2xl:grid-cols-6' : 'xl:grid-cols-3 2xl:grid-cols-5'}`}>
            {statCards.map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.label}
                  className="group relative overflow-hidden rounded-[22px] border border-white/70 bg-white px-4 py-4 shadow-[0_8px_24px_rgba(37,99,255,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_34px_rgba(37,99,255,0.1)]"
                >
                  <div className={`absolute inset-x-0 top-0 h-full bg-gradient-to-br ${card.tone} opacity-45`} />
                  <div className="relative flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={`flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-[16px] shadow-inner ${card.iconTone}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <p className="text-[13px] font-medium leading-snug text-[#64748B]">{card.label}</p>
                        <p className="text-[28px] font-bold leading-none tracking-tight text-[#0F172A]">{card.value}</p>
                      </div>
                    </div>
                    <div className="flex h-10 shrink-0 items-end gap-1 self-end pb-1">
                      <span className={`block h-1.5 w-2.5 rounded-full ${card.line} opacity-55`} />
                      <span className={`block h-2.5 w-2.5 rounded-full ${card.line} opacity-70`} />
                      <span className={`block h-2 w-2.5 rounded-full ${card.line} opacity-85`} />
                      <span className={`block h-4 w-2.5 rounded-full ${card.line}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </header>

      <UserFilters
        filters={filters}
        availableRoles={getVisibleFilterRoles(currentUser.role)}
        onSearchChange={handleSearchChange}
        onRoleChange={handleRoleChange}
        onStatusChange={handleStatusChange}
        onReset={handleResetFilters}
      />

        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-700 shadow-sm">{error}</div> : null}

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
      </div>
    </section>
  );
}

export default UserManagementPage;
