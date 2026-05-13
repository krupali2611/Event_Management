import { httpClient } from '@/api/httpClient';
import type {
  OrganizerDashboardFeedbackAnalyticsResponse,
  OrganizerDashboardRecentPurchasesResponse,
  OrganizerDashboardRevenueResponse,
  OrganizerDashboardStatsResponse,
  OrganizerDashboardTicketSalesResponse,
} from '@/types/organizer-dashboard.types';

export const organizerDashboardService = {
  async getStats(): Promise<OrganizerDashboardStatsResponse> {
    const response = await httpClient.get<OrganizerDashboardStatsResponse>('/organizer/dashboard/stats');
    return response.data;
  },

  async getRevenue(): Promise<OrganizerDashboardRevenueResponse> {
    const response = await httpClient.get<OrganizerDashboardRevenueResponse>('/organizer/dashboard/revenue');
    return response.data;
  },

  async getTicketSales(): Promise<OrganizerDashboardTicketSalesResponse> {
    const response = await httpClient.get<OrganizerDashboardTicketSalesResponse>('/organizer/dashboard/ticket-sales');
    return response.data;
  },

  async getRecentPurchases(): Promise<OrganizerDashboardRecentPurchasesResponse> {
    const response = await httpClient.get<OrganizerDashboardRecentPurchasesResponse>('/organizer/dashboard/recent-purchases');
    return response.data;
  },

  async getFeedbackAnalytics(): Promise<OrganizerDashboardFeedbackAnalyticsResponse> {
    const response = await httpClient.get<OrganizerDashboardFeedbackAnalyticsResponse>('/organizer/feedback/analytics');
    return response.data;
  },
};
