import {
  BOOKING_STATUS,
  PAYMENT_STATUS,
  Prisma,
  type PrismaClient,
  type TicketBooking,
} from '@prisma/client';
import { prisma } from '../../config/prisma';
import type { AuthenticatedUser } from '../../types/auth.types';
import { AppError } from '../../utils/response';
import {
  COUNTED_BOOKING_STATUSES,
  MAX_TICKET_NUMBER_RETRIES,
  SERIALIZABLE_RETRY_DELAY_MS,
  SERIALIZABLE_RETRY_LIMIT,
  ticketBookingDetailInclude,
} from './ticket.constants';
import {
  sendEventSeatsFullNotification,
  sendTicketGeneratedNotification,
  sendTicketStatusChangedNotification,
} from '../notification/notification.service';
import {
  assertEventCanAcceptBookings,
  calculateRevenue,
  generateTicketNumber,
  getBookingStatistics,
  getRemainingSeats,
  getSoldTickets,
  toTicketBookingDto,
  type TicketBookingRecord,
} from './ticket.utils';
import { getEventStatus } from '../../services/event.service';

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

export interface TicketBookingDto {
  id: string;
  eventId: string;
  userId: string;
  quantity: number;
  totalAmount: number;
  bookingStatus: 'pending' | 'confirmed' | 'cancelled' | 'used' | 'refunded';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refun_pending' | 'refunded';
  ticketNumber: string;
  qrCode: string | null;
  bookedAt: Date;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  soldTickets: number;
  remainingSeats: number;
  event: {
    id: string;
    title: string;
    image: string | null;
    bannerImage: string | null;
    category: string;
    ticketPrice: number;
    attendeeLimit: number;
    startDate: Date;
    endDate: Date;
    startTime: string | null;
    endTime: string | null;
    status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED';
    lifecycleStatus: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
    venue: {
      id: string;
      name: string;
      location: string;
      capacity: number;
      isActive: boolean;
    } | null;
  };
}

export interface TicketBookingListData {
  bookings: TicketBookingDto[];
}

export interface TicketEventAttendeeItemDto {
  id: string;
  attendeeName: string;
  attendeeEmail: string;
  quantity: number;
  totalAmount: number;
  bookingStatus: 'pending' | 'confirmed' | 'cancelled' | 'used' | 'refunded';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refun_pending' | 'refunded';
  bookedAt: Date;
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
  attendees: TicketEventAttendeeItemDto[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TicketEventStatsDto {
  eventId: string;
  eventTitle: string;
  attendeeLimit: number;
  totalTicketsSold: number;
  remainingSeats: number;
  totalRevenue: number;
  totalBookings: number;
  cancelledBookings: number;
  confirmedBookings: number;
}

export interface TicketDashboardSummaryDto {
  totalEvents: number;
  totalTicketsSold: number;
  totalRevenue: number;
  upcomingEvents: number;
  soldOutEvents: number;
}

export interface CreateTicketBookingInput {
  eventId: string;
  quantity: number;
}

type EventForBookingValidation = {
  id: string;
  title: string;
  category: string;
  ticketPrice: number;
  attendeeLimit: number;
  startDate: Date;
  endDate: Date;
  startTime: string | null;
  endTime: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED';
  venue: {
    id: string;
    name: string;
    location: string;
    capacity: number;
    isActive: boolean;
  } | null;
};

type TicketAnalyticsQuery = {
  page: number;
  limit: number;
  search?: string;
  bookingStatus?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'USED' | 'REFUNDED';
  paymentStatus?: 'PENDING' | 'PAID' | 'FAILED' | 'REFUN_PENDING' | 'REFUNDED';
};

type EventOwnershipRecord = {
  id: string;
  title: string;
  attendeeLimit: number;
  organizerId: string;
  startDate: Date;
  endDate: Date;
  startTime: string | null;
  endTime: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED';
};

function getTicketBookingDelegate(executor: PrismaExecutor = prisma) {
  if (!('ticketBooking' in executor) || !executor.ticketBooking) {
    throw new AppError('TicketBooking model is not available in the Prisma client. Run Prisma generate and restart the server.', 500);
  }

  return executor.ticketBooking;
}

function getEventDelegate(executor: PrismaExecutor = prisma) {
  if (!('event' in executor) || !executor.event) {
    throw new AppError('Event model is not available in the Prisma client. Run Prisma generate and restart the server.', 500);
  }

  return executor.event;
}

async function waitForRetry(): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, SERIALIZABLE_RETRY_DELAY_MS);
  });
}

function isPrismaKnownError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}

function isSerializationConflict(error: unknown): boolean {
  return isPrismaKnownError(error) && error.code === 'P2034';
}

async function runSerializableTransaction<T>(operation: (transaction: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  let attempt = 0;

  while (attempt < SERIALIZABLE_RETRY_LIMIT) {
    try {
      return await prisma.$transaction((transaction) => operation(transaction), {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      attempt += 1;

      if (!isSerializationConflict(error) || attempt >= SERIALIZABLE_RETRY_LIMIT) {
        throw error;
      }

      await waitForRetry();
    }
  }

  throw new AppError('Ticket booking could not be completed. Please try again.', 409);
}

async function getEventForBooking(eventId: string, executor: PrismaExecutor = prisma): Promise<EventForBookingValidation> {
  const event = await getEventDelegate(executor).findUnique({
    where: { id: eventId },
    select: {
      id: true,
      title: true,
      category: true,
      ticketPrice: true,
      attendeeLimit: true,
      startDate: true,
      endDate: true,
      startTime: true,
      endTime: true,
      status: true,
      venue: {
        select: {
          id: true,
          name: true,
          location: true,
          capacity: true,
          isActive: true,
        },
      },
    },
  });

  if (!event) {
    throw new AppError('Event not found', 404);
  }

  return event;
}

async function getEventForAnalytics(eventId: string, executor: PrismaExecutor = prisma): Promise<EventOwnershipRecord> {
  const event = await getEventDelegate(executor).findUnique({
    where: { id: eventId },
    select: {
      id: true,
      title: true,
      attendeeLimit: true,
      organizerId: true,
      startDate: true,
      endDate: true,
      startTime: true,
      endTime: true,
      status: true,
    },
  });

  if (!event) {
    throw new AppError('Event not found', 404);
  }

  return event;
}

async function getConfirmedTicketsAggregate(eventId: string, executor: PrismaExecutor = prisma): Promise<number> {
  const aggregate = await getTicketBookingDelegate(executor).aggregate({
    where: {
      eventId,
      bookingStatus: { in: [...COUNTED_BOOKING_STATUSES] },
    },
    _sum: {
      quantity: true,
    },
  });

  return getSoldTickets(aggregate);
}

async function getSoldTicketsByEventIds(
  eventIds: string[],
  executor: PrismaExecutor = prisma,
): Promise<Map<string, number>> {
  if (eventIds.length === 0) {
    return new Map();
  }

  const rows = await getTicketBookingDelegate(executor).groupBy({
    by: ['eventId'],
    where: {
      eventId: { in: eventIds },
      bookingStatus: { in: [...COUNTED_BOOKING_STATUSES] },
    },
    _sum: {
      quantity: true,
    },
  });

  return new Map(rows.map((row) => [row.eventId, row._sum.quantity ?? 0]));
}

async function createBookingRecord(
  executor: PrismaExecutor,
  data: Omit<Prisma.TicketBookingCreateInput, 'ticketNumber'>,
): Promise<TicketBookingRecord> {
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_TICKET_NUMBER_RETRIES; attempt += 1) {
    try {
      return await getTicketBookingDelegate(executor).create({
        data: {
          ...data,
          ticketNumber: generateTicketNumber(),
        },
        include: ticketBookingDetailInclude,
      });
    } catch (error) {
      if (!isPrismaKnownError(error) || error.code !== 'P2002') {
        throw error;
      }

      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new AppError('Failed to generate a unique ticket number', 500);
}

async function ensureBookingExists(id: string, executor: PrismaExecutor = prisma): Promise<TicketBookingRecord> {
  const booking = await getTicketBookingDelegate(executor).findUnique({
    where: { id },
    include: ticketBookingDetailInclude,
  });

  if (!booking) {
    throw new AppError('Ticket booking not found', 404);
  }

  return booking;
}

async function ensureEventAnalyticsAccess(eventId: string, user: AuthenticatedUser, executor: PrismaExecutor = prisma): Promise<EventOwnershipRecord> {
  const event = await getEventForAnalytics(eventId, executor);

  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
    return event;
  }

  if (user.role === 'ORGANIZER' && event.organizerId === user.id) {
    return event;
  }

  throw new AppError('You do not have permission to access ticket analytics for this event', 403);
}

function ensureBookingOwner(booking: TicketBooking, user: AuthenticatedUser): void {
  if (booking.userId !== user.id) {
    throw new AppError('You do not have permission to access this ticket booking', 403);
  }
}

function ensureAttendeeCanBook(user: AuthenticatedUser): void {
  if (user.role !== 'ATTENDEE') {
    throw new AppError('Only attendees can book tickets', 403);
  }
}

function ensureAnalyticsAccess(user: AuthenticatedUser): void {
  if (user.role === 'ORGANIZER' || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
    return;
  }

  throw new AppError('You do not have permission to access ticket analytics', 403);
}

export async function getTicketAvailabilityForEvent(
  eventId: string,
  executor: PrismaExecutor = prisma,
): Promise<{ soldTickets: number; remainingSeats: number }> {
  const event = await getEventForBooking(eventId, executor);
  const soldTickets = await getConfirmedTicketsAggregate(eventId, executor);

  return {
    soldTickets,
    remainingSeats: getRemainingSeats(event.attendeeLimit, soldTickets),
  };
}

export async function createTicketBooking(
  payload: CreateTicketBookingInput,
  user: AuthenticatedUser,
): Promise<TicketBookingDto> {
  ensureAttendeeCanBook(user);

  const booking = await runSerializableTransaction(async (transaction) => {
    const event = await getEventForBooking(payload.eventId, transaction);

    try {
      assertEventCanAcceptBookings(event);
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : 'Event cannot accept ticket bookings', 400);
    }

    const soldTickets = await getConfirmedTicketsAggregate(payload.eventId, transaction);
    const remainingSeats = getRemainingSeats(event.attendeeLimit, soldTickets);

    if (remainingSeats < payload.quantity) {
      throw new AppError(`Only ${remainingSeats} ticket(s) remaining for this event`, 409);
    }

    const totalAmount = event.ticketPrice * payload.quantity;

    return createBookingRecord(transaction, {
      user: {
        connect: {
          id: user.id,
        },
      },
      event: {
        connect: {
          id: payload.eventId,
        },
      },
      quantity: payload.quantity,
      totalAmount,
      bookingStatus: BOOKING_STATUS.CONFIRMED,
      paymentStatus: PAYMENT_STATUS.PENDING,
      bookedAt: new Date(),
      qrCode: null,
      cancelledAt: null,
    });
  });

  const soldTickets = await getConfirmedTicketsAggregate(booking.eventId);
  await sendTicketGeneratedNotification({
    booking: {
      id: booking.id,
      ticketNumber: booking.ticketNumber,
      user: booking.user,
      event: {
        id: booking.event.id,
        title: booking.event.title,
        startDate: booking.event.startDate,
        endDate: booking.event.endDate,
        startTime: booking.event.startTime,
        endTime: booking.event.endTime,
        venue: booking.event.venue
          ? {
              id: booking.event.venue.id,
              name: booking.event.venue.name,
              location: booking.event.venue.location,
            }
          : null,
        organizer: {
          id: booking.event.organizer.id,
          name: booking.event.organizer.name,
          email: booking.event.organizer.email,
        },
      },
    },
  });

  if (soldTickets >= booking.event.attendeeLimit) {
    const organizer = await getEventDelegate().findUnique({
      where: { id: booking.eventId },
      select: {
        id: true,
        title: true,
        startDate: true,
        endDate: true,
        startTime: true,
        endTime: true,
        venue: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (organizer) {
      await sendEventSeatsFullNotification({ event: organizer });
    }
  }

  return toTicketBookingDto(booking, soldTickets);
}

export async function getMyTicketBookings(user: AuthenticatedUser): Promise<TicketBookingListData> {
  ensureAttendeeCanBook(user);

  const bookings = await getTicketBookingDelegate().findMany({
    where: {
      userId: user.id,
      bookingStatus: { not: BOOKING_STATUS.CANCELLED },
      event: {
        status: { not: 'CANCELLED' },
      },
    },
    include: ticketBookingDetailInclude,
    orderBy: [{ createdAt: 'desc' }],
  });

  const soldTicketsByEventId = await getSoldTicketsByEventIds(
    [...new Set(bookings.map((booking) => booking.eventId))],
  );

  return {
    bookings: bookings.map((booking) => toTicketBookingDto(booking, soldTicketsByEventId.get(booking.eventId) ?? 0)),
  };
}

export async function getTicketBookingById(id: string, user: AuthenticatedUser): Promise<TicketBookingDto> {
  ensureAttendeeCanBook(user);

  const booking = await ensureBookingExists(id);
  ensureBookingOwner(booking, user);
  const soldTickets = await getConfirmedTicketsAggregate(booking.eventId);

  return toTicketBookingDto(booking, soldTickets);
}

export async function cancelTicketBooking(id: string, user: AuthenticatedUser): Promise<TicketBookingDto> {
  ensureAttendeeCanBook(user);

  const booking = await runSerializableTransaction(async (transaction) => {
    const existingBooking = await ensureBookingExists(id, transaction);
    ensureBookingOwner(existingBooking, user);

    if (existingBooking.bookingStatus === BOOKING_STATUS.CANCELLED) {
      throw new AppError('Ticket booking is already cancelled', 400);
    }

    if (existingBooking.bookingStatus === BOOKING_STATUS.USED) {
      throw new AppError('Used tickets cannot be cancelled', 400);
    }

    if (getEventStatus(existingBooking.event) !== 'UPCOMING') {
      throw new AppError('Tickets cannot be cancelled after the event has started', 400);
    }

    return getTicketBookingDelegate(transaction).update({
      where: { id },
      data: {
        bookingStatus: BOOKING_STATUS.CANCELLED,
        cancelledAt: new Date(),
      },
      include: ticketBookingDetailInclude,
    });
  });

  const soldTickets = await getConfirmedTicketsAggregate(booking.eventId);
  await sendTicketStatusChangedNotification({
    booking: {
      id: booking.id,
      ticketNumber: booking.ticketNumber,
      bookingStatus: booking.bookingStatus,
      user: booking.user,
      event: {
        id: booking.event.id,
        title: booking.event.title,
        startDate: booking.event.startDate,
        endDate: booking.event.endDate,
        startTime: booking.event.startTime,
        endTime: booking.event.endTime,
        venue: booking.event.venue
          ? {
              id: booking.event.venue.id,
              name: booking.event.venue.name,
              location: booking.event.venue.location,
            }
          : null,
        organizer: {
          id: booking.event.organizer.id,
          name: booking.event.organizer.name,
          email: booking.event.organizer.email,
        },
      },
    },
  });
  return toTicketBookingDto(booking, soldTickets);
}

export async function updateTicketBookingStatus(
  id: string,
  status: 'CONFIRMED' | 'CANCELLED' | 'USED',
  user: AuthenticatedUser,
): Promise<TicketBookingDto> {
  ensureAnalyticsAccess(user);

  const updatedBooking = await runSerializableTransaction(async (transaction) => {
    const booking = await ensureBookingExists(id, transaction);
    await ensureEventAnalyticsAccess(booking.eventId, user, transaction);

    if (booking.bookingStatus === status) {
      return booking;
    }

    if (status === BOOKING_STATUS.CANCELLED && getEventStatus(booking.event) !== 'UPCOMING') {
      throw new AppError('Only upcoming event tickets can be cancelled', 400);
    }

    return getTicketBookingDelegate(transaction).update({
      where: { id },
      data: {
        bookingStatus: status,
        cancelledAt: status === BOOKING_STATUS.CANCELLED ? new Date() : null,
      },
      include: ticketBookingDetailInclude,
    });
  });

  const soldTickets = await getConfirmedTicketsAggregate(updatedBooking.eventId);
  await sendTicketStatusChangedNotification({
    booking: {
      id: updatedBooking.id,
      ticketNumber: updatedBooking.ticketNumber,
      bookingStatus: updatedBooking.bookingStatus,
      user: updatedBooking.user,
      event: {
        id: updatedBooking.event.id,
        title: updatedBooking.event.title,
        startDate: updatedBooking.event.startDate,
        endDate: updatedBooking.event.endDate,
        startTime: updatedBooking.event.startTime,
        endTime: updatedBooking.event.endTime,
        venue: updatedBooking.event.venue
          ? {
              id: updatedBooking.event.venue.id,
              name: updatedBooking.event.venue.name,
              location: updatedBooking.event.venue.location,
            }
          : null,
        organizer: {
          id: updatedBooking.event.organizer.id,
          name: updatedBooking.event.organizer.name,
          email: updatedBooking.event.organizer.email,
        },
      },
    },
  });

  return toTicketBookingDto(updatedBooking, soldTickets);
}

export async function getEventTicketBookings(
  eventId: string,
  query: TicketAnalyticsQuery,
  user: AuthenticatedUser,
): Promise<TicketEventAttendeeListData> {
  ensureAnalyticsAccess(user);
  const event = await ensureEventAnalyticsAccess(eventId, user);

  const whereClause: Prisma.TicketBookingWhereInput = {
    eventId,
    ...(query.bookingStatus ? { bookingStatus: query.bookingStatus } : {}),
    ...(query.paymentStatus ? { paymentStatus: query.paymentStatus } : {}),
    ...(query.search
      ? {
          user: {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          },
        }
      : {}),
  };

  const skip = (query.page - 1) * query.limit;
  const [items, totalItems, soldTickets] = await Promise.all([
    getTicketBookingDelegate().findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [{ bookedAt: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: query.limit,
    }),
    getTicketBookingDelegate().count({ where: whereClause }),
    getConfirmedTicketsAggregate(eventId),
  ]);

  return {
    event: {
      id: event.id,
      title: event.title,
      attendeeLimit: event.attendeeLimit,
      soldTickets,
      remainingSeats: getRemainingSeats(event.attendeeLimit, soldTickets),
    },
    attendees: items.map((booking) => ({
      id: booking.id,
      attendeeName: booking.user.name,
      attendeeEmail: booking.user.email,
      quantity: booking.quantity,
      totalAmount: booking.totalAmount,
      bookingStatus: booking.bookingStatus.toLowerCase() as TicketEventAttendeeItemDto['bookingStatus'],
      paymentStatus: booking.paymentStatus.toLowerCase() as TicketEventAttendeeItemDto['paymentStatus'],
      bookedAt: booking.bookedAt,
      ticketNumber: booking.ticketNumber,
    })),
    pagination: {
      total: totalItems,
      page: query.page,
      limit: query.limit,
      totalPages: Math.max(1, Math.ceil(totalItems / query.limit)),
    },
  };
}

export async function getEventTicketStats(eventId: string, user: AuthenticatedUser): Promise<TicketEventStatsDto> {
  ensureAnalyticsAccess(user);
  const event = await ensureEventAnalyticsAccess(eventId, user);
  const bookings = await getTicketBookingDelegate().findMany({
    where: { eventId },
    select: {
      bookingStatus: true,
      quantity: true,
      totalAmount: true,
    },
  });
  const stats = getBookingStatistics(bookings);

  return {
    eventId: event.id,
    eventTitle: event.title,
    attendeeLimit: event.attendeeLimit,
    totalTicketsSold: stats.totalTicketsSold,
    remainingSeats: getRemainingSeats(event.attendeeLimit, stats.totalTicketsSold),
    totalRevenue: stats.totalRevenue,
    totalBookings: stats.totalBookings,
    cancelledBookings: stats.cancelledBookings,
    confirmedBookings: stats.confirmedBookings,
  };
}

export async function getTicketDashboardSummary(user: AuthenticatedUser): Promise<TicketDashboardSummaryDto> {
  ensureAnalyticsAccess(user);

  const eventWhereClause: Prisma.EventWhereInput =
    user.role === 'ORGANIZER'
      ? {
          organizerId: user.id,
        }
      : {};

  const [events, bookings] = await Promise.all([
    getEventDelegate().findMany({
      where: eventWhereClause,
      select: {
        id: true,
        attendeeLimit: true,
        startDate: true,
        endDate: true,
        startTime: true,
        endTime: true,
        status: true,
      },
    }),
    getTicketBookingDelegate().findMany({
      where: {
        event: eventWhereClause,
      },
      select: {
        bookingStatus: true,
        quantity: true,
        totalAmount: true,
        eventId: true,
      },
    }),
  ]);

  const bookingStats = getBookingStatistics(bookings);
  const soldTicketsByEventId = new Map<string, number>();

  for (const booking of bookings) {
    if (!COUNTED_BOOKING_STATUSES.includes(booking.bookingStatus)) {
      continue;
    }

    soldTicketsByEventId.set(booking.eventId, (soldTicketsByEventId.get(booking.eventId) ?? 0) + booking.quantity);
  }

  const upcomingEvents = events.filter((event) => getEventStatus(event) === 'UPCOMING').length;
  const soldOutEvents = events.filter((event) => getRemainingSeats(event.attendeeLimit, soldTicketsByEventId.get(event.id) ?? 0) === 0).length;

  return {
    totalEvents: events.length,
    totalTicketsSold: bookingStats.totalTicketsSold,
    totalRevenue: calculateRevenue(bookings),
    upcomingEvents,
    soldOutEvents,
  };
}
