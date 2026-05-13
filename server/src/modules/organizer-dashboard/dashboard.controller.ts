import type { Response } from 'express';
import type { ApiResponse } from '../../types/api';
import type { AuthenticatedRequest } from '../../types/auth.types';
import { sendSuccess } from '../../utils/response';
import {
  getOrganizerDashboardRecentPurchases,
  getOrganizerDashboardRevenue,
  getOrganizerDashboardStats,
  getOrganizerDashboardTicketSales,
  type OrganizerDashboardRecentPurchasesDto,
  type OrganizerDashboardRevenueDto,
  type OrganizerDashboardStatsDto,
  type OrganizerDashboardTicketSalesDto,
} from './dashboard.service';

export async function getOrganizerDashboardStatsController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<OrganizerDashboardStatsDto>>,
): Promise<void> {
  const stats = await getOrganizerDashboardStats(request.user!);
  sendSuccess(response, 200, 'Organizer dashboard stats fetched successfully', stats);
}

export async function getOrganizerDashboardRevenueController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<OrganizerDashboardRevenueDto>>,
): Promise<void> {
  const revenue = await getOrganizerDashboardRevenue(request.user!);
  sendSuccess(response, 200, 'Organizer dashboard revenue fetched successfully', revenue);
}

export async function getOrganizerDashboardTicketSalesController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<OrganizerDashboardTicketSalesDto>>,
): Promise<void> {
  const ticketSales = await getOrganizerDashboardTicketSales(request.user!);
  sendSuccess(response, 200, 'Organizer dashboard ticket sales fetched successfully', ticketSales);
}

export async function getOrganizerDashboardRecentPurchasesController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<OrganizerDashboardRecentPurchasesDto>>,
): Promise<void> {
  const purchases = await getOrganizerDashboardRecentPurchases(request.user!);
  sendSuccess(response, 200, 'Organizer dashboard recent purchases fetched successfully', purchases);
}
