import { useCallback, useEffect, useMemo, useState } from 'react';
import { eventService } from '@/services/event.service';
import { organizerDashboardService } from '@/services/organizerDashboard.service';
import type { EventItem, EventsResponse } from '@/types/event.types';
import type {
  OrganizerDashboardFeedbackAnalyticsData,
  OrganizerDashboardFeedbackAnalyticsResponse,
  OrganizerDashboardRevenueData,
  OrganizerDashboardRevenueResponse,
  OrganizerDashboardStats,
  OrganizerDashboardStatsResponse,
  OrganizerDashboardTicketSalesData,
  OrganizerDashboardTicketSalesResponse,
} from '@/types/organizer-dashboard.types';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

const emptyStats: OrganizerDashboardStats = {
  totalEvents: 0,
  totalRevenue: 0,
  ticketsSold: 0,
  upcomingEvents: 0,
  totalAttendees: 0,
};

const emptyRevenue: OrganizerDashboardRevenueData = {
  months: [],
};

const emptyTicketSales: OrganizerDashboardTicketSalesData = {
  events: [],
};

const emptyFeedbackAnalytics: OrganizerDashboardFeedbackAnalyticsData = {
  averageRating: 0,
  totalReviews: 0,
  highestRatedEvents: [],
  lowestRatedEvents: [],
  recentReviews: [],
};

const emptyUpcomingEventsResponse: EventsResponse = {
  success: true,
  message: 'No organizer events available',
  data: {
    events: [],
    pagination: {
      total: 0,
      page: 1,
      limit: 50,
      totalPages: 1,
    },
  },
};

const emptyStatsResponse: OrganizerDashboardStatsResponse = {
  success: true,
  message: 'No organizer stats available',
  data: emptyStats,
};

const emptyRevenueResponse: OrganizerDashboardRevenueResponse = {
  success: true,
  message: 'No organizer revenue available',
  data: emptyRevenue,
};

const emptyTicketSalesResponse: OrganizerDashboardTicketSalesResponse = {
  success: true,
  message: 'No organizer ticket sales available',
  data: emptyTicketSales,
};

const emptyFeedbackAnalyticsResponse: OrganizerDashboardFeedbackAnalyticsResponse = {
  success: true,
  message: 'No organizer feedback analytics available',
  data: emptyFeedbackAnalytics,
};

function resolveSettledValue<T>(result: PromiseSettledResult<T>, fallback: T): T {
  return result.status === 'fulfilled' ? result.value : fallback;
}

export function useOrganizerDashboardAnalytics() {
  const [stats, setStats] = useState<OrganizerDashboardStats>(emptyStats);
  const [revenue, setRevenue] = useState<OrganizerDashboardRevenueData>(emptyRevenue);
  const [ticketSales, setTicketSales] = useState<OrganizerDashboardTicketSalesData>(emptyTicketSales);
  const [feedbackAnalytics, setFeedbackAnalytics] = useState<OrganizerDashboardFeedbackAnalyticsData>(emptyFeedbackAnalytics);
  const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);
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

      const [statsResponse, revenueResponse, ticketSalesResponse, feedbackResponse, eventsResponse] = await Promise.allSettled([
        organizerDashboardService.getStats(),
        organizerDashboardService.getRevenue(),
        organizerDashboardService.getTicketSales(),
        organizerDashboardService.getFeedbackAnalytics(),
        eventService.getEvents({
          page: 1,
          limit: 50,
          search: '',
          date: '',
          status: '',
          includeUnpublished: true,
        }),
      ]);

      const nextUpcomingEvents = (resolveSettledValue(eventsResponse, emptyUpcomingEventsResponse).data?.events ?? [])
        .filter((event) => event.lifecycleStatus === 'UPCOMING')
        .sort((left, right) => new Date(left.startDate).getTime() - new Date(right.startDate).getTime())
        .slice(0, 6);

      setStats(resolveSettledValue(statsResponse, emptyStatsResponse).data ?? emptyStats);
      setRevenue(resolveSettledValue(revenueResponse, emptyRevenueResponse).data ?? emptyRevenue);
      setTicketSales(resolveSettledValue(ticketSalesResponse, emptyTicketSalesResponse).data ?? emptyTicketSales);
      setFeedbackAnalytics(resolveSettledValue(feedbackResponse, emptyFeedbackAnalyticsResponse).data ?? emptyFeedbackAnalytics);
      setUpcomingEvents(nextUpcomingEvents);

      const failedRequest = [statsResponse, revenueResponse, ticketSalesResponse, feedbackResponse, eventsResponse].find(
        (result) => result.status === 'rejected',
      );

      if (failedRequest?.status === 'rejected') {
        setError(getApiErrorMessage(failedRequest.reason));
      }
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
      stats.totalEvents > 0 ||
      stats.totalRevenue > 0 ||
      stats.ticketsSold > 0 ||
      feedbackAnalytics.totalReviews > 0 ||
      upcomingEvents.length > 0,
    [
      feedbackAnalytics.totalReviews,
      stats.ticketsSold,
      stats.totalEvents,
      stats.totalRevenue,
      upcomingEvents.length,
    ],
  );

  return {
    stats,
    revenue,
    ticketSales,
    feedbackAnalytics,
    upcomingEvents,
    loading,
    refreshing,
    error,
    hasAnyAnalytics,
    refresh: () => fetchDashboard('refresh'),
  };
}
