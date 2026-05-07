import { cancelBookingsForEvent, cancelBooking, checkAvailability, createBooking } from '../services/booking.service';
import type { BookingAvailabilityResult, VenueBookingDto } from '../types/venue-booking.types';

interface ReserveVenuePayload {
  venueId: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  eventId?: string;
  createdById?: string;
}

interface UpdateVenueReservationPayload extends ReserveVenuePayload {
  existingBookingId: string;
}

export const bookingApiClient = {
  async checkVenueAvailability(input: {
    venueId: string;
    startDate: string;
    endDate: string;
    excludeBookingId?: string;
  }): Promise<BookingAvailabilityResult> {
    return checkAvailability(input);
  },

  async reserveVenue(payload: ReserveVenuePayload): Promise<VenueBookingDto> {
    return createBooking(payload);
  },

  async updateVenueReservation(payload: UpdateVenueReservationPayload): Promise<VenueBookingDto> {
    await cancelBooking(payload.existingBookingId);
    return createBooking({
      venueId: payload.venueId,
      startDate: payload.startDate,
      endDate: payload.endDate,
      startTime: payload.startTime,
      endTime: payload.endTime,
      eventId: payload.eventId,
      createdById: payload.createdById,
    });
  },

  async cancelEventVenueReservation(eventId: string): Promise<void> {
    await cancelBookingsForEvent(eventId);
  },
};
