import type { Response } from 'express';
import type { ApiResponse } from '../../types/api';
import type { AuthenticatedRequest } from '../../types/auth.types';
import { sendSuccess } from '../../utils/response';
import {
  getEventTicketBookings,
  getEventTicketStats,
  getTicketDashboardSummary,
  createTicketBooking,
  cancelTicketBooking,
  getMyTicketBookings,
  getTicketBookingById,
  updateTicketBookingStatus,
  type TicketBookingDto,
  type TicketDashboardSummaryDto,
  type TicketEventAttendeeListData,
  type TicketEventStatsDto,
  type TicketBookingListData,
} from './ticket.service';
import { createTicketBookingBodySchema, ticketBookingIdParamSchema, ticketEventBookingsQuerySchema, ticketEventIdParamSchema, updateTicketStatusBodySchema } from './ticket.validation';

export async function createTicketBookingController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<TicketBookingDto>>,
): Promise<void> {
  const payload = createTicketBookingBodySchema.parse(request.body);
  const booking = await createTicketBooking(payload, request.user!);
  sendSuccess(response, 201, 'Ticket booked successfully', booking);
}

export async function getMyTicketBookingsController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<TicketBookingListData>>,
): Promise<void> {
  const bookings = await getMyTicketBookings(request.user!);
  sendSuccess(response, 200, 'Ticket bookings fetched successfully', bookings);
}

export async function getTicketBookingController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<TicketBookingDto>>,
): Promise<void> {
  const { id } = ticketBookingIdParamSchema.parse(request.params);
  const booking = await getTicketBookingById(id, request.user!);
  sendSuccess(response, 200, 'Ticket booking fetched successfully', booking);
}

export async function cancelTicketBookingController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<TicketBookingDto>>,
): Promise<void> {
  const { id } = ticketBookingIdParamSchema.parse(request.params);
  const booking = await cancelTicketBooking(id, request.user!);
  sendSuccess(response, 200, 'Ticket booking cancelled successfully', booking);
}

export async function getEventTicketBookingsController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<TicketEventAttendeeListData>>,
): Promise<void> {
  const { eventId } = ticketEventIdParamSchema.parse(request.params);
  const query = ticketEventBookingsQuerySchema.parse(request.query);
  const bookings = await getEventTicketBookings(eventId, query, request.user!);
  sendSuccess(response, 200, 'Event attendee list fetched successfully', bookings);
}

export async function getEventTicketStatsController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<TicketEventStatsDto>>,
): Promise<void> {
  const { eventId } = ticketEventIdParamSchema.parse(request.params);
  const stats = await getEventTicketStats(eventId, request.user!);
  sendSuccess(response, 200, 'Event ticket stats fetched successfully', stats);
}

export async function getTicketDashboardSummaryController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<TicketDashboardSummaryDto>>,
): Promise<void> {
  const summary = await getTicketDashboardSummary(request.user!);
  sendSuccess(response, 200, 'Ticket dashboard summary fetched successfully', summary);
}

export async function updateTicketBookingStatusController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<TicketBookingDto>>,
): Promise<void> {
  const { id } = ticketBookingIdParamSchema.parse(request.params);
  const payload = updateTicketStatusBodySchema.parse(request.body);
  const booking = await updateTicketBookingStatus(id, payload.status, request.user!);
  sendSuccess(response, 200, 'Ticket status updated successfully', booking);
}
