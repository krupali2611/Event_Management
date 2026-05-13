import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminFeedbackService } from '@/services/adminFeedback.service';
import { adminDashboardService } from '@/services/adminDashboard.service';
import type { AdminFeedbackAnalyticsData } from '@/types/admin-feedback.types';
import type {
  AdminDashboardEventStatus,
  AdminDashboardMonthlyAnalyticsData,
  AdminDashboardRecentEventsData,
  AdminDashboardRecentUsersData,
  AdminDashboardStats,
} from '@/types/admin-dashboard.types';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

const emptyStats: AdminDashboardStats = {
  totalUsers: 0,
  totalOrganizers: 0,
  totalEvents: 0,
  pendingEvents: 0,
  approvedEvents: 0,
  totalVenueBookings: 0,
};

const emptyMonthlyAnalytics: AdminDashboardMonthlyAnalyticsData = {
  months: [],
};

const emptyEventStatus: AdminDashboardEventStatus = {
  approved: 0,
  pending: 0,
  rejected: 0,
  cancelled: 0,
};

const emptyRecentEvents: AdminDashboardRecentEventsData = {
  events: [],
};

const emptyRecentUsers: AdminDashboardRecentUsersData = {
  users: [],
};

const emptyFeedbackAnalytics: AdminFeedbackAnalyticsData = {
  totalReviews: 0,
  averageRating: 0,
  highestRatedEvents: [],
  lowestRatedEvents: [],
  organizerRatings: [],
};

export function useAdminDashboardAnalytics() {
  const [stats, setStats] = useState<AdminDashboardStats>(emptyStats);
  const [eventAnalytics, setEventAnalytics] = useState<AdminDashboardMonthlyAnalyticsData>(emptyMonthlyAnalytics);
  const [userAnalytics, setUserAnalytics] = useState<AdminDashboardMonthlyAnalyticsData>(emptyMonthlyAnalytics);
  const [eventStatus, setEventStatus] = useState<AdminDashboardEventStatus>(emptyEventStatus);
  const [recentEvents, setRecentEvents] = useState<AdminDashboardRecentEventsData>(emptyRecentEvents);
  const [recentUsers, setRecentUsers] = useState<AdminDashboardRecentUsersData>(emptyRecentUsers);
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

      const [statsResponse, eventAnalyticsResponse, userAnalyticsResponse, eventStatusResponse, recentEventsResponse, recentUsersResponse, feedbackAnalyticsResponse] =
        await Promise.all([
          adminDashboardService.getStats(),
          adminDashboardService.getEventsAnalytics(),
          adminDashboardService.getUserAnalytics(),
          adminDashboardService.getEventStatus(),
          adminDashboardService.getRecentEvents(),
          adminDashboardService.getRecentUsers(),
          adminFeedbackService.getAnalytics(),
        ]);

      setStats(statsResponse.data ?? emptyStats);
      setEventAnalytics(eventAnalyticsResponse.data ?? emptyMonthlyAnalytics);
      setUserAnalytics(userAnalyticsResponse.data ?? emptyMonthlyAnalytics);
      setEventStatus(eventStatusResponse.data ?? emptyEventStatus);
      setRecentEvents(recentEventsResponse.data ?? emptyRecentEvents);
      setRecentUsers(recentUsersResponse.data ?? emptyRecentUsers);
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
      stats.totalEvents > 0 ||
      feedbackAnalytics.totalReviews > 0 ||
      recentEvents.events.length > 0 ||
      recentUsers.users.length > 0,
    [feedbackAnalytics.totalReviews, recentEvents.events.length, recentUsers.users.length, stats.totalEvents, stats.totalUsers],
  );

  return {
    stats,
    eventAnalytics,
    userAnalytics,
    eventStatus,
    recentEvents,
    recentUsers,
    feedbackAnalytics,
    loading,
    refreshing,
    error,
    hasAnyAnalytics,
    refresh: () => fetchDashboard('refresh'),
  };
}
