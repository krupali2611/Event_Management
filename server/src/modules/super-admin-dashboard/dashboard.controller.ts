import type { Response } from 'express';
import type { ApiResponse } from '../../types/api';
import type { AuthenticatedRequest } from '../../types/auth.types';
import { sendSuccess } from '../../utils/response';
import {
  getSuperAdminDashboardRevenue,
  getSuperAdminDashboardRoleDistribution,
  getSuperAdminDashboardStats,
  getSuperAdminDashboardTopEvents,
  getSuperAdminDashboardTopOrganizers,
  getSuperAdminDashboardUserGrowth,
  type SuperAdminDashboardRevenueDto,
  type SuperAdminDashboardRoleDistributionDto,
  type SuperAdminDashboardStatsDto,
  type SuperAdminDashboardTopEventsDto,
  type SuperAdminDashboardTopOrganizersDto,
  type SuperAdminDashboardUserGrowthDto,
} from './dashboard.service';

export async function getSuperAdminDashboardStatsController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<SuperAdminDashboardStatsDto>>,
): Promise<void> {
  const stats = await getSuperAdminDashboardStats(request.user!);
  sendSuccess(response, 200, 'Super admin dashboard stats fetched successfully', stats);
}

export async function getSuperAdminDashboardRevenueController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<SuperAdminDashboardRevenueDto>>,
): Promise<void> {
  const revenue = await getSuperAdminDashboardRevenue(request.user!);
  sendSuccess(response, 200, 'Super admin revenue analytics fetched successfully', revenue);
}

export async function getSuperAdminDashboardUserGrowthController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<SuperAdminDashboardUserGrowthDto>>,
): Promise<void> {
  const growth = await getSuperAdminDashboardUserGrowth(request.user!);
  sendSuccess(response, 200, 'Super admin user growth analytics fetched successfully', growth);
}

export async function getSuperAdminDashboardRoleDistributionController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<SuperAdminDashboardRoleDistributionDto>>,
): Promise<void> {
  const distribution = await getSuperAdminDashboardRoleDistribution(request.user!);
  sendSuccess(response, 200, 'Super admin role distribution fetched successfully', distribution);
}

export async function getSuperAdminDashboardTopOrganizersController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<SuperAdminDashboardTopOrganizersDto>>,
): Promise<void> {
  const organizers = await getSuperAdminDashboardTopOrganizers(request.user!);
  sendSuccess(response, 200, 'Super admin top organizers fetched successfully', organizers);
}

export async function getSuperAdminDashboardTopEventsController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<SuperAdminDashboardTopEventsDto>>,
): Promise<void> {
  const events = await getSuperAdminDashboardTopEvents(request.user!);
  sendSuccess(response, 200, 'Super admin top events fetched successfully', events);
}
