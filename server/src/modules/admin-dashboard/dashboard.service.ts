import { Prisma, USER_ROLE, type PrismaClient } from '@prisma/client';
import { prisma } from '../../config/prisma';
import type { AuthenticatedUser } from '../../types/auth.types';
import { AppError } from '../../utils/response';

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

export interface AdminDashboardStatsDto {
  totalUsers: number;
  totalOrganizers: number;
  totalEvents: number;
  pendingEvents: number;
  approvedEvents: number;
  totalVenueBookings: number;
}

export interface AdminDashboardMonthlyAnalyticsItemDto {
  month: string;
  count: number;
}

export interface AdminDashboardMonthlyAnalyticsDto {
  months: AdminDashboardMonthlyAnalyticsItemDto[];
}

export interface AdminDashboardEventStatusDto {
  approved: number;
  pending: number;
  rejected: number;
  cancelled: number;
}

export interface AdminDashboardRecentEventItemDto {
  id: string;
  title: string;
  category: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED';
  createdAt: Date;
  organizer: {
    id: string;
    name: string;
    email: string;
  };
}

export interface AdminDashboardRecentEventsDto {
  events: AdminDashboardRecentEventItemDto[];
}

export interface AdminDashboardRecentUserItemDto {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'ORGANIZER' | 'ATTENDEE';
  isActive: boolean;
  createdAt: Date;
}

export interface AdminDashboardRecentUsersDto {
  users: AdminDashboardRecentUserItemDto[];
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

function getVenueBookingDelegate(executor: PrismaExecutor = prisma) {
  if (!('venueBooking' in executor) || !executor.venueBooking) {
    throw new AppError('VenueBooking model is not available in the Prisma client. Run Prisma generate and restart the server.', 500);
  }

  return executor.venueBooking;
}

function ensureAdminAccess(user: AuthenticatedUser): void {
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    throw new AppError('You do not have permission to access admin dashboard analytics', 403);
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

function toMonthlyAnalytics(rows: Array<{ createdAt: Date; _count: { createdAt: number } }>): AdminDashboardMonthlyAnalyticsDto {
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

export async function getAdminDashboardStats(user: AuthenticatedUser): Promise<AdminDashboardStatsDto> {
  ensureAdminAccess(user);

  const [totalUsers, totalOrganizers, totalEvents, pendingEvents, approvedEvents, totalVenueBookings] = await Promise.all([
    getUserDelegate().count(),
    getUserDelegate().count({
      where: {
        role: USER_ROLE.ORGANIZER,
      },
    }),
    getEventDelegate().count(),
    getEventDelegate().count({
      where: {
        status: 'DRAFT',
      },
    }),
    getEventDelegate().count({
      where: {
        status: 'PUBLISHED',
      },
    }),
    getVenueBookingDelegate().count(),
  ]);

  return {
    totalUsers,
    totalOrganizers,
    totalEvents,
    pendingEvents,
    approvedEvents,
    totalVenueBookings,
  };
}

export async function getAdminDashboardEventsAnalytics(user: AuthenticatedUser): Promise<AdminDashboardMonthlyAnalyticsDto> {
  ensureAdminAccess(user);
  const rangeStart = getLastTwelveMonthsRangeStart();

  const groupedRows = await getEventDelegate().groupBy({
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

  return toMonthlyAnalytics(groupedRows);
}

export async function getAdminDashboardUserAnalytics(user: AuthenticatedUser): Promise<AdminDashboardMonthlyAnalyticsDto> {
  ensureAdminAccess(user);
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

  return toMonthlyAnalytics(groupedRows);
}

export async function getAdminDashboardEventStatus(user: AuthenticatedUser): Promise<AdminDashboardEventStatusDto> {
  ensureAdminAccess(user);

  const groupedStatuses = await getEventDelegate().groupBy({
    by: ['status'],
    _count: {
      status: true,
    },
  });

  const counts = new Map(groupedStatuses.map((row) => [row.status, row._count.status]));

  return {
    approved: counts.get('PUBLISHED') ?? 0,
    pending: counts.get('DRAFT') ?? 0,
    rejected: 0,
    cancelled: counts.get('CANCELLED') ?? 0,
  };
}

export async function getAdminDashboardRecentEvents(user: AuthenticatedUser): Promise<AdminDashboardRecentEventsDto> {
  ensureAdminAccess(user);

  const events = await getEventDelegate().findMany({
    select: {
      id: true,
      title: true,
      category: true,
      status: true,
      createdAt: true,
      organizer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: [{ createdAt: 'desc' }],
    take: 10,
  });

  return { events };
}

export async function getAdminDashboardRecentUsers(user: AuthenticatedUser): Promise<AdminDashboardRecentUsersDto> {
  ensureAdminAccess(user);

  const users = await getUserDelegate().findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: [{ createdAt: 'desc' }],
    take: 10,
  });

  return { users };
}
