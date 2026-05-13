import { httpClient } from '@/api/httpClient';
import type {
  SuperAdminDashboardRevenueResponse,
  SuperAdminDashboardRoleDistributionResponse,
  SuperAdminDashboardStatsResponse,
  SuperAdminDashboardTopEventsResponse,
  SuperAdminDashboardTopOrganizersResponse,
  SuperAdminDashboardUserGrowthResponse,
} from '@/types/super-admin-dashboard.types';

export const superAdminDashboardService = {
  async getStats(): Promise<SuperAdminDashboardStatsResponse> {
    const response = await httpClient.get<SuperAdminDashboardStatsResponse>('/super-admin/dashboard/stats');
    return response.data;
  },

  async getRevenue(): Promise<SuperAdminDashboardRevenueResponse> {
    const response = await httpClient.get<SuperAdminDashboardRevenueResponse>('/super-admin/dashboard/revenue');
    return response.data;
  },

  async getUserGrowth(): Promise<SuperAdminDashboardUserGrowthResponse> {
    const response = await httpClient.get<SuperAdminDashboardUserGrowthResponse>('/super-admin/dashboard/user-growth');
    return response.data;
  },

  async getRoleDistribution(): Promise<SuperAdminDashboardRoleDistributionResponse> {
    const response = await httpClient.get<SuperAdminDashboardRoleDistributionResponse>('/super-admin/dashboard/role-distribution');
    return response.data;
  },

  async getTopOrganizers(): Promise<SuperAdminDashboardTopOrganizersResponse> {
    const response = await httpClient.get<SuperAdminDashboardTopOrganizersResponse>('/super-admin/dashboard/top-organizers');
    return response.data;
  },

  async getTopEvents(): Promise<SuperAdminDashboardTopEventsResponse> {
    const response = await httpClient.get<SuperAdminDashboardTopEventsResponse>('/super-admin/dashboard/top-events');
    return response.data;
  },
};
