import type { VenueAvailabilityQuery, VenueAvailabilityResult } from '../types/venue.types';
import { checkAvailability } from '../services/booking.service';

export async function checkVenueAvailability(venueId: string, dateRange: VenueAvailabilityQuery): Promise<VenueAvailabilityResult> {
  const availability = await checkAvailability({
    venueId,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });
  return {
    venueId,
    available: availability.available,
    reason: availability.available ? 'Venue is available for the selected date range.' : 'Venue already has a booking in the selected date range.',
  };
}
