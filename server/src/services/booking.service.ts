import type { Prisma, Venue, VenueBooking } from '@prisma/client';
import { VENUE_BOOKING_STATUS } from '@prisma/client';
import { prisma } from '../config/prisma';
import type {
  BookingAvailabilityResult,
  CheckAvailabilityInput,
  CreateVenueBookingInput,
  PaginatedVenueBookingsData,
  VenueBookingDto,
  VenueBookingListQuery,
} from '../types/venue-booking.types';
import { validateBookingDateRange } from '../utils/dateUtils';
import { AppError } from '../utils/response';

function getVenueDelegate() {
  if (!('venue' in prisma) || !prisma.venue) {
    throw new AppError('Venue model is not available in the Prisma client. Run Prisma generate and restart the server.', 500);
  }

  return prisma.venue;
}

function getVenueBookingDelegate() {
  if (!('venueBooking' in prisma) || !prisma.venueBooking) {
    throw new AppError('VenueBooking model is not available in the Prisma client. Run Prisma generate and restart the server.', 500);
  }

  return prisma.venueBooking;
}

async function ensureVenueExists(venueId: string): Promise<Venue> {
  const venue = await getVenueDelegate().findUnique({ where: { id: venueId } });

  if (!venue) {
    throw new AppError('Venue not found', 404);
  }

  return venue;
}

async function ensureBookingExists(id: string): Promise<VenueBooking> {
  const booking = await getVenueBookingDelegate().findUnique({ where: { id } });

  if (!booking) {
    throw new AppError('Venue booking not found', 404);
  }

  return booking;
}

function toVenueBookingDto(
  booking: VenueBooking & { venue?: { id: string; name: string; location: string; isActive: boolean } | null },
): VenueBookingDto {
  return {
    id: booking.id,
    venueId: booking.venueId,
    startDate: booking.startDate,
    endDate: booking.endDate,
    startTime: booking.startTime,
    endTime: booking.endTime,
    status: booking.status.toLowerCase() as VenueBookingDto['status'],
    eventId: booking.eventId,
    createdBy: booking.createdById,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
    ...(booking.venue
      ? {
          venue: {
            id: booking.venue.id,
            name: booking.venue.name,
            location: booking.venue.location,
            isActive: booking.venue.isActive,
          },
        }
      : {}),
  };
}

export async function checkAvailability(input: CheckAvailabilityInput): Promise<BookingAvailabilityResult> {
  await ensureVenueExists(input.venueId);
  const { startDate, endDate } = validateBookingDateRange(input.startDate, input.endDate);

  const conflictingBooking = await getVenueBookingDelegate().findFirst({
    where: {
      venueId: input.venueId,
      status: VENUE_BOOKING_STATUS.BOOKED,
      startDate: { lte: endDate },
      endDate: { gte: startDate },
      ...(input.excludeBookingId ? { NOT: { id: input.excludeBookingId } } : {}),
    },
    select: { id: true },
  });

  return {
    available: !conflictingBooking,
    ...(conflictingBooking ? { conflictBookingId: conflictingBooking.id } : {}),
  };
}

export async function createBooking(payload: CreateVenueBookingInput): Promise<VenueBookingDto> {
  const venue = await ensureVenueExists(payload.venueId);

  if (!venue.isActive) {
    throw new AppError('Inactive venues cannot be booked', 400);
  }

  const { startDate, endDate } = validateBookingDateRange(payload.startDate, payload.endDate);
  const availability = await checkAvailability({
    venueId: payload.venueId,
    startDate: payload.startDate,
    endDate: payload.endDate,
  });

  if (!availability.available) {
    throw new AppError('Venue is not available for the selected date range', 409);
  }

  const existingExactBooking = await getVenueBookingDelegate().findFirst({
    where: {
      venueId: payload.venueId,
      startDate,
      endDate,
      startTime: payload.startTime ?? null,
      endTime: payload.endTime ?? null,
      status: VENUE_BOOKING_STATUS.BOOKED,
    },
    select: { id: true },
  });

  if (existingExactBooking) {
    throw new AppError('An identical booking already exists for this venue', 409);
  }

  const booking = await getVenueBookingDelegate().create({
    data: {
      venueId: payload.venueId,
      startDate,
      endDate,
      startTime: payload.startTime ?? null,
      endTime: payload.endTime ?? null,
      status: VENUE_BOOKING_STATUS.BOOKED,
      eventId: payload.eventId ?? null,
      createdById: payload.createdById,
    },
    include: {
      venue: {
        select: {
          id: true,
          name: true,
          location: true,
          isActive: true,
        },
      },
    },
  });

  return toVenueBookingDto(booking);
}

export async function getBookings(query: VenueBookingListQuery): Promise<PaginatedVenueBookingsData> {
  const whereClause: Prisma.VenueBookingWhereInput = {
    ...(query.venueId ? { venueId: query.venueId } : {}),
    ...(query.upcomingOnly
      ? {
          endDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        }
      : {}),
  };

  if (query.startDate || query.endDate) {
    const rangeStart = query.startDate ? new Date(query.startDate) : new Date('1970-01-01T00:00:00.000Z');
    const rangeEnd = query.endDate ? new Date(query.endDate) : new Date('9999-12-31T23:59:59.999Z');
    rangeStart.setHours(0, 0, 0, 0);
    rangeEnd.setHours(23, 59, 59, 999);

    whereClause.startDate = { lte: rangeEnd };
    whereClause.endDate = { gte: rangeStart };
  }

  const skip = (query.page - 1) * query.limit;
  const [items, totalItems] = await Promise.all([
    getVenueBookingDelegate().findMany({
      where: whereClause,
      include: {
        venue: {
          select: {
            id: true,
            name: true,
            location: true,
            isActive: true,
          },
        },
      },
      orderBy: [{ startDate: query.sort }, { createdAt: 'desc' }],
      skip,
      take: query.limit,
    }),
    getVenueBookingDelegate().count({ where: whereClause }),
  ]);

  return {
    bookings: items.map(toVenueBookingDto),
    pagination: {
      total: totalItems,
      page: query.page,
      limit: query.limit,
      totalPages: Math.max(1, Math.ceil(totalItems / query.limit)),
    },
  };
}

export async function getBookingById(id: string): Promise<VenueBookingDto> {
  const booking = await getVenueBookingDelegate().findUnique({
    where: { id },
    include: {
      venue: {
        select: {
          id: true,
          name: true,
          location: true,
          isActive: true,
        },
      },
    },
  });

  if (!booking) {
    throw new AppError('Venue booking not found', 404);
  }

  return toVenueBookingDto(booking);
}

export async function cancelBooking(id: string): Promise<VenueBookingDto> {
  const existingBooking = await ensureBookingExists(id);

  if (existingBooking.status === VENUE_BOOKING_STATUS.CANCELLED) {
    throw new AppError('Venue booking is already cancelled', 400);
  }

  const booking = await getVenueBookingDelegate().update({
    where: { id },
    data: { status: VENUE_BOOKING_STATUS.CANCELLED },
    include: {
      venue: {
        select: {
          id: true,
          name: true,
          location: true,
          isActive: true,
        },
      },
    },
  });

  return toVenueBookingDto(booking);
}
