import type { Response } from 'express';
import {
  cancelBooking,
  checkAvailability,
  createBooking,
  getBookingById,
  getBookings,
} from '../services/booking.service';
import type { ApiResponse } from '../types/api';
import type { AuthenticatedRequest } from '../types/auth.types';
import type {
  BookingAvailabilityResult,
  PaginatedVenueBookingsData,
  VenueBookingDto,
} from '../types/venue-booking.types';
import {
  checkAvailabilityBodySchema,
  createVenueBookingBodySchema,
  venueBookingIdParamSchema,
  venueBookingListQuerySchema,
} from '../validations/venue-booking.validation';
import { sendSuccess } from '../utils/response';

export async function createVenueBookingController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<VenueBookingDto>>,
): Promise<void> {
  const payload = createVenueBookingBodySchema.parse(request.body);
  const booking = await createBooking({
    ...payload,
    createdById: request.user?.id,
  });

  sendSuccess(response, 201, 'Venue booking created successfully', booking);
}

export async function checkVenueBookingAvailabilityController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<BookingAvailabilityResult>>,
): Promise<void> {
  const payload = checkAvailabilityBodySchema.parse(request.body);
  const availability = await checkAvailability(payload);
  sendSuccess(response, 200, 'Venue booking availability checked successfully', availability);
}

export async function getVenueBookingsController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<PaginatedVenueBookingsData>>,
): Promise<void> {
  const query = venueBookingListQuerySchema.parse(request.query);
  const bookings = await getBookings(query);
  sendSuccess(response, 200, 'Venue bookings fetched successfully', bookings);
}

export async function getVenueBookingController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<VenueBookingDto>>,
): Promise<void> {
  const { id } = venueBookingIdParamSchema.parse(request.params);
  const booking = await getBookingById(id);
  sendSuccess(response, 200, 'Venue booking fetched successfully', booking);
}

export async function cancelVenueBookingController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<VenueBookingDto>>,
): Promise<void> {
  const { id } = venueBookingIdParamSchema.parse(request.params);
  const booking = await cancelBooking(id);
  sendSuccess(response, 200, 'Venue booking cancelled successfully', booking);
}
