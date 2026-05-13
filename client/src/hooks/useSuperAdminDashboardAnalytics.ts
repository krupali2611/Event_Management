import { useCallback, useEffect, useMemo, useState } from 'react';
import { superAdminDashboardService } from '@/services/superAdminDashboard.service';
import type {
  SuperAdminDashboardRevenueData,
  SuperAdminDashboardRoleDistribution,
  SuperAdminDashboardStats,
  SuperAdminDashboardTopEventsData,
  SuperAdminDashboardTopOrganizersData,
  SuperAdminDashboardUserGrowthData,
} from '@/types/super-admin-dashboard.types';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

const emptyStats: SuperAdminDashboardStats = {
  totalPlatformRevenue: 0,
  totalUsers: 0,
  totalAdmins: 0,
  totalOrganizers: 0,
  totalEvents: 0,
  totalTicketsSold: 0,
};

const emptyRevenue: SuperAdminDashboardRevenueData = {
  months: [],
};

const emptyUserGrowth: SuperAdminDashboardUserGrowthData = {
  months: [],
};

const emptyRoleDistribution: SuperAdminDashboardRoleDistribution = {
  admins: 0,
  organizers: 0,
  attendees: 0,
};

const emptyTopOrganizers: SuperAdminDashboardTopOrganizersData = {
  organizers: [],
};

const emptyTopEvents: SuperAdminDashboardTopEventsData = {
  events: [],
};

export function useSuperAdminDashboardAnalytics() {
  const [stats, setStats] = useState<SuperAdminDashboardStats>(emptyStats);
  const [revenue, setRevenue] = useState<SuperAdminDashboardRevenueData>(emptyRevenue);
  const [userGrowth, setUserGrowth] = useState<SuperAdminDashboardUserGrowthData>(emptyUserGrowth);
  const [roleDistribution, setRoleDistribution] = useState<SuperAdminDashboardRoleDistribution>(emptyRoleDistribution);
  const [topOrganizers, setTopOrganizers] = useState<SuperAdminDashboardTopOrganizersData>(emptyTopOrganizers);
  const [topEvents, setTopEvents] = useState<SuperAdminDashboardTopEventsData>(emptyTopEvents);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    try {
      if (mode === 'initial') {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError(null);

      const [statsResponse, revenueResponse, growthResponse, roleResponse, organizersResponse, eventsResponse] = await Promise.all([
        superAdminDashboardService.getStats(),
        superAdminDashboardService.getRevenue(),
        superAdminDashboardService.getUserGrowth(),
        superAdminDashboardService.getRoleDistribution(),
        superAdminDashboardService.getTopOrganizers(),
        superAdminDashboardService.getTopEvents(),
      ]);

      setStats(statsResponse.data ?? emptyStats);
      setRevenue(revenueResponse.data ?? emptyRevenue);
      setUserGrowth(growthResponse.data ?? emptyUserGrowth);
      setRoleDistribution(roleResponse.data ?? emptyRoleDistribution);
      setTopOrganizers(organizersResponse.data ?? emptyTopOrganizers);
      setTopEvents(eventsResponse.data ?? emptyTopEvents);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  const hasAnyAnalytics = useMemo(
    () =>
      stats.totalUsers > 0 ||
      stats.totalPlatformRevenue > 0 ||
      topOrganizers.organizers.length > 0 ||
      topEvents.events.length > 0,
    [stats.totalPlatformRevenue, stats.totalUsers, topEvents.events.length, topOrganizers.organizers.length],
  );

  return {
    stats,
    revenue,
    userGrowth,
    roleDistribution,
    topOrganizers,
    topEvents,
    loading,
    refreshing,
    error,
    hasAnyAnalytics,
    refresh: () => fetchDashboard('refresh'),
  };
}
