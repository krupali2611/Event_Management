import type { VENUE_BOOKING_STATUS } from '@prisma/client';

export interface VenueBookingListItemDto {
  id: string;
  venueName: string;
  date: string;
  time: string;
  eventName: string;
  status: Lowercase<VENUE_BOOKING_STATUS>;
  organizerName?: string;
}

export interface VenueBookingDto {
  id: string;
  venueId: string;
  startDate: Date;
  endDate: Date;
  startTime: string | null;
  endTime: string | null;
  status: Lowercase<VENUE_BOOKING_STATUS>;
  eventId: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  venue?: {
    id: string;
    name: string;
    location: string;
    isActive: boolean;
  };
}

export interface BookingAvailabilityResult {
  available: boolean;
  conflictBookingId?: string;
}

export interface CheckAvailabilityInput {
  venueId: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  excludeBookingId?: string;
  eventId?: string;
}

export interface CreateVenueBookingInput {
  venueId: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  eventId?: string | null;
  createdById?: string;
}

export interface VenueBookingListQuery {
  venueId?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  limit: number;
  sort: 'asc' | 'desc';
  upcomingOnly?: boolean;
}

export interface PaginatedVenueBookingsData {
  bookings: VenueBookingListItemDto[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
