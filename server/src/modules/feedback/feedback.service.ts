import { Prisma, type PrismaClient } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { getEventStatus } from '../../services/event.service';
import type { AuthenticatedUser } from '../../types/auth.types';
import { AppError } from '../../utils/response';
import { COUNTED_BOOKING_STATUSES } from '../tickets/ticket.constants';

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;
type FeedbackDelegate = {
  findUnique: (args: unknown) => Promise<any>;
  create: (args: unknown) => Promise<any>;
  findMany: (args: unknown) => Promise<any[]>;
  count: (args: unknown) => Promise<number>;
  groupBy: (args: unknown) => Promise<any[]>;
  aggregate: (args: unknown) => Promise<any>;
};

type FeedbackEventRecord = {
  id: string;
  title: string;
  bannerImage: string | null;
  category: string;
  startDate: Date;
  endDate: Date;
  startTime: string | null;
  endTime: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED';
  venue: {
    id: string;
    name: string;
    location: string;
  } | null;
};

type FeedbackAttendeeRecord = {
  id: string;
  name: string;
  email: string;
};

export interface FeedbackDto {
  id: string;
  eventId: string;
  attendeeId: string;
  rating: number;
  review: string;
  createdAt: Date;
  updatedAt: Date;
  event: {
    id: string;
    title: string;
    bannerImage: string | null;
    category: string;
    startDate: Date;
    endDate: Date;
    venue: {
      id: string;
      name: string;
      location: string;
    } | null;
  };
  attendee: {
    id: string;
    name: string;
    email: string;
  };
}

export interface FeedbackListDto {
  feedbacks: FeedbackDto[];
}

export interface OrganizerFeedbackListDto {
  feedbacks: FeedbackDto[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface OrganizerFeedbackAnalyticsEventDto {
  eventId: string;
  eventTitle: string;
  bannerImage: string | null;
  averageRating: number;
  totalReviews: number;
}

export interface OrganizerFeedbackAnalyticsDto {
  averageRating: number;
  totalReviews: number;
  highestRatedEvents: OrganizerFeedbackAnalyticsEventDto[];
  lowestRatedEvents: OrganizerFeedbackAnalyticsEventDto[];
  recentReviews: FeedbackDto[];
}

export interface AttendeePastEventDto {
  eventId: string;
  ticketBookingId: string;
  ticketStatus: 'confirmed' | 'used';
  quantity: number;
  event: {
    id: string;
    title: string;
    bannerImage: string | null;
    category: string;
    startDate: Date;
    endDate: Date;
    venue: {
      id: string;
      name: string;
      location: string;
    } | null;
  };
  feedbackSubmitted: boolean;
  feedback: {
    id: string;
    rating: number;
    review: string;
    createdAt: Date;
  } | null;
}

export interface AttendeePastEventsDto {
  events: AttendeePastEventDto[];
}

interface OrganizerFeedbackQuery {
  page: number;
  limit: number;
  eventId?: string;
}

function getFeedbackDelegate(executor: PrismaExecutor = prisma) {
  const feedback = (executor as PrismaExecutor & { feedback?: FeedbackDelegate }).feedback;

  if (!feedback) {
    throw new AppError('Feedback model is not available in the Prisma client. Run Prisma generate and restart the server.', 500);
  }

  return feedback;
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

function ensureAttendee(user: AuthenticatedUser): void {
  if (user.role !== 'ATTENDEE') {
    throw new AppError('Only attendees can perform this action', 403);
  }
}

function ensureOrganizer(user: AuthenticatedUser): void {
  if (user.role !== 'ORGANIZER') {
    throw new AppError('Only organizers can access this resource', 403);
  }
}

function toFeedbackDto(input: {
  id: string;
  eventId: string;
  attendeeId: string;
  rating: number;
  review: string;
  createdAt: Date;
  updatedAt: Date;
  event: FeedbackEventRecord;
  attendee: FeedbackAttendeeRecord;
}): FeedbackDto {
  return {
    id: input.id,
    eventId: input.eventId,
    attendeeId: input.attendeeId,
    rating: input.rating,
    review: input.review,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
    event: {
      id: input.event.id,
      title: input.event.title,
      bannerImage: input.event.bannerImage,
      category: input.event.category,
      startDate: input.event.startDate,
      endDate: input.event.endDate,
      venue: input.event.venue,
    },
    attendee: input.attendee,
  };
}

async function ensureEventCompleted(eventId: string, executor: PrismaExecutor = prisma): Promise<FeedbackEventRecord> {
  const event = await getEventDelegate(executor).findUnique({
    where: { id: eventId },
    select: {
      id: true,
      title: true,
      bannerImage: true,
      category: true,
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
        },
      },
    },
  });

  if (!event) {
    throw new AppError('Event not found', 404);
  }

  if (getEventStatus(event) !== 'COMPLETED') {
    throw new AppError('Feedback can only be submitted for completed events', 400);
  }

  return event;
}

async function ensureFeedbackEligibility(eventId: string, user: AuthenticatedUser, executor: PrismaExecutor = prisma): Promise<void> {
  const booking = await getTicketBookingDelegate(executor).findFirst({
    where: {
      eventId,
      userId: user.id,
      bookingStatus: {
        in: COUNTED_BOOKING_STATUSES,
      },
    },
    select: {
      id: true,
    },
  });

  if (!booking) {
    throw new AppError('You can only review events that you have attended', 403);
  }

  const existingFeedback = await getFeedbackDelegate(executor).findUnique({
    where: {
      eventId_attendeeId: {
        eventId,
        attendeeId: user.id,
      },
    },
    select: {
      id: true,
    },
  });

  if (existingFeedback) {
    throw new AppError('Feedback has already been submitted for this event', 409);
  }
}

export async function submitFeedback(
  payload: {
    eventId: string;
    rating: number;
    review: string;
  },
  user: AuthenticatedUser,
): Promise<FeedbackDto> {
  ensureAttendee(user);

  const feedback = await prisma.$transaction(async (transaction) => {
    await ensureFeedbackEligibility(payload.eventId, user, transaction);
    await ensureEventCompleted(payload.eventId, transaction);

    return getFeedbackDelegate(transaction).create({
      data: {
        eventId: payload.eventId,
        attendeeId: user.id,
        rating: payload.rating,
        review: payload.review.trim(),
      },
      select: {
        id: true,
        eventId: true,
        attendeeId: true,
        rating: true,
        review: true,
        createdAt: true,
        updatedAt: true,
        event: {
          select: {
            id: true,
            title: true,
            bannerImage: true,
            category: true,
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
              },
            },
          },
        },
        attendee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  });

  return toFeedbackDto(feedback);
}

export async function getMyFeedback(user: AuthenticatedUser): Promise<FeedbackListDto> {
  ensureAttendee(user);

  const feedbacks = await getFeedbackDelegate().findMany({
    where: {
      attendeeId: user.id,
    },
    select: {
      id: true,
      eventId: true,
      attendeeId: true,
      rating: true,
      review: true,
      createdAt: true,
      updatedAt: true,
      event: {
        select: {
          id: true,
          title: true,
          bannerImage: true,
          category: true,
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
            },
          },
        },
      },
      attendee: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: [{ createdAt: 'desc' }],
  });

  return {
    feedbacks: feedbacks.map(toFeedbackDto),
  };
}

export async function getOrganizerFeedback(
  user: AuthenticatedUser,
  query: OrganizerFeedbackQuery,
): Promise<OrganizerFeedbackListDto> {
  ensureOrganizer(user);

  const whereClause = {
    event: {
      organizerId: user.id,
      ...(query.eventId ? { id: query.eventId } : {}),
    },
  };

  const skip = (query.page - 1) * query.limit;
  const [feedbacks, total] = await Promise.all([
    getFeedbackDelegate().findMany({
      where: whereClause,
      select: {
        id: true,
        eventId: true,
        attendeeId: true,
        rating: true,
        review: true,
        createdAt: true,
        updatedAt: true,
        event: {
          select: {
            id: true,
            title: true,
            bannerImage: true,
            category: true,
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
              },
            },
          },
        },
        attendee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
      skip,
      take: query.limit,
    }),
    getFeedbackDelegate().count({ where: whereClause }),
  ]);

  return {
    feedbacks: feedbacks.map(toFeedbackDto),
    pagination: {
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

async function getOrganizerRatedEvents(
  organizerId: string,
  direction: 'asc' | 'desc',
): Promise<OrganizerFeedbackAnalyticsEventDto[]> {
  const grouped = await getFeedbackDelegate().groupBy({
    by: ['eventId'],
    where: {
      event: {
        organizerId,
      },
    },
    _avg: {
      rating: true,
    },
    _count: {
      id: true,
    },
    orderBy: [
      {
        _avg: {
          rating: direction,
        },
      },
      {
        _count: {
          id: 'desc',
        },
      },
    ],
    take: 3,
  });

  if (grouped.length === 0) {
    return [];
  }

  const events = await getEventDelegate().findMany({
    where: {
      id: {
        in: grouped.map((item: { eventId: string }) => item.eventId),
      },
      organizerId,
    },
    select: {
      id: true,
      title: true,
      bannerImage: true,
    },
  });

  const eventMap = new Map(events.map((event) => [event.id, event]));

  return grouped
    .map((item: { eventId: string; _avg: { rating: number | null }; _count: { id: number } }) => {
      const event = eventMap.get(item.eventId);

      if (!event) {
        return null;
      }

      return {
        eventId: item.eventId,
        eventTitle: event.title,
        bannerImage: event.bannerImage,
        averageRating: Number((item._avg.rating ?? 0).toFixed(1)),
        totalReviews: item._count.id,
      };
    })
    .filter((item: OrganizerFeedbackAnalyticsEventDto | null): item is OrganizerFeedbackAnalyticsEventDto => item !== null);
}

export async function getOrganizerFeedbackAnalytics(user: AuthenticatedUser): Promise<OrganizerFeedbackAnalyticsDto> {
  ensureOrganizer(user);

  const [aggregate, recentReviews, highestRatedEvents, lowestRatedEvents] = await Promise.all([
    getFeedbackDelegate().aggregate({
      where: {
        event: {
          organizerId: user.id,
        },
      },
      _avg: {
        rating: true,
      },
      _count: {
        id: true,
      },
    }),
    getFeedbackDelegate().findMany({
      where: {
        event: {
          organizerId: user.id,
        },
      },
      select: {
        id: true,
        eventId: true,
        attendeeId: true,
        rating: true,
        review: true,
        createdAt: true,
        updatedAt: true,
        event: {
          select: {
            id: true,
            title: true,
            bannerImage: true,
            category: true,
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
              },
            },
          },
        },
        attendee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
      take: 3,
    }),
    getOrganizerRatedEvents(user.id, 'desc'),
    getOrganizerRatedEvents(user.id, 'asc'),
  ]);

  return {
    averageRating: Number((aggregate._avg.rating ?? 0).toFixed(1)),
    totalReviews: aggregate._count.id,
    highestRatedEvents,
    lowestRatedEvents,
    recentReviews: recentReviews.map(toFeedbackDto),
  };
}

export async function getAttendeePastEvents(user: AuthenticatedUser): Promise<AttendeePastEventsDto> {
  ensureAttendee(user);

  const bookings = await getTicketBookingDelegate().findMany({
    where: {
      userId: user.id,
      bookingStatus: {
        in: COUNTED_BOOKING_STATUSES,
      },
      event: {
        status: {
          not: 'CANCELLED',
        },
      },
    },
    select: {
      id: true,
      eventId: true,
      quantity: true,
      bookingStatus: true,
      bookedAt: true,
      event: {
        select: {
          id: true,
          title: true,
          bannerImage: true,
          category: true,
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
            },
          },
          feedbacks: {
            where: {
              attendeeId: user.id,
            },
            select: {
              id: true,
              rating: true,
              review: true,
              createdAt: true,
            },
            take: 1,
          },
        },
      },
    },
    orderBy: [{ bookedAt: 'desc' }],
    distinct: ['eventId'],
  });

  const events = bookings
    .filter((booking) => getEventStatus(booking.event) === 'COMPLETED')
    .map((booking) => {
      const feedback = (booking.event.feedbacks as Array<{
        id: string;
        rating: number;
        review: string;
        createdAt: Date;
      }>)[0] ?? null;

      return {
        eventId: booking.eventId,
        ticketBookingId: booking.id,
        ticketStatus: booking.bookingStatus.toLowerCase() as 'confirmed' | 'used',
        quantity: booking.quantity,
        event: {
          id: booking.event.id,
          title: booking.event.title,
          bannerImage: booking.event.bannerImage,
          category: booking.event.category,
          startDate: booking.event.startDate,
          endDate: booking.event.endDate,
          venue: booking.event.venue,
        },
        feedbackSubmitted: feedback !== null,
        feedback: feedback
          ? {
              id: feedback.id,
              rating: feedback.rating,
              review: feedback.review,
              createdAt: feedback.createdAt,
            }
          : null,
      };
    });

  return {
    events,
  };
}
