import { BOOKING_STATUS, NOTIFICATION_TYPE, USER_ROLE, type Notification } from '@prisma/client';
import { env } from '../../config/env';
import { resolveDateTimeBoundary } from '../../utils/dateUtils';

export function buildClientUrl(path: string): string {
  const normalizedBase = env.clientUrl.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

export function buildEventLink(eventId: string, role: USER_ROLE): string {
  if (role === USER_ROLE.ATTENDEE) {
    return `/events/${eventId}`;
  }

  if (role === USER_ROLE.ORGANIZER) {
    return `/organizer/events/${eventId}`;
  }

  return `/admin/events/${eventId}`;
}

export function buildTicketLink(ticketId: string): string {
  return `/my-tickets?ticket=${ticketId}`;
}

export function formatEventDateLabel(event: { startDate: Date; startTime: string | null; endDate?: Date; endTime?: string | null }): string {
  return resolveDateTimeBoundary(event.startDate, event.startTime, false).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function formatVenueLabel(venue?: { name: string; location: string } | null): string {
  if (!venue) {
    return 'Venue details will be shared soon';
  }

  return `${venue.name}, ${venue.location}`;
}

export function listEventChangeLabels(input: {
  previous: { startDate: Date; endDate: Date; startTime: string | null; endTime: string | null; venueId: string | null };
  next: { startDate: Date; endDate: Date; startTime: string | null; endTime: string | null; venueId: string | null };
}): string[] {
  const labels: string[] = [];

  if (input.previous.startDate.getTime() !== input.next.startDate.getTime() || input.previous.endDate.getTime() !== input.next.endDate.getTime()) {
    labels.push('date');
  }

  if ((input.previous.startTime ?? '') !== (input.next.startTime ?? '') || (input.previous.endTime ?? '') !== (input.next.endTime ?? '')) {
    labels.push('time');
  }

  if ((input.previous.venueId ?? '') !== (input.next.venueId ?? '')) {
    labels.push('venue');
  }

  return labels;
}

export function buildEventUpdatedSummary(changeLabels: string[], nextEvent: { startDate: Date; startTime: string | null; venue?: { name: string; location: string } | null }): string {
  const changes = changeLabels.length > 0 ? changeLabels.join(', ') : 'event details';
  return `Updated fields: ${changes}. The current schedule starts on ${formatEventDateLabel(nextEvent)} at ${formatVenueLabel(nextEvent.venue)}.`;
}

export function getReminderDedupeKey(input: { eventId: string; type: NOTIFICATION_TYPE; ticketId: string }): string {
  return `${input.type}:${input.eventId}:${input.ticketId}`;
}

export function mapTicketStatusLabel(status: BOOKING_STATUS): string {
  switch (status) {
    case BOOKING_STATUS.CONFIRMED:
      return 'Confirmed';
    case BOOKING_STATUS.CANCELLED:
      return 'Cancelled';
    case BOOKING_STATUS.USED:
      return 'Used';
    case BOOKING_STATUS.REFUNDED:
      return 'Refunded';
    default:
      return 'Pending';
  }
}

export function toNotificationDto(notification: Notification) {
  return {
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    isRead: notification.isRead,
    readAt: notification.readAt,
    link: notification.link,
    metadata: notification.metadata,
    createdAt: notification.createdAt,
  };
}
