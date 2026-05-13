import type { ApiResponse } from '@/types/api';

export interface SuperAdminDashboardStats {
  totalPlatformRevenue: number;
  totalUsers: number;
  totalAdmins: number;
  totalOrganizers: number;
  totalEvents: number;
  totalTicketsSold: number;
}

export interface SuperAdminDashboardRevenueItem {
  month: string;
  revenue: number;
}

export interface SuperAdminDashboardRevenueData {
  months: SuperAdminDashboardRevenueItem[];
}

export interface SuperAdminDashboardUserGrowthItem {
  month: string;
  count: number;
}

export interface SuperAdminDashboardUserGrowthData {
  months: SuperAdminDashboardUserGrowthItem[];
}

export interface SuperAdminDashboardRoleDistribution {
  admins: number;
  organizers: number;
  attendees: number;
}

export interface SuperAdminDashboardTopOrganizerItem {
  organizerId: string;
  organizerName: string;
  organizerEmail: string;
  revenue: number;
  ticketsSold: number;
  eventsCount: number;
}

export interface SuperAdminDashboardTopOrganizersData {
  organizers: SuperAdminDashboardTopOrganizerItem[];
}

export interface SuperAdminDashboardTopEventItem {
  eventId: string;
  eventTitle: string;
  organizerName: string;
  revenue: number;
  ticketsSold: number;
}

export interface SuperAdminDashboardTopEventsData {
  events: SuperAdminDashboardTopEventItem[];
}

export type SuperAdminDashboardStatsResponse = ApiResponse<SuperAdminDashboardStats>;
export type SuperAdminDashboardRevenueResponse = ApiResponse<SuperAdminDashboardRevenueData>;
export type SuperAdminDashboardUserGrowthResponse = ApiResponse<SuperAdminDashboardUserGrowthData>;
export type SuperAdminDashboardRoleDistributionResponse = ApiResponse<SuperAdminDashboardRoleDistribution>;
export type SuperAdminDashboardTopOrganizersResponse = ApiResponse<SuperAdminDashboardTopOrganizersData>;
export type SuperAdminDashboardTopEventsResponse = ApiResponse<SuperAdminDashboardTopEventsData>;
