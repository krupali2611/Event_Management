import type { ApiResponse, UserRole } from '@/types/api';

export interface AdminDashboardStats {
  totalUsers: number;
  totalOrganizers: number;
  totalEvents: number;
  pendingEvents: number;
  approvedEvents: number;
  totalVenueBookings: number;
}

export interface AdminDashboardMonthlyAnalyticsItem {
  month: string;
  count: number;
}

export interface AdminDashboardMonthlyAnalyticsData {
  months: AdminDashboardMonthlyAnalyticsItem[];
}

export interface AdminDashboardEventStatus {
  approved: number;
  pending: number;
  rejected: number;
  cancelled: number;
}

export interface AdminDashboardRecentEventItem {
  id: string;
  title: string;
  category: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED';
  createdAt: string;
  organizer: {
    id: string;
    name: string;
    email: string;
  };
}

export interface AdminDashboardRecentEventsData {
  events: AdminDashboardRecentEventItem[];
}

export interface AdminDashboardRecentUserItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface AdminDashboardRecentUsersData {
  users: AdminDashboardRecentUserItem[];
}

export type AdminDashboardStatsResponse = ApiResponse<AdminDashboardStats>;
export type AdminDashboardMonthlyAnalyticsResponse = ApiResponse<AdminDashboardMonthlyAnalyticsData>;
export type AdminDashboardEventStatusResponse = ApiResponse<AdminDashboardEventStatus>;
export type AdminDashboardRecentEventsResponse = ApiResponse<AdminDashboardRecentEventsData>;
export type AdminDashboardRecentUsersResponse = ApiResponse<AdminDashboardRecentUsersData>;
