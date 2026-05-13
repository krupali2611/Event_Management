import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminFeedbackService } from '@/services/adminFeedback.service';
import { adminDashboardService } from '@/services/adminDashboard.service';
import { superAdminDashboardService } from '@/services/superAdminDashboard.service';
import type { AdminFeedbackAnalyticsData } from '@/types/admin-feedback.types';
import type { AdminDashboardEventStatus, AdminDashboardMonthlyAnalyticsData } from '@/types/admin-dashboard.types';
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

const emptyEventAnalytics: AdminDashboardMonthlyAnalyticsData = {
  months: [],
};

const emptyRoleDistribution: SuperAdminDashboardRoleDistribution = {
  admins: 0,
  organizers: 0,
  attendees: 0,
};

const emptyEventStatus: AdminDashboardEventStatus = {
  approved: 0,
  pending: 0,
  rejected: 0,
  cancelled: 0,
};

const emptyTopOrganizers: SuperAdminDashboardTopOrganizersData = {
  organizers: [],
};

const emptyTopEvents: SuperAdminDashboardTopEventsData = {
  events: [],
};

const emptyFeedbackAnalytics: AdminFeedbackAnalyticsData = {
  totalReviews: 0,
  averageRating: 0,
  highestRatedEvents: [],
  lowestRatedEvents: [],
  organizerRatings: [],
};

export function usePlatformDashboardAnalytics() {
  const [stats, setStats] = useState<SuperAdminDashboardStats>(emptyStats);
  const [revenue, setRevenue] = useState<SuperAdminDashboardRevenueData>(emptyRevenue);
  const [userGrowth, setUserGrowth] = useState<SuperAdminDashboardUserGrowthData>(emptyUserGrowth);
  const [eventAnalytics, setEventAnalytics] = useState<AdminDashboardMonthlyAnalyticsData>(emptyEventAnalytics);
  const [roleDistribution, setRoleDistribution] = useState<SuperAdminDashboardRoleDistribution>(emptyRoleDistribution);
  const [eventStatus, setEventStatus] = useState<AdminDashboardEventStatus>(emptyEventStatus);
  const [topOrganizers, setTopOrganizers] = useState<SuperAdminDashboardTopOrganizersData>(emptyTopOrganizers);
  const [topEvents, setTopEvents] = useState<SuperAdminDashboardTopEventsData>(emptyTopEvents);
  const [feedbackAnalytics, setFeedbackAnalytics] = useState<AdminFeedbackAnalyticsData>(emptyFeedbackAnalytics);
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

      const [
        statsResponse,
        revenueResponse,
        userGrowthResponse,
        eventAnalyticsResponse,
        roleDistributionResponse,
        eventStatusResponse,
        topOrganizersResponse,
        topEventsResponse,
        feedbackAnalyticsResponse,
      ] = await Promise.all([
        superAdminDashboardService.getStats(),
        superAdminDashboardService.getRevenue(),
        superAdminDashboardService.getUserGrowth(),
        adminDashboardService.getEventsAnalytics(),
        superAdminDashboardService.getRoleDistribution(),
        adminDashboardService.getEventStatus(),
        superAdminDashboardService.getTopOrganizers(),
        superAdminDashboardService.getTopEvents(),
        adminFeedbackService.getAnalytics(),
      ]);

      setStats(statsResponse.data ?? emptyStats);
      setRevenue(revenueResponse.data ?? emptyRevenue);
      setUserGrowth(userGrowthResponse.data ?? emptyUserGrowth);
      setEventAnalytics(eventAnalyticsResponse.data ?? emptyEventAnalytics);
      setRoleDistribution(roleDistributionResponse.data ?? emptyRoleDistribution);
      setEventStatus(eventStatusResponse.data ?? emptyEventStatus);
      setTopOrganizers(topOrganizersResponse.data ?? emptyTopOrganizers);
      setTopEvents(topEventsResponse.data ?? emptyTopEvents);
      setFeedbackAnalytics(feedbackAnalyticsResponse.data ?? emptyFeedbackAnalytics);
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
      stats.totalEvents > 0 ||
      feedbackAnalytics.totalReviews > 0 ||
      topOrganizers.organizers.length > 0 ||
      topEvents.events.length > 0,
    [feedbackAnalytics.totalReviews, stats.totalEvents, stats.totalPlatformRevenue, stats.totalUsers, topEvents.events.length, topOrganizers.organizers.length],
  );

  return {
    stats,
    revenue,
    userGrowth,
    eventAnalytics,
    roleDistribution,
    eventStatus,
    topOrganizers,
    topEvents,
    feedbackAnalytics,
    loading,
    refreshing,
    error,
    hasAnyAnalytics,
    refresh: () => fetchDashboard('refresh'),
  };
}
