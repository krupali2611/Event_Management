import type { ApiResponse } from '@/types/api';
import type { FeedbackItem, OrganizerFeedbackAnalyticsEvent } from '@/types/feedback.types';

export interface OrganizerDashboardStats {
  totalEvents: number;
  totalRevenue: number;
  ticketsSold: number;
  upcomingEvents: number;
  totalAttendees: number;
}

export interface OrganizerDashboardRevenueItem {
  month: string;
  revenue: number;
}

export interface OrganizerDashboardRevenueData {
  months: OrganizerDashboardRevenueItem[];
}

export interface OrganizerDashboardTicketSalesItem {
  eventId: string;
  eventTitle: string;
  ticketsSold: number;
  revenue: number;
}

export interface OrganizerDashboardTicketSalesData {
  events: OrganizerDashboardTicketSalesItem[];
}

export interface OrganizerDashboardRecentPurchaseItem {
  id: string;
  ticketNumber: string;
  attendee: {
    id: string;
    name: string;
    email: string;
  };
  event: {
    id: string;
    title: string;
  };
  quantity: number;
  totalAmount: number;
  bookingStatus: 'confirmed' | 'used';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refun_pending' | 'refunded';
  bookedAt: string;
}

export interface OrganizerDashboardRecentPurchasesData {
  purchases: OrganizerDashboardRecentPurchaseItem[];
}

export interface OrganizerDashboardFeedbackAnalyticsData {
  averageRating: number;
  totalReviews: number;
  highestRatedEvents: OrganizerFeedbackAnalyticsEvent[];
  lowestRatedEvents: OrganizerFeedbackAnalyticsEvent[];
  recentReviews: FeedbackItem[];
}

export type OrganizerDashboardStatsResponse = ApiResponse<OrganizerDashboardStats>;
export type OrganizerDashboardRevenueResponse = ApiResponse<OrganizerDashboardRevenueData>;
export type OrganizerDashboardTicketSalesResponse = ApiResponse<OrganizerDashboardTicketSalesData>;
export type OrganizerDashboardRecentPurchasesResponse = ApiResponse<OrganizerDashboardRecentPurchasesData>;
export type OrganizerDashboardFeedbackAnalyticsResponse = ApiResponse<OrganizerDashboardFeedbackAnalyticsData>;
