import type { Response } from 'express';
import type { ApiResponse } from '../../types/api';
import type { AuthenticatedRequest } from '../../types/auth.types';
import { sendSuccess } from '../../utils/response';
import {
  getAdminDashboardEventStatus,
  getAdminDashboardEventsAnalytics,
  getAdminDashboardRecentEvents,
  getAdminDashboardRecentUsers,
  getAdminDashboardStats,
  getAdminDashboardUserAnalytics,
  type AdminDashboardEventStatusDto,
  type AdminDashboardMonthlyAnalyticsDto,
  type AdminDashboardRecentEventsDto,
  type AdminDashboardRecentUsersDto,
  type AdminDashboardStatsDto,
} from './dashboard.service';

export async function getAdminDashboardStatsController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<AdminDashboardStatsDto>>,
): Promise<void> {
  const stats = await getAdminDashboardStats(request.user!);
  sendSuccess(response, 200, 'Admin dashboard stats fetched successfully', stats);
}

export async function getAdminDashboardEventsAnalyticsController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<AdminDashboardMonthlyAnalyticsDto>>,
): Promise<void> {
  const analytics = await getAdminDashboardEventsAnalytics(request.user!);
  sendSuccess(response, 200, 'Admin event analytics fetched successfully', analytics);
}

export async function getAdminDashboardUserAnalyticsController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<AdminDashboardMonthlyAnalyticsDto>>,
): Promise<void> {
  const analytics = await getAdminDashboardUserAnalytics(request.user!);
  sendSuccess(response, 200, 'Admin user analytics fetched successfully', analytics);
}

export async function getAdminDashboardEventStatusController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<AdminDashboardEventStatusDto>>,
): Promise<void> {
  const distribution = await getAdminDashboardEventStatus(request.user!);
  sendSuccess(response, 200, 'Admin event status analytics fetched successfully', distribution);
}

export async function getAdminDashboardRecentEventsController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<AdminDashboardRecentEventsDto>>,
): Promise<void> {
  const events = await getAdminDashboardRecentEvents(request.user!);
  sendSuccess(response, 200, 'Admin recent events fetched successfully', events);
}

export async function getAdminDashboardRecentUsersController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<AdminDashboardRecentUsersDto>>,
): Promise<void> {
  const users = await getAdminDashboardRecentUsers(request.user!);
  sendSuccess(response, 200, 'Admin recent users fetched successfully', users);
}
