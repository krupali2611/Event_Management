import type { ApiResponse } from '@/types/api';
import type { EventLifecycleStatus, EventStatus, EventVenueSummary } from '@/types/event.types';

export type TicketBookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'used' | 'refunded';
export type TicketPaymentStatus = 'pending' | 'paid' | 'failed' | 'refun_pending' | 'refunded';

export interface TicketEventSummary {
  id: string;
  title: string;
  image: string | null;
  bannerImage: string | null;
  category: string;
  ticketPrice: number;
  attendeeLimit: number;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  status: EventStatus;
  lifecycleStatus: EventLifecycleStatus;
  venue: EventVenueSummary | null;
}

export interface TicketBookingItem {
  id: string;
  eventId: string;
  userId: string;
  quantity: number;
  totalAmount: number;
  bookingStatus: TicketBookingStatus;
  paymentStatus: TicketPaymentStatus;
  ticketNumber: string;
  qrCode: string | null;
  bookedAt: string;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  soldTickets: number;
  remainingSeats: number;
  event: TicketEventSummary;
}

export interface TicketBookingListData {
  bookings: TicketBookingItem[];
}

export interface TicketEventAttendeeItem {
  id: string;
  attendeeName: string;
  attendeeEmail: string;
  quantity: number;
  totalAmount: number;
  bookingStatus: TicketBookingStatus;
  paymentStatus: TicketPaymentStatus;
  bookedAt: string;
  ticketNumber: string;
}

export interface TicketEventAttendeeListData {
  event: {
    id: string;
    title: string;
    attendeeLimit: number;
    soldTickets: number;
    remainingSeats: number;
  };
  attendees: TicketEventAttendeeItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TicketEventStats {
  eventId: string;
  eventTitle: string;
  attendeeLimit: number;
  totalTicketsSold: number;
  remainingSeats: number;
  totalRevenue: number;
  totalBookings: number;
  cancelledBookings: number;
  countedBookings: number;
  confirmedBookings: number;
}

export interface TicketDashboardSummary {
  totalEvents: number;
  totalTicketsSold: number;
  totalRevenue: number;
  upcomingEvents: number;
  soldOutEvents: number;
}

export interface TicketEventAttendeeFilters {
  page: number;
  limit: number;
  search: string;
  bookingStatus: '' | Uppercase<TicketBookingStatus>;
  paymentStatus: '' | Uppercase<TicketPaymentStatus>;
}

export interface BookTicketPayload {
  eventId: string;
  quantity: number;
}

export type TicketBookingResponse = ApiResponse<TicketBookingItem>;
export type TicketBookingsResponse = ApiResponse<TicketBookingListData>;
export type TicketEventAttendeesResponse = ApiResponse<TicketEventAttendeeListData>;
export type TicketEventStatsResponse = ApiResponse<TicketEventStats>;
export type TicketDashboardSummaryResponse = ApiResponse<TicketDashboardSummary>;
