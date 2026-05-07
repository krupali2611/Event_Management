import { eventService } from '@/services/event.service';
import { venueService } from '@/services/venue.service';
import { venueBookingService } from '@/services/venueBooking.service';
import type { EventListFilters, EventPayload } from '@/types/event.types';
import type { CreateVenueBookingPayload } from '@/types/venue-booking.types';
import type { VenueListFilters } from '@/types/venue.types';

export async function getEvents(filters: EventListFilters) {
  return eventService.getEvents(filters);
}

export async function getEventById(id: string) {
  return eventService.getEventById(id);
}

export async function getPublicEvents(filters: EventListFilters) {
  return eventService.getPublicEvents(filters);
}

export async function getPublicEventById(id: string) {
  return eventService.getPublicEventById(id);
}

export async function getVenues(filters: VenueListFilters) {
  return venueService.getVenues(filters);
}

export async function checkAvailability(payload: Pick<CreateVenueBookingPayload, 'venueId' | 'startDate' | 'endDate' | 'eventId'>) {
  return venueBookingService.checkAvailability(payload);
}

export async function createEvent(payload: EventPayload) {
  return eventService.createEvent(payload);
}
