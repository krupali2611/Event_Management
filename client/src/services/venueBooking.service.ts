import { httpClient } from '@/api/httpClient';
import type {
  BookingAvailabilityResponse,
  CreateVenueBookingPayload,
  VenueBookingListFilters,
  VenueBookingResponse,
  VenueBookingsResponse,
} from '@/types/venue-booking.types';

export const venueBookingService = {
  async checkAvailability(payload: Pick<CreateVenueBookingPayload, 'venueId' | 'startDate' | 'endDate' | 'eventId'>): Promise<BookingAvailabilityResponse> {
    const response = await httpClient.post<BookingAvailabilityResponse>('/venue-bookings/check-availability', payload);
    return response.data;
  },

  async createBooking(payload: CreateVenueBookingPayload): Promise<VenueBookingResponse> {
    const response = await httpClient.post<VenueBookingResponse>('/venue-bookings', payload);
    return response.data;
  },

  async getBookings(filters: VenueBookingListFilters): Promise<VenueBookingsResponse> {
    const response = await httpClient.get<VenueBookingsResponse>('/venue-bookings', {
      params: {
        page: filters.page,
        limit: filters.limit,
        sort: filters.sort,
        upcomingOnly: filters.upcomingOnly,
        ...(filters.venueId ? { venueId: filters.venueId } : {}),
        ...(filters.startDate ? { startDate: filters.startDate } : {}),
        ...(filters.endDate ? { endDate: filters.endDate } : {}),
      },
    });

    return response.data;
  },
};
