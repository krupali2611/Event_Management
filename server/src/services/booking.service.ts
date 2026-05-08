import { Prisma, type PrismaClient, type Venue, type VenueBooking } from '@prisma/client';
import { VENUE_BOOKING_STATUS } from '@prisma/client';
import { prisma } from '../config/prisma';
import type { AuthenticatedUser } from '../types/auth.types';
import type {
  BookingAvailabilityResult,
  CheckAvailabilityInput,
  CreateVenueBookingInput,
  PaginatedVenueBookingsData,
  VenueBookingDto,
  VenueBookingListItemDto,
  VenueBookingListQuery,
} from '../types/venue-booking.types';
import { dateTimeRangesOverlap, resolveDateTimeBoundary, validateBookingDateRange } from '../utils/dateUtils';
import { AppError } from '../utils/response';

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

type BookingSchedule = {
  startDate: Date;
  endDate: Date;
  startTime?: string | null;
  endTime?: string | null;
};

type VenueBookingVenueRecord = Pick<
  Venue,
  'id' | 'name' | 'location' | 'address' | 'capacity' | 'description' | 'image' | 'amenities' | 'isActive' | 'createdById' | 'createdAt' | 'updatedAt'
>;

function getVenueDelegate(executor: PrismaExecutor = prisma) {
  if (!('venue' in executor) || !executor.venue) {
    throw new AppError('Venue model is not available in the Prisma client. Run Prisma generate and restart the server.', 500);
  }

  return executor.venue;
}

function getVenueBookingDelegate(executor: PrismaExecutor = prisma) {
  if (!('venueBooking' in executor) || !executor.venueBooking) {
    throw new AppError('VenueBooking model is not available in the Prisma client. Run Prisma generate and restart the server.', 500);
  }

  return executor.venueBooking;
}

function getEventDelegate(executor: PrismaExecutor = prisma) {
  if (!('event' in executor) || !executor.event) {
    throw new AppError('Event model is not available in the Prisma client. Run Prisma generate and restart the server.', 500);
  }

  return executor.event;
}

async function ensureVenueExists(venueId: string, executor: PrismaExecutor = prisma): Promise<VenueBookingVenueRecord> {
  const venue = await getVenueDelegate(executor).findUnique({
    where: { id: venueId },
    // Keep this select explicit so environments that have not applied the Cloudinary venue migration
    // do not implicitly query the new imagePublicId column.
    select: {
      id: true,
      name: true,
      location: true,
      address: true,
      capacity: true,
      description: true,
      image: true,
      amenities: true,
      isActive: true,
      createdById: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!venue) {
    throw new AppError('Venue not found', 404);
  }

  return venue;
}

async function ensureBookingExists(id: string, executor: PrismaExecutor = prisma): Promise<VenueBooking> {
  const booking = await getVenueBookingDelegate(executor).findUnique({ where: { id } });

  if (!booking) {
    throw new AppError('Venue booking not found', 404);
  }

  return booking;
}

function getScheduleStartAt(schedule: BookingSchedule): Date {
  return resolveDateTimeBoundary(schedule.startDate, schedule.startTime, false);
}

function getScheduleEndAt(schedule: BookingSchedule): Date {
  return resolveDateTimeBoundary(schedule.endDate, schedule.endTime, true);
}

function schedulesOverlap(left: BookingSchedule, right: BookingSchedule): boolean {
  return dateTimeRangesOverlap(getScheduleStartAt(left), getScheduleEndAt(left), getScheduleStartAt(right), getScheduleEndAt(right));
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

function formatBookingDate(startDate: Date, endDate: Date): string {
  const formatter = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const start = formatter.format(startDate);
  const end = formatter.format(endDate);

  return start === end ? start : `${start} - ${end}`;
}

function formatBookingTime(startTime: string | null, endTime: string | null): string {
  if (!startTime && !endTime) {
    return 'Flexible';
  }

  return `${startTime ?? '--:--'} - ${endTime ?? '--:--'}`;
}

function toVenueBookingListItemDto(
  booking: VenueBooking & {
    venue: { name: string };
    createdBy?: { name: string } | null;
  },
  eventNameById: Map<string, string>,
  includeOrganizerName: boolean,
): VenueBookingListItemDto {
  return {
    id: booking.id,
    venueName: booking.venue.name,
    date: formatBookingDate(booking.startDate, booking.endDate),
    time: formatBookingTime(booking.startTime, booking.endTime),
    eventName: booking.eventId ? (eventNameById.get(booking.eventId) ?? 'Unlinked event') : 'Unlinked event',
    status: booking.status.toLowerCase() as VenueBookingListItemDto['status'],
    ...(includeOrganizerName ? { organizerName: booking.createdBy?.name ?? 'Unknown organizer' } : {}),
  };
}

function canManageAllBookings(user: AuthenticatedUser): boolean {
  return user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
}

export async function checkAvailability(input: CheckAvailabilityInput): Promise<BookingAvailabilityResult> {
  await ensureVenueExists(input.venueId);
  return checkAvailabilityInTransaction(prisma, input);
}

export async function checkAvailabilityInTransaction(
  executor: PrismaExecutor,
  input: CheckAvailabilityInput,
): Promise<BookingAvailabilityResult> {
  const { startDate, endDate } = validateBookingDateRange(input.startDate, input.endDate);
  const conflictingEvents = await getEventDelegate(executor).findMany({
    where: {
      venueId: input.venueId,
      status: { not: 'CANCELLED' },
      startDate: { lte: endDate },
      endDate: { gte: startDate },
      ...(input.eventId ? { NOT: { id: input.eventId } } : {}),
    },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      startTime: true,
      endTime: true,
    },
  });

  const conflictingEvent = conflictingEvents.find((event) =>
    schedulesOverlap(
      {
        startDate: event.startDate,
        endDate: event.endDate,
        startTime: event.startTime,
        endTime: event.endTime,
      },
      {
        startDate,
        endDate,
        startTime: input.startTime ?? null,
        endTime: input.endTime ?? null,
      },
    ),
  );

  if (conflictingEvent) {
    return {
      available: false,
    };
  }

  const conflictingBookings = await getVenueBookingDelegate(executor).findMany({
    where: {
      venueId: input.venueId,
      status: VENUE_BOOKING_STATUS.BOOKED,
      startDate: { lte: endDate },
      endDate: { gte: startDate },
      ...(input.excludeBookingId || input.eventId
        ? {
            NOT: {
              ...(input.excludeBookingId ? { id: input.excludeBookingId } : {}),
              ...(input.eventId ? { eventId: input.eventId } : {}),
            },
          }
        : {}),
    },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      startTime: true,
      endTime: true,
    },
  });

  const conflictingBooking = conflictingBookings.find((booking) =>
    schedulesOverlap(
      {
        startDate: booking.startDate,
        endDate: booking.endDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
      },
      {
        startDate,
        endDate,
        startTime: input.startTime ?? null,
        endTime: input.endTime ?? null,
      },
    ),
  );

  if (!conflictingBooking) {
    return {
      available: true,
    };
  }

  return {
    available: false,
    conflictBookingId: conflictingBooking.id,
  };
}

export async function createBooking(payload: CreateVenueBookingInput): Promise<VenueBookingDto> {
  return createBookingInTransaction(prisma, payload);
}

export async function createBookingInTransaction(
  executor: PrismaExecutor,
  payload: CreateVenueBookingInput,
): Promise<VenueBookingDto> {
  const venue = await ensureVenueExists(payload.venueId, executor);

  if (!venue.isActive) {
    throw new AppError('Inactive venues cannot be booked', 400);
  }

  const { startDate, endDate } = validateBookingDateRange(payload.startDate, payload.endDate);
  const availability = await checkAvailabilityInTransaction(executor, {
    venueId: payload.venueId,
    startDate: payload.startDate,
    endDate: payload.endDate,
    startTime: payload.startTime,
    endTime: payload.endTime,
    excludeBookingId: undefined,
    eventId: payload.eventId ?? undefined,
  });

  if (!availability.available) {
    throw new AppError('Venue is not available for the selected date range', 409);
  }

  const existingExactBooking = await getVenueBookingDelegate(executor).findFirst({
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

  const booking = await getVenueBookingDelegate(executor).create({
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

export async function getBookings(query: VenueBookingListQuery, user: AuthenticatedUser): Promise<PaginatedVenueBookingsData> {
  const whereClause: Prisma.VenueBookingWhereInput = {
    ...(query.venueId ? { venueId: query.venueId } : {}),
    ...(query.upcomingOnly
      ? {
          endDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        }
      : {}),
    ...(canManageAllBookings(user) ? {} : { createdById: user.id }),
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
  const includeOrganizerName = canManageAllBookings(user);
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
        createdBy: includeOrganizerName
          ? {
              select: {
                name: true,
              },
            }
          : false,
      },
      orderBy: [{ startDate: query.sort }, { createdAt: 'desc' }],
      skip,
      take: query.limit,
    }),
    getVenueBookingDelegate().count({ where: whereClause }),
  ]);

  const eventIds = [...new Set(items.map((booking) => booking.eventId).filter((eventId): eventId is string => Boolean(eventId)))];
  const relatedEvents = eventIds.length
    ? await getEventDelegate().findMany({
        where: { id: { in: eventIds } },
        select: {
          id: true,
          title: true,
        },
      })
    : [];
  const eventNameById = new Map(relatedEvents.map((event) => [event.id, event.title]));

  return {
    bookings: items.map((booking) => toVenueBookingListItemDto(booking, eventNameById, includeOrganizerName)),
    pagination: {
      total: totalItems,
      page: query.page,
      limit: query.limit,
      totalPages: Math.max(1, Math.ceil(totalItems / query.limit)),
    },
  };
}

export async function getBookingById(id: string, user: AuthenticatedUser): Promise<VenueBookingDto> {
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

  if (!canManageAllBookings(user) && booking.createdById !== user.id) {
    throw new AppError('You do not have permission to access this venue booking', 403);
  }

  return toVenueBookingDto(booking);
}

export async function cancelBooking(id: string, user?: AuthenticatedUser): Promise<VenueBookingDto> {
  return cancelBookingInTransaction(prisma, id, user);
}

export async function cancelBookingInTransaction(
  executor: PrismaExecutor,
  id: string,
  user?: AuthenticatedUser,
): Promise<VenueBookingDto> {
  const existingBooking = await ensureBookingExists(id, executor);

  if (user && !canManageAllBookings(user) && existingBooking.createdById !== user.id) {
    throw new AppError('You do not have permission to cancel this venue booking', 403);
  }

  if (existingBooking.status === VENUE_BOOKING_STATUS.CANCELLED) {
    throw new AppError('Venue booking is already cancelled', 400);
  }

  const booking = await getVenueBookingDelegate(executor).update({
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

export async function cancelBookingsForEvent(eventId: string): Promise<void> {
  await cancelBookingsForEventInTransaction(prisma, eventId);
}

export async function cancelBookingsForEventInTransaction(executor: PrismaExecutor, eventId: string): Promise<void> {
  await getVenueBookingDelegate(executor).updateMany({
    where: {
      eventId,
      status: VENUE_BOOKING_STATUS.BOOKED,
    },
    data: {
      status: VENUE_BOOKING_STATUS.CANCELLED,
    },
  });
}
