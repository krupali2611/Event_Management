import { httpClient } from '@/api/httpClient';
import type {
  BookTicketPayload,
  TicketBookingResponse,
  TicketBookingsResponse,
  TicketDashboardSummaryResponse,
  TicketEventAttendeeFilters,
  TicketEventAttendeesResponse,
  TicketEventStatsResponse,
} from '@/types/ticket.types';

export const ticketService = {
  async bookTicket(payload: BookTicketPayload): Promise<TicketBookingResponse> {
    const response = await httpClient.post<TicketBookingResponse>('/tickets/book', payload);
    return response.data;
  },

  async getMyTickets(): Promise<TicketBookingsResponse> {
    const response = await httpClient.get<TicketBookingsResponse>('/tickets/my');
    return response.data;
  },

  async getTicketById(id: string): Promise<TicketBookingResponse> {
    const response = await httpClient.get<TicketBookingResponse>(`/tickets/${id}`);
    return response.data;
  },

  async cancelTicket(id: string): Promise<TicketBookingResponse> {
    const response = await httpClient.delete<TicketBookingResponse>(`/tickets/${id}`);
    return response.data;
  },

  async getEventAttendees(eventId: string, filters: TicketEventAttendeeFilters): Promise<TicketEventAttendeesResponse> {
    const response = await httpClient.get<TicketEventAttendeesResponse>(`/tickets/event/${eventId}`, {
      params: {
        page: filters.page,
        limit: filters.limit,
        ...(filters.search ? { search: filters.search } : {}),
        ...(filters.bookingStatus ? { bookingStatus: filters.bookingStatus } : {}),
        ...(filters.paymentStatus ? { paymentStatus: filters.paymentStatus } : {}),
      },
    });
    return response.data;
  },

  async getEventStats(eventId: string): Promise<TicketEventStatsResponse> {
    const response = await httpClient.get<TicketEventStatsResponse>(`/tickets/event/${eventId}/stats`);
    return response.data;
  },

  async getDashboardSummary(): Promise<TicketDashboardSummaryResponse> {
    const response = await httpClient.get<TicketDashboardSummaryResponse>('/tickets/dashboard/summary');
    return response.data;
  },
};
