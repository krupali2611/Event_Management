import type { ApiResponse } from '@/types/api';

export type VenueBookingStatus = 'booked' | 'cancelled';

export interface VenueBookingVenueSummary {
  id: string;
  name: string;
  location: string;
  isActive: boolean;
}

export interface VenueBooking {
  id: string;
  venueId: string;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  status: VenueBookingStatus;
  eventId: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  venue?: VenueBookingVenueSummary;
}

export interface BookingAvailability {
  available: boolean;
  conflictBookingId?: string;
}

export interface VenueBookingListFilters {
  venueId: string;
  startDate: string;
  endDate: string;
  upcomingOnly: boolean;
  sort: 'asc' | 'desc';
  page: number;
  limit: number;
}

export interface VenueBookingListData {
  bookings: VenueBooking[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateVenueBookingPayload {
  venueId: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  eventId?: string | null;
}

export type BookingAvailabilityResponse = ApiResponse<BookingAvailability>;
export type VenueBookingResponse = ApiResponse<VenueBooking>;
export type VenueBookingsResponse = ApiResponse<VenueBookingListData>;
