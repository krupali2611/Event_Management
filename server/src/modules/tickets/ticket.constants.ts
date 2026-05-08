import { BOOKING_STATUS, Prisma } from '@prisma/client';

export const TICKET_NUMBER_PREFIX = 'TKT';
export const TICKET_NUMBER_LENGTH = 6;
export const MAX_TICKET_NUMBER_RETRIES = 5;
export const SERIALIZABLE_RETRY_LIMIT = 3;
export const SERIALIZABLE_RETRY_DELAY_MS = 25;
export const COUNTED_BOOKING_STATUSES: BOOKING_STATUS[] = [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.USED];

export const ticketBookingDetailInclude = Prisma.validator<Prisma.TicketBookingInclude>()({
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
  event: {
    include: {
      organizer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
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
  },
});
