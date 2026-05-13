import { Prisma, type PrismaClient } from '@prisma/client';
import { prisma } from '../../config/prisma';
import type { AuthenticatedUser } from '../../types/auth.types';
import { AppError } from '../../utils/response';

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;
type FeedbackDelegate = {
  findMany: (args: unknown) => Promise<any[]>;
  groupBy: (args: unknown) => Promise<any[]>;
  aggregate: (args: unknown) => Promise<any>;
};

export interface AdminFeedbackReviewDto {
  id: string;
  attendee: {
    id: string;
    name: string;
    email: string;
  };
  organizer: {
    id: string;
    name: string;
    email: string;
  };
  event: {
    id: string;
    name: string;
  };
  rating: number;
  review: string;
  reviewDate: Date;
}

export interface AdminFeedbackReviewsDto {
  reviews: AdminFeedbackReviewDto[];
}

export interface AdminFeedbackRatedEventDto {
  eventId: string;
  eventName: string;
  organizerName: string;
  averageRating: number;
  totalReviews: number;
}

export interface AdminFeedbackOrganizerRatingDto {
  organizerId: string;
  organizerName: string;
  organizerEmail: string;
  averageRating: number;
  totalReviews: number;
  ratedEvents: number;
}

export interface AdminFeedbackAnalyticsDto {
  totalReviews: number;
  averageRating: number;
  highestRatedEvents: AdminFeedbackRatedEventDto[];
  lowestRatedEvents: AdminFeedbackRatedEventDto[];
  organizerRatings: AdminFeedbackOrganizerRatingDto[];
}

function ensureAdminAccess(user: AuthenticatedUser): void {
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    throw new AppError('You do not have permission to access admin feedback analytics', 403);
  }
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

function toAdminFeedbackReviewDto(input: {
  id: string;
  rating: number;
  review: string;
  createdAt: Date;
  attendee: {
    id: string;
    name: string;
    email: string;
  };
  event: {
    id: string;
    title: string;
    organizer: {
      id: string;
      name: string;
      email: string;
    };
  };
}): AdminFeedbackReviewDto {
  return {
    id: input.id,
    attendee: input.attendee,
    organizer: input.event.organizer,
    event: {
      id: input.event.id,
      name: input.event.title,
    },
    rating: input.rating,
    review: input.review,
    reviewDate: input.createdAt,
  };
}

export async function getAdminFeedbackReviews(user: AuthenticatedUser): Promise<AdminFeedbackReviewsDto> {
  ensureAdminAccess(user);

  const reviews = await getFeedbackDelegate().findMany({
    select: {
      id: true,
      rating: true,
      review: true,
      createdAt: true,
      attendee: {
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
          organizer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: [{ createdAt: 'desc' }],
  });

  return {
    reviews: reviews.map(toAdminFeedbackReviewDto),
  };
}

async function getRatedEvents(direction: 'asc' | 'desc'): Promise<AdminFeedbackRatedEventDto[]> {
  const grouped = await getFeedbackDelegate().groupBy({
    by: ['eventId'],
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

  return grouped
    .map((item: { eventId: string; _avg: { rating: number | null }; _count: { id: number } }) => {
      const event = eventMap.get(item.eventId);

      if (!event) {
        return null;
      }

      return {
        eventId: item.eventId,
        eventName: event.title,
        organizerName: event.organizer.name,
        averageRating: Number((item._avg.rating ?? 0).toFixed(1)),
        totalReviews: item._count.id,
      };
    })
    .filter((item: AdminFeedbackRatedEventDto | null): item is AdminFeedbackRatedEventDto => item !== null);
}

async function getOrganizerRatings(): Promise<AdminFeedbackOrganizerRatingDto[]> {
  const feedbacks = await getFeedbackDelegate().findMany({
    select: {
      rating: true,
      event: {
        select: {
          id: true,
          organizer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  const organizerMap = new Map<
    string,
    {
      organizerName: string;
      organizerEmail: string;
      totalRating: number;
      totalReviews: number;
      eventIds: Set<string>;
    }
  >();

  feedbacks.forEach((feedback: { rating: number; event: { id: string; organizer: { id: string; name: string; email: string } } }) => {
    const existing = organizerMap.get(feedback.event.organizer.id);

    if (existing) {
      existing.totalRating += feedback.rating;
      existing.totalReviews += 1;
      existing.eventIds.add(feedback.event.id);
      return;
    }

    organizerMap.set(feedback.event.organizer.id, {
      organizerName: feedback.event.organizer.name,
      organizerEmail: feedback.event.organizer.email,
      totalRating: feedback.rating,
      totalReviews: 1,
      eventIds: new Set([feedback.event.id]),
    });
  });

  return Array.from(organizerMap.entries())
    .map(([organizerId, value]) => ({
      organizerId,
      organizerName: value.organizerName,
      organizerEmail: value.organizerEmail,
      averageRating: Number((value.totalRating / value.totalReviews).toFixed(1)),
      totalReviews: value.totalReviews,
      ratedEvents: value.eventIds.size,
    }))
    .sort((left, right) => {
      if (right.averageRating !== left.averageRating) {
        return right.averageRating - left.averageRating;
      }

      if (right.totalReviews !== left.totalReviews) {
        return right.totalReviews - left.totalReviews;
      }

      return right.ratedEvents - left.ratedEvents;
    })
    .slice(0, 5);
}

export async function getAdminFeedbackAnalytics(user: AuthenticatedUser): Promise<AdminFeedbackAnalyticsDto> {
  ensureAdminAccess(user);

  const [aggregate, highestRatedEvents, lowestRatedEvents, organizerRatings] = await Promise.all([
    getFeedbackDelegate().aggregate({
      _avg: {
        rating: true,
      },
      _count: {
        id: true,
      },
    }),
    getRatedEvents('desc'),
    getRatedEvents('asc'),
    getOrganizerRatings(),
  ]);

  return {
    totalReviews: aggregate._count.id ?? 0,
    averageRating: Number((aggregate._avg.rating ?? 0).toFixed(1)),
    highestRatedEvents,
    lowestRatedEvents,
    organizerRatings,
  };
}
