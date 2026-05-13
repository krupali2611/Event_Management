import { Prisma, USER_ROLE, type PrismaClient } from '@prisma/client';
import { prisma } from '../../config/prisma';
import type { AuthenticatedUser } from '../../types/auth.types';
import { COUNTED_BOOKING_STATUSES } from '../tickets/ticket.constants';
import { AppError } from '../../utils/response';

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

export interface SuperAdminDashboardStatsDto {
  totalPlatformRevenue: number;
  totalUsers: number;
  totalAdmins: number;
  totalOrganizers: number;
  totalEvents: number;
  totalTicketsSold: number;
}

export interface SuperAdminDashboardRevenueItemDto {
  month: string;
  revenue: number;
}

export interface SuperAdminDashboardRevenueDto {
  months: SuperAdminDashboardRevenueItemDto[];
}

export interface SuperAdminDashboardUserGrowthItemDto {
  month: string;
  count: number;
}

export interface SuperAdminDashboardUserGrowthDto {
  months: SuperAdminDashboardUserGrowthItemDto[];
}

export interface SuperAdminDashboardRoleDistributionDto {
  admins: number;
  organizers: number;
  attendees: number;
}

export interface SuperAdminDashboardTopOrganizerItemDto {
  organizerId: string;
  organizerName: string;
  organizerEmail: string;
  revenue: number;
  ticketsSold: number;
  eventsCount: number;
}

export interface SuperAdminDashboardTopOrganizersDto {
  organizers: SuperAdminDashboardTopOrganizerItemDto[];
}

export interface SuperAdminDashboardTopEventItemDto {
  eventId: string;
  eventTitle: string;
  organizerName: string;
  revenue: number;
  ticketsSold: number;
}

export interface SuperAdminDashboardTopEventsDto {
  events: SuperAdminDashboardTopEventItemDto[];
}

function getUserDelegate(executor: PrismaExecutor = prisma) {
  if (!('user' in executor) || !executor.user) {
    throw new AppError('User model is not available in the Prisma client. Run Prisma generate and restart the server.', 500);
  }

  return executor.user;
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

function ensureSuperAdminAccess(user: AuthenticatedUser): void {
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
    throw new AppError('You do not have permission to access platform dashboard analytics', 403);
  }
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

function toMonthlyCounts(rows: Array<{ createdAt: Date; _count: { createdAt: number } }>): SuperAdminDashboardUserGrowthDto {
  const totalsByMonth = new Map<string, number>();

  rows.forEach((row) => {
    const key = `${row.createdAt.getFullYear()}-${String(row.createdAt.getMonth() + 1).padStart(2, '0')}`;
    totalsByMonth.set(key, (totalsByMonth.get(key) ?? 0) + row._count.createdAt);
  });

  return {
    months: buildLastTwelveMonths().map(({ key, date }) => ({
      month: date.toLocaleString('en-US', {
        month: 'short',
        year: 'numeric',
      }),
      count: totalsByMonth.get(key) ?? 0,
    })),
  };
}

export async function getSuperAdminDashboardStats(user: AuthenticatedUser): Promise<SuperAdminDashboardStatsDto> {
  ensureSuperAdminAccess(user);

  const [bookingAggregate, totalUsers, totalAdmins, totalOrganizers, totalEvents] = await Promise.all([
    getTicketBookingDelegate().aggregate({
      where: {
        bookingStatus: {
          in: COUNTED_BOOKING_STATUSES,
        },
      },
      _sum: {
        totalAmount: true,
        quantity: true,
      },
    }),
    getUserDelegate().count(),
    getUserDelegate().count({
      where: {
        role: USER_ROLE.ADMIN,
      },
    }),
    getUserDelegate().count({
      where: {
        role: USER_ROLE.ORGANIZER,
      },
    }),
    getEventDelegate().count(),
  ]);

  return {
    totalPlatformRevenue: bookingAggregate._sum.totalAmount ?? 0,
    totalUsers,
    totalAdmins,
    totalOrganizers,
    totalEvents,
    totalTicketsSold: bookingAggregate._sum.quantity ?? 0,
  };
}

export async function getSuperAdminDashboardRevenue(user: AuthenticatedUser): Promise<SuperAdminDashboardRevenueDto> {
  ensureSuperAdminAccess(user);
  const rangeStart = getLastTwelveMonthsRangeStart();

  const groupedRows = await getTicketBookingDelegate().groupBy({
    by: ['bookedAt'],
    where: {
      bookingStatus: {
        in: COUNTED_BOOKING_STATUSES,
      },
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

  const totalsByMonth = new Map<string, number>();

  groupedRows.forEach((row) => {
    const key = `${row.bookedAt.getFullYear()}-${String(row.bookedAt.getMonth() + 1).padStart(2, '0')}`;
    totalsByMonth.set(key, (totalsByMonth.get(key) ?? 0) + (row._sum.totalAmount ?? 0));
  });

  return {
    months: buildLastTwelveMonths().map(({ key, date }) => ({
      month: date.toLocaleString('en-US', {
        month: 'short',
        year: 'numeric',
      }),
      revenue: totalsByMonth.get(key) ?? 0,
    })),
  };
}

export async function getSuperAdminDashboardUserGrowth(user: AuthenticatedUser): Promise<SuperAdminDashboardUserGrowthDto> {
  ensureSuperAdminAccess(user);
  const rangeStart = getLastTwelveMonthsRangeStart();

  const groupedRows = await getUserDelegate().groupBy({
    by: ['createdAt'],
    where: {
      createdAt: {
        gte: rangeStart,
      },
    },
    _count: {
      createdAt: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return toMonthlyCounts(groupedRows);
}

export async function getSuperAdminDashboardRoleDistribution(user: AuthenticatedUser): Promise<SuperAdminDashboardRoleDistributionDto> {
  ensureSuperAdminAccess(user);

  const groupedRoles = await getUserDelegate().groupBy({
    by: ['role'],
    where: {
      role: {
        in: [USER_ROLE.ADMIN, USER_ROLE.ORGANIZER, USER_ROLE.ATTENDEE],
      },
    },
    _count: {
      role: true,
    },
  });

  const counts = new Map(groupedRoles.map((row) => [row.role, row._count.role]));

  return {
    admins: counts.get(USER_ROLE.ADMIN) ?? 0,
    organizers: counts.get(USER_ROLE.ORGANIZER) ?? 0,
    attendees: counts.get(USER_ROLE.ATTENDEE) ?? 0,
  };
}

export async function getSuperAdminDashboardTopOrganizers(user: AuthenticatedUser): Promise<SuperAdminDashboardTopOrganizersDto> {
  ensureSuperAdminAccess(user);

  const [eventCounts, bookingRows] = await Promise.all([
    getEventDelegate().groupBy({
      by: ['organizerId'],
      _count: {
        organizerId: true,
      },
    }),
    getTicketBookingDelegate().groupBy({
      by: ['eventId'],
      where: {
        bookingStatus: {
          in: COUNTED_BOOKING_STATUSES,
        },
      },
      _sum: {
        quantity: true,
        totalAmount: true,
      },
    }),
  ]);

  if (eventCounts.length === 0) {
    return { organizers: [] };
  }

  const organizerIds = [...new Set(eventCounts.map((row) => row.organizerId))];
  const events = await getEventDelegate().findMany({
    where: {
      organizerId: {
        in: organizerIds,
      },
    },
    select: {
      id: true,
      organizerId: true,
      organizer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  const organizerMap = new Map<
    string,
    {
      organizerId: string;
      organizerName: string;
      organizerEmail: string;
      revenue: number;
      ticketsSold: number;
      eventsCount: number;
    }
  >();

  eventCounts.forEach((row) => {
    organizerMap.set(row.organizerId, {
      organizerId: row.organizerId,
      organizerName: 'Unknown organizer',
      organizerEmail: 'Unknown email',
      revenue: 0,
      ticketsSold: 0,
      eventsCount: row._count.organizerId,
    });
  });

  const eventOrganizerMap = new Map(events.map((event) => [event.id, event.organizerId]));

  events.forEach((event) => {
    const current = organizerMap.get(event.organizerId);

    if (!current) {
      return;
    }

    current.organizerName = event.organizer.name;
    current.organizerEmail = event.organizer.email;
  });

  bookingRows.forEach((row) => {
    const organizerId = eventOrganizerMap.get(row.eventId);

    if (!organizerId) {
      return;
    }

    const current = organizerMap.get(organizerId);

    if (!current) {
      return;
    }

    current.revenue += row._sum.totalAmount ?? 0;
    current.ticketsSold += row._sum.quantity ?? 0;
  });

  return {
    organizers: [...organizerMap.values()]
      .sort((left, right) => {
        if (right.revenue !== left.revenue) {
          return right.revenue - left.revenue;
        }

        if (right.ticketsSold !== left.ticketsSold) {
          return right.ticketsSold - left.ticketsSold;
        }

        return right.eventsCount - left.eventsCount;
      })
      .slice(0, 3),
  };
}

export async function getSuperAdminDashboardTopEvents(user: AuthenticatedUser): Promise<SuperAdminDashboardTopEventsDto> {
  ensureSuperAdminAccess(user);

  const groupedRows = await getTicketBookingDelegate().groupBy({
    by: ['eventId'],
    where: {
      bookingStatus: {
        in: COUNTED_BOOKING_STATUSES,
      },
    },
    _sum: {
      quantity: true,
      totalAmount: true,
    },
    orderBy: {
      _sum: {
        totalAmount: 'desc',
      },
    },
  });

  if (groupedRows.length === 0) {
    return { events: [] };
  }

  const eventIds = groupedRows.map((row) => row.eventId);
  const events = await getEventDelegate().findMany({
    where: {
      id: {
        in: eventIds,
      },
    },
    select: {
      id: true,
      title: true,
      organizer: {
        select: {
          name: true,
        },
      },
    },
  });

  const eventMap = new Map(events.map((event) => [event.id, event]));

  return {
    events: groupedRows
      .map((row) => {
        const event = eventMap.get(row.eventId);

        if (!event) {
          return null;
        }

        return {
          eventId: row.eventId,
          eventTitle: event.title,
          organizerName: event.organizer.name,
          revenue: row._sum.totalAmount ?? 0,
          ticketsSold: row._sum.quantity ?? 0,
        };
      })
      .filter((event): event is SuperAdminDashboardTopEventItemDto => event !== null)
      .sort((left, right) => {
        if (right.revenue !== left.revenue) {
          return right.revenue - left.revenue;
        }

        return right.ticketsSold - left.ticketsSold;
      })
      .slice(0, 3),
  };
}
