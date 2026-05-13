import { httpClient } from '@/api/httpClient';
import type {
  AdminDashboardEventStatusResponse,
  AdminDashboardMonthlyAnalyticsResponse,
  AdminDashboardRecentEventsResponse,
  AdminDashboardRecentUsersResponse,
  AdminDashboardStatsResponse,
} from '@/types/admin-dashboard.types';

export const adminDashboardService = {
  async getStats(): Promise<AdminDashboardStatsResponse> {
    const response = await httpClient.get<AdminDashboardStatsResponse>('/admin/dashboard/stats');
    return response.data;
  },

  async getEventsAnalytics(): Promise<AdminDashboardMonthlyAnalyticsResponse> {
    const response = await httpClient.get<AdminDashboardMonthlyAnalyticsResponse>('/admin/dashboard/events-analytics');
    return response.data;
  },

  async getUserAnalytics(): Promise<AdminDashboardMonthlyAnalyticsResponse> {
    const response = await httpClient.get<AdminDashboardMonthlyAnalyticsResponse>('/admin/dashboard/user-analytics');
    return response.data;
  },

  async getEventStatus(): Promise<AdminDashboardEventStatusResponse> {
    const response = await httpClient.get<AdminDashboardEventStatusResponse>('/admin/dashboard/event-status');
    return response.data;
  },

  async getRecentEvents(): Promise<AdminDashboardRecentEventsResponse> {
    const response = await httpClient.get<AdminDashboardRecentEventsResponse>('/admin/dashboard/recent-events');
    return response.data;
  },

  async getRecentUsers(): Promise<AdminDashboardRecentUsersResponse> {
    const response = await httpClient.get<AdminDashboardRecentUsersResponse>('/admin/dashboard/recent-users');
    return response.data;
  },
};
