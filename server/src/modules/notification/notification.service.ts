import { BOOKING_STATUS, NOTIFICATION_TYPE, Prisma, USER_ROLE, type PrismaClient } from '@prisma/client';
import { prisma } from '../../config/prisma';
import type { AuthenticatedUser } from '../../types/auth.types';
import { resolveDateTimeBoundary } from '../../utils/dateUtils';
import { AppError } from '../../utils/response';
import { sendEmailNotification } from './email.service';
import { NotificationType, NOTIFICATION_CHANNELS } from './constants/notificationTypes';
import { eventCancelledEmailTemplate } from './templates/eventCancelledEmail';
import { eventUpdatedEmailTemplate } from './templates/eventUpdatedEmail';
import { reminderEmailTemplate } from './templates/reminderEmail';
import { ticketGeneratedEmailTemplate } from './templates/ticketGeneratedEmail';
import { ticketStatusEmailTemplate } from './templates/ticketStatusEmail';
import { welcomeEmailTemplate } from './templates/welcomeEmail';
import {
  buildClientUrl,
  buildEventLink,
  buildEventUpdatedSummary,
  buildTicketLink,
  formatEventDateLabel,
  formatVenueLabel,
  getReminderDedupeKey,
  listEventChangeLabels,
  mapTicketStatusLabel,
  toNotificationDto,
} from './notification.utils';

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

type NotificationRecipient = {
  id: string;
  name: string;
  email: string;
  role: USER_ROLE;
};

type EventNotificationContext = {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  startTime: string | null;
  endTime: string | null;
  venue: { id: string; name: string; location: string } | null;
  organizer: { id: string; name: string; email: string };
};

export interface NotificationListQuery {
  page: number;
  limit: number;
  filter?: 'all' | 'read' | 'unread';
}

export interface NotificationListData {
  notifications: ReturnType<typeof toNotificationDto>[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

function getNotificationDelegate(executor: PrismaExecutor = prisma) {
  if (!('notification' in executor) || !executor.notification) {
    throw new AppError('Notification model is not available in the Prisma client. Run Prisma generate and restart the server.', 500);
  }

  return executor.notification;
}

function getNotificationDispatchLogDelegate(executor: PrismaExecutor = prisma) {
  if (!('notificationDispatchLog' in executor) || !executor.notificationDispatchLog) {
    throw new AppError('Notification dispatch log model is not available in the Prisma client. Run Prisma generate and restart the server.', 500);
  }

  return executor.notificationDispatchLog;
}

function getUserDelegate(executor: PrismaExecutor = prisma) {
  if (!('user' in executor) || !executor.user) {
    throw new AppError('User model is not available in the Prisma client. Run Prisma generate and restart the server.', 500);
  }

  return executor.user;
}

function getTicketDelegate(executor: PrismaExecutor = prisma) {
  if (!('ticketBooking' in executor) || !executor.ticketBooking) {
    throw new AppError('TicketBooking model is not available in the Prisma client. Run Prisma generate and restart the server.', 500);
  }

  return executor.ticketBooking;
}

function isDuplicateDispatchError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

async function createInAppNotification(input: {
  executor?: PrismaExecutor;
  userId: string;
  title: string;
  message: string;
  type: NOTIFICATION_TYPE;
  link?: string | null;
  metadata?: Prisma.InputJsonValue;
}): Promise<void> {
  await getNotificationDelegate(input.executor).create({
    data: {
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type,
      isRead: false,
      readAt: null,
      link: input.link ?? null,
      metadata: input.metadata,
    },
  });
}

async function executeOncePerRecipient(input: {
  executor?: PrismaExecutor;
  userId: string;
  type: NOTIFICATION_TYPE;
  channel: string;
  dedupeKey?: string;
  operation: (executor?: Prisma.TransactionClient) => Promise<void>;
}): Promise<void> {
  if (!input.dedupeKey) {
    await input.operation();
    return;
  }

  try {
    await prisma.$transaction(async (transaction) => {
      await getNotificationDispatchLogDelegate(transaction).create({
        data: {
          userId: input.userId,
          type: input.type,
          channel: input.channel,
          dedupeKey: input.dedupeKey!,
        },
      });

      await input.operation(transaction);
    });
  } catch (error) {
    if (isDuplicateDispatchError(error)) {
      return;
    }

    throw error;
  }
}

async function getAdminRecipients(): Promise<NotificationRecipient[]> {
  return getUserDelegate().findMany({
    where: {
      role: {
        in: [USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN],
      },
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });
}

export async function getNotifiableTicketRecipientsByEvent(eventId: string, executor: PrismaExecutor = prisma): Promise<NotificationRecipient[]> {
  const bookings = await getTicketDelegate(executor).findMany({
    where: {
      eventId,
      bookingStatus: {
        in: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.USED],
      },
      user: {
        isActive: true,
      },
    },
    select: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    distinct: ['userId'],
  });

  return bookings.map((booking) => booking.user);
}

export async function getNotificationList(userId: string, query: NotificationListQuery): Promise<NotificationListData> {
  const whereClause: Prisma.NotificationWhereInput = {
    userId,
    ...(query.filter === 'read' ? { isRead: true } : {}),
    ...(query.filter === 'unread' ? { isRead: false } : {}),
  };

  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    getNotificationDelegate().findMany({
      where: whereClause,
      orderBy: [{ createdAt: 'desc' }],
      skip,
      take: query.limit,
    }),
    getNotificationDelegate().count({
      where: whereClause,
    }),
  ]);

  return {
    notifications: items.map(toNotificationDto),
    pagination: {
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

export async function getUnreadNotificationCount(userId: string): Promise<{ count: number }> {
  const count = await getNotificationDelegate().count({
    where: {
      userId,
      isRead: false,
    },
  });

  return { count };
}

export async function markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
  const notification = await getNotificationDelegate().findUnique({
    where: { id: notificationId },
    select: { id: true, userId: true, isRead: true },
  });

  if (!notification || notification.userId !== userId) {
    throw new AppError('Notification not found', 404);
  }

  if (notification.isRead) {
    return;
  }

  await getNotificationDelegate().update({
    where: { id: notificationId },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

export async function markAllNotificationsAsRead(userId: string): Promise<{ updatedCount: number }> {
  const result = await getNotificationDelegate().updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  return { updatedCount: result.count };
}

export async function sendUserRegisteredNotification(user: NotificationRecipient): Promise<void> {
  const template = welcomeEmailTemplate({
    userName: user.name,
    platformName: 'Event Management System',
    loginUrl: buildClientUrl('/login'),
  });

  await sendEmailNotification({
    to: { email: user.email, name: user.name },
    subject: template.subject,
    html: template.html,
  });
}

export async function sendNewEventCreatedNotificationToAdmins(event: EventNotificationContext): Promise<void> {
  const recipients = await getAdminRecipients();
  const message = `${event.organizer.name} created a new event: ${event.title}.`;

  await Promise.all(
    recipients.map((recipient) =>
      createInAppNotification({
        userId: recipient.id,
        type: NotificationType.NEW_EVENT_CREATED,
        title: 'New event created',
        message,
        link: buildEventLink(event.id, recipient.role),
        metadata: {
          eventId: event.id,
          organizerId: event.organizer.id,
        },
      }),
    ),
  );
}

export async function sendEventUpdatedNotifications(input: {
  previous: Pick<EventNotificationContext, 'startDate' | 'endDate' | 'startTime' | 'endTime' | 'venue'>;
  next: EventNotificationContext;
}): Promise<void> {
  const recipients = await getNotifiableTicketRecipientsByEvent(input.next.id);
  if (recipients.length === 0) {
    return;
  }

  const changeLabels = listEventChangeLabels({
    previous: {
      startDate: input.previous.startDate,
      endDate: input.previous.endDate,
      startTime: input.previous.startTime,
      endTime: input.previous.endTime,
      venueId: input.previous.venue?.id ?? null,
    },
    next: {
      startDate: input.next.startDate,
      endDate: input.next.endDate,
      startTime: input.next.startTime,
      endTime: input.next.endTime,
      venueId: input.next.venue?.id ?? null,
    },
  });

  if (changeLabels.length === 0) {
    return;
  }

  const summary = buildEventUpdatedSummary(changeLabels, input.next);

  await Promise.all(
    recipients.map(async (recipient) => {
      const link = buildEventLink(input.next.id, recipient.role);

      await createInAppNotification({
        userId: recipient.id,
        type: NotificationType.EVENT_UPDATED,
        title: `${input.next.title} was updated`,
        message: summary,
        link,
        metadata: {
          eventId: input.next.id,
          changedFields: changeLabels,
        },
      });

      const template = eventUpdatedEmailTemplate({
        attendeeName: recipient.name,
        eventName: input.next.title,
        summary,
        eventUrl: buildClientUrl(link),
      });

      await sendEmailNotification({
        to: { email: recipient.email, name: recipient.name },
        subject: template.subject,
        html: template.html,
      });
    }),
  );
}

export async function sendEventCancelledNotifications(event: EventNotificationContext): Promise<void> {
  const recipients = await getNotifiableTicketRecipientsByEvent(event.id);
  if (recipients.length === 0) {
    return;
  }

  await Promise.all(
    recipients.map(async (recipient) => {
      const link = buildEventLink(event.id, recipient.role);

      await createInAppNotification({
        userId: recipient.id,
        type: NotificationType.EVENT_CANCELLED,
        title: `${event.title} has been cancelled`,
        message: `Your booked event ${event.title} has been cancelled.`,
        link,
        metadata: {
          eventId: event.id,
        },
      });

      const template = eventCancelledEmailTemplate({
        attendeeName: recipient.name,
        eventName: event.title,
        eventDate: formatEventDateLabel(event),
        eventUrl: buildClientUrl(link),
      });

      await sendEmailNotification({
        to: { email: recipient.email, name: recipient.name },
        subject: template.subject,
        html: template.html,
      });
    }),
  );
}

export async function sendTicketGeneratedNotification(input: {
  booking: {
    id: string;
    ticketNumber: string;
    user: NotificationRecipient;
    event: EventNotificationContext;
  };
}): Promise<void> {
  const template = ticketGeneratedEmailTemplate({
    attendeeName: input.booking.user.name,
    eventName: input.booking.event.title,
    ticketId: input.booking.ticketNumber,
    eventDate: formatEventDateLabel(input.booking.event),
    venue: formatVenueLabel(input.booking.event.venue),
    organizerName: input.booking.event.organizer.name,
    ticketUrl: buildClientUrl(buildTicketLink(input.booking.id)),
  });

  await sendEmailNotification({
    to: { email: input.booking.user.email, name: input.booking.user.name },
    subject: template.subject,
    html: template.html,
  });
}

export async function sendTicketStatusChangedNotification(input: {
  booking: {
    id: string;
    ticketNumber: string;
    bookingStatus: BOOKING_STATUS;
    user: NotificationRecipient;
    event: EventNotificationContext;
  };
}): Promise<void> {
  const statusLabel = mapTicketStatusLabel(input.booking.bookingStatus);
  const link = buildTicketLink(input.booking.id);

  await createInAppNotification({
    userId: input.booking.user.id,
    type: NotificationType.TICKET_STATUS_CHANGED,
    title: `Ticket ${statusLabel.toLowerCase()}`,
    message: `Your ticket for ${input.booking.event.title} is now ${statusLabel.toLowerCase()}.`,
    link,
    metadata: {
      eventId: input.booking.event.id,
      ticketId: input.booking.id,
      ticketNumber: input.booking.ticketNumber,
      status: input.booking.bookingStatus,
    },
  });

  const template = ticketStatusEmailTemplate({
    attendeeName: input.booking.user.name,
    eventName: input.booking.event.title,
    ticketId: input.booking.ticketNumber,
    statusLabel,
    ticketUrl: buildClientUrl(link),
  });

  await sendEmailNotification({
    to: { email: input.booking.user.email, name: input.booking.user.name },
    subject: template.subject,
    html: template.html,
  });
}

export async function sendEventSeatsFullNotification(input: {
  event: EventNotificationContext;
}): Promise<void> {
  await createInAppNotification({
    userId: input.event.organizer.id,
    type: NotificationType.EVENT_SEATS_FULL,
    title: 'Event seats are full',
    message: `${input.event.title} has reached full capacity.`,
    link: buildEventLink(input.event.id, USER_ROLE.ORGANIZER),
    metadata: {
      eventId: input.event.id,
    },
  });
}

export async function sendEventReminderNotification(input: {
  type: 'EVENT_REMINDER_24H' | 'EVENT_REMINDER_1H';
  booking: {
    id: string;
    ticketNumber: string;
    user: NotificationRecipient;
    event: EventNotificationContext;
  };
}): Promise<void> {
  const label = input.type === NotificationType.EVENT_REMINDER_24H ? 'Starts in 24 hours' : 'Starts in 1 hour';
  const eventLink = buildEventLink(input.booking.event.id, input.booking.user.role);
  const dedupeKey = getReminderDedupeKey({
    eventId: input.booking.event.id,
    type: input.type,
    ticketId: input.booking.id,
  });

  await executeOncePerRecipient({
    userId: input.booking.user.id,
    type: input.type,
    channel: NOTIFICATION_CHANNELS.IN_APP,
    dedupeKey,
    operation: async (executor) =>
      createInAppNotification({
        executor,
        userId: input.booking.user.id,
        type: input.type,
        title: label,
        message: `${input.booking.event.title} begins soon. Please review your ticket and arrival details.`,
        link: eventLink,
        metadata: {
          eventId: input.booking.event.id,
          ticketId: input.booking.id,
        },
      }),
  });

  await executeOncePerRecipient({
    userId: input.booking.user.id,
    type: input.type,
    channel: NOTIFICATION_CHANNELS.EMAIL,
    dedupeKey,
    operation: async () => {
      const template = reminderEmailTemplate({
        attendeeName: input.booking.user.name,
        eventName: input.booking.event.title,
        eventDate: formatEventDateLabel(input.booking.event),
        venue: formatVenueLabel(input.booking.event.venue),
        reminderLabel: label,
        eventUrl: buildClientUrl(eventLink),
      });

      await sendEmailNotification({
        to: { email: input.booking.user.email, name: input.booking.user.name },
        subject: template.subject,
        html: template.html,
      });
    },
  });
}

export async function getReminderCandidates(type: 'EVENT_REMINDER_24H' | 'EVENT_REMINDER_1H') {
  const now = new Date();
  const startBoundary = new Date(now);
  const endBoundary = new Date(now);

  if (type === NotificationType.EVENT_REMINDER_24H) {
    startBoundary.setHours(startBoundary.getHours() + 23, startBoundary.getMinutes() + 55, 0, 0);
    endBoundary.setHours(endBoundary.getHours() + 24, endBoundary.getMinutes() + 5, 59, 999);
  } else {
    startBoundary.setMinutes(startBoundary.getMinutes() + 55, 0, 0);
    endBoundary.setMinutes(endBoundary.getMinutes() + 65, 59, 999);
  }

  return getTicketDelegate().findMany({
    where: {
      bookingStatus: {
        in: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.USED],
      },
      event: {
        status: 'PUBLISHED',
        startDate: {
          lte: endBoundary,
          gte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        },
      },
      user: {
        isActive: true,
      },
    },
    select: {
      id: true,
      ticketNumber: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      event: {
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
      },
    },
  }).then((bookings) =>
    bookings.filter((booking) => {
      const eventStart = resolveDateTimeBoundary(booking.event.startDate, booking.event.startTime, false);
      return eventStart >= startBoundary && eventStart <= endBoundary;
    }),
  );
}

export function canUserAccessNotifications(user: AuthenticatedUser): boolean {
  return Boolean(user.id);
}
