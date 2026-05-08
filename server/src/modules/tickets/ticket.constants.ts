import { BOOKING_STATUS, Prisma } from '@prisma/client';

export const TICKET_NUMBER_PREFIX = 'TKT';
export const TICKET_NUMBER_LENGTH = 6;
export const MAX_TICKET_NUMBER_RETRIES = 5;
export const SERIALIZABLE_RETRY_LIMIT = 3;
export const SERIALIZABLE_RETRY_DELAY_MS = 25;
export const CONFIRMED_BOOKING_STATUS = BOOKING_STATUS.CONFIRMED;

export const ticketBookingDetailInclude = Prisma.validator<Prisma.TicketBookingInclude>()({
  event: {
    include: {
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
