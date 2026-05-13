import { Prisma, type PrismaClient } from '@prisma/client';
import { prisma } from '../../config/prisma';
import type { AuthenticatedUser } from '../../types/auth.types';
import { getEventStatus } from '../../services/event.service';
import { COUNTED_BOOKING_STATUSES } from '../tickets/ticket.constants';
import { AppError } from '../../utils/response';

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

type DashboardEventRecord = {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  startTime: string | null;
  endTime: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED';
};

export interface OrganizerDashboardStatsDto {
  totalEvents: number;
  totalRevenue: number;
  ticketsSold: number;
  upcomingEvents: number;
  totalAttendees: number;
}

export interface OrganizerDashboardRevenueItemDto {
  month: string;
  revenue: number;
}

export interface OrganizerDashboardRevenueDto {
  months: OrganizerDashboardRevenueItemDto[];
}

export interface OrganizerDashboardTicketSalesItemDto {
  eventId: string;
  eventTitle: string;
  ticketsSold: number;
  revenue: number;
}

export interface OrganizerDashboardTicketSalesDto {
  events: OrganizerDashboardTicketSalesItemDto[];
}

export interface OrganizerDashboardRecentPurchaseItemDto {
  id: string;
  ticketNumber: string;
  attendee: {
    id: string;
    name: string;
    email: string;
  };
  event: {
    id: string;
    title: string;
  };
  quantity: number;
  totalAmount: number;
  bookingStatus: 'confirmed' | 'used';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refun_pending' | 'refunded';
  bookedAt: Date;
}

export interface OrganizerDashboardRecentPurchasesDto {
  purchases: OrganizerDashboardRecentPurchaseItemDto[];
}

function getEventDelegate(executor: PrismaExecutor = prisma) {
  if (!('event' in executor) || !executor.event) {
    throw new AppError('Event model is not available in the Prisma client. Run Prisma generate and restart the server.', 500);
  }

  return executor.event;
}

function getTicketBookingDelegate(executor: PrismaExecutor = prisma) {
  if (!('ticketBooking' in executor) || !executor.ticketBooking) {
    throw new AppError('TicketBooking model is not available in the Prisma client. Run Prisma generate and restart the server.', 500);
  }

  return executor.ticketBooking;
}

function ensureOrganizer(user: AuthenticatedUser): void {
  if (user.role !== 'ORGANIZER') {
    throw new AppError('You do not have permission to access organizer dashboard analytics', 403);
  }
}

function getOrganizerEventWhere(organizerId: string): Prisma.EventWhereInput {
  return {
    organizerId,
  };
}

function getOrganizerBookingWhere(organizerId: string): Prisma.TicketBookingWhereInput {
  return {
    event: {
      organizerId,
    },
    bookingStatus: {
      in: COUNTED_BOOKING_STATUSES,
    },
  };
}

function buildLastTwelveMonths(): Array<{ key: string; date: Date }> {
  const months: Array<{ key: string; date: Date }> = [];
  const now = new Date();

  for (let offset = 11; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    months.push({ key, date });
  }

  return months;
}

function getLastTwelveMonthsRangeStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - 11, 1);
}

export async function getOrganizerDashboardStats(
  user: AuthenticatedUser,
): Promise<OrganizerDashboardStatsDto> {
  ensureOrganizer(user);

  const [events, bookingAggregate, attendeeGroups] = await Promise.all([
    getEventDelegate().findMany({
      where: getOrganizerEventWhere(user.id),
      select: {
        id: true,
        title: true,
        startDate: true,
        endDate: true,
        startTime: true,
        endTime: true,
        status: true,
      },
    }),
    getTicketBookingDelegate().aggregate({
      where: getOrganizerBookingWhere(user.id),
      _sum: {
        quantity: true,
        totalAmount: true,
      },
    }),
    getTicketBookingDelegate().groupBy({
      by: ['userId'],
      where: getOrganizerBookingWhere(user.id),
      _count: {
        userId: true,
      },
    }),
  ]);

  const upcomingEvents = (events as DashboardEventRecord[]).filter(
    (event) => getEventStatus(event) === 'UPCOMING',
  ).length;

  return {
    totalEvents: events.length,
    totalRevenue: bookingAggregate._sum.totalAmount ?? 0,
    ticketsSold: bookingAggregate._sum.quantity ?? 0,
    upcomingEvents,
    totalAttendees: attendeeGroups.length,
  };
}

export async function getOrganizerDashboardRevenue(
  user: AuthenticatedUser,
): Promise<OrganizerDashboardRevenueDto> {
  ensureOrganizer(user);
  const rangeStart = getLastTwelveMonthsRangeStart();

  const groupedRevenue = await getTicketBookingDelegate().groupBy({
    by: ['bookedAt'],
    where: {
      ...getOrganizerBookingWhere(user.id),
      bookedAt: {
        gte: rangeStart,
      },
    },
    _sum: {
      totalAmount: true,
    },
    orderBy: {
      bookedAt: 'asc',
    },
  });

  const monthlyRevenueMap = new Map<string, number>();

  groupedRevenue.forEach((row) => {
    const key = `${row.bookedAt.getFullYear()}-${String(row.bookedAt.getMonth() + 1).padStart(2, '0')}`;
    monthlyRevenueMap.set(key, (monthlyRevenueMap.get(key) ?? 0) + (row._sum.totalAmount ?? 0));
  });

  const months = buildLastTwelveMonths().map(({ key, date }) => ({
    month: date.toLocaleString('en-US', {
      month: 'short',
      year: 'numeric',
    }),
    revenue: monthlyRevenueMap.get(key) ?? 0,
  }));

  return { months };
}

export async function getOrganizerDashboardTicketSales(
  user: AuthenticatedUser,
): Promise<OrganizerDashboardTicketSalesDto> {
  ensureOrganizer(user);

  const groupedSales = await getTicketBookingDelegate().groupBy({
    by: ['eventId'],
    where: getOrganizerBookingWhere(user.id),
    _sum: {
      quantity: true,
      totalAmount: true,
    },
    orderBy: {
      _sum: {
        quantity: 'desc',
      },
    },
  });

  if (groupedSales.length === 0) {
    return { events: [] };
  }

  const eventIds = groupedSales.map((item) => item.eventId);
  const events = await getEventDelegate().findMany({
    where: {
      id: { in: eventIds },
      organizerId: user.id,
    },
    select: {
      id: true,
      title: true,
    },
  });

  const eventTitleMap = new Map(events.map((event) => [event.id, event.title]));

  return {
    events: groupedSales.map((item) => ({
      eventId: item.eventId,
      eventTitle: eventTitleMap.get(item.eventId) ?? 'Unknown event',
      ticketsSold: item._sum.quantity ?? 0,
      revenue: item._sum.totalAmount ?? 0,
    })),
  };
}

export async function getOrganizerDashboardRecentPurchases(
  user: AuthenticatedUser,
): Promise<OrganizerDashboardRecentPurchasesDto> {
  ensureOrganizer(user);

  const purchases = await getTicketBookingDelegate().findMany({
    where: getOrganizerBookingWhere(user.id),
    select: {
      id: true,
      ticketNumber: true,
      quantity: true,
      totalAmount: true,
      bookingStatus: true,
      paymentStatus: true,
      bookedAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      event: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: [{ bookedAt: 'desc' }, { createdAt: 'desc' }],
    take: 10,
  });

  return {
    purchases: purchases.map((purchase) => ({
      id: purchase.id,
      ticketNumber: purchase.ticketNumber,
      attendee: {
        id: purchase.user.id,
        name: purchase.user.name,
        email: purchase.user.email,
      },
      event: {
        id: purchase.event.id,
        title: purchase.event.title,
      },
      quantity: purchase.quantity,
      totalAmount: purchase.totalAmount,
      bookingStatus: purchase.bookingStatus.toLowerCase() as OrganizerDashboardRecentPurchaseItemDto['bookingStatus'],
      paymentStatus: purchase.paymentStatus.toLowerCase() as OrganizerDashboardRecentPurchaseItemDto['paymentStatus'],
      bookedAt: purchase.bookedAt,
    })),
  };
}
