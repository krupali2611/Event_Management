import type { BOOKING_STATUS, Event, Prisma, TicketBooking } from '@prisma/client';
import { randomBytes } from 'crypto';
import { getEventStatus } from '../../services/event.service';
import { ticketBookingDetailInclude, TICKET_NUMBER_LENGTH, TICKET_NUMBER_PREFIX } from './ticket.constants';

type EventLifecycleSnapshot = Pick<Event, 'status' | 'startDate' | 'endDate' | 'startTime' | 'endTime'>;

type BookingQuantityAggregate = {
  _sum: {
    quantity: number | null;
  };
};

export type TicketBookingRecord = Prisma.TicketBookingGetPayload<{
  include: typeof ticketBookingDetailInclude;
}>;

export function generateTicketNumber(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(TICKET_NUMBER_LENGTH);
  let value = '';

  for (let index = 0; index < TICKET_NUMBER_LENGTH; index += 1) {
    value += alphabet[(bytes[index] ?? 0) % alphabet.length];
  }

  return `${TICKET_NUMBER_PREFIX}-${value}`;
}

export function getSoldTickets(aggregate: BookingQuantityAggregate | null | undefined): number {
  return aggregate?._sum.quantity ?? 0;
}

export function getRemainingSeats(attendeeLimit: number, soldTickets: number): number {
  return Math.max(attendeeLimit - soldTickets, 0);
}

export function calculateRevenue(bookings: Array<Pick<TicketBooking, 'bookingStatus' | 'totalAmount'>>): number {
  return bookings.reduce((total, booking) => (booking.bookingStatus === 'CONFIRMED' ? total + booking.totalAmount : total), 0);
}

export function isBookingCountedAsSold(status: BOOKING_STATUS): boolean {
  return status === 'CONFIRMED';
}

export function getBookingStatistics(bookings: Array<Pick<TicketBooking, 'bookingStatus' | 'quantity' | 'totalAmount'>>): {
  totalTicketsSold: number;
  totalRevenue: number;
  totalBookings: number;
  cancelledBookings: number;
  confirmedBookings: number;
} {
  return bookings.reduce(
    (summary, booking) => {
      summary.totalBookings += 1;

      if (booking.bookingStatus === 'CANCELLED') {
        summary.cancelledBookings += 1;
      }

      if (booking.bookingStatus === 'CONFIRMED') {
        summary.confirmedBookings += 1;
        summary.totalTicketsSold += booking.quantity;
        summary.totalRevenue += booking.totalAmount;
      }

      return summary;
    },
    {
      totalTicketsSold: 0,
      totalRevenue: 0,
      totalBookings: 0,
      cancelledBookings: 0,
      confirmedBookings: 0,
    },
  );
}

export function assertEventCanAcceptBookings(event: EventLifecycleSnapshot): void {
  const lifecycleStatus = getEventStatus(event);

  if (lifecycleStatus === 'CANCELLED') {
    throw new Error('Cancelled events cannot accept ticket bookings');
  }

  if (lifecycleStatus === 'ONGOING') {
    throw new Error('Started events cannot accept ticket bookings');
  }

  if (lifecycleStatus === 'COMPLETED') {
    throw new Error('Completed events cannot accept ticket bookings');
  }

  if (event.status !== 'PUBLISHED') {
    throw new Error('Tickets can only be booked for published events');
  }
}

export function toTicketBookingDto(
  booking: TicketBookingRecord,
  soldTickets: number,
): {
  id: string;
  eventId: string;
  userId: string;
  quantity: number;
  totalAmount: number;
  bookingStatus: Lowercase<TicketBooking['bookingStatus']>;
  paymentStatus: Lowercase<TicketBooking['paymentStatus']>;
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
    status: Event['status'];
    lifecycleStatus: ReturnType<typeof getEventStatus>;
    venue: {
      id: string;
      name: string;
      location: string;
      capacity: number;
      isActive: boolean;
    } | null;
  };
} {
  return {
    id: booking.id,
    eventId: booking.eventId,
    userId: booking.userId,
    quantity: booking.quantity,
    totalAmount: booking.totalAmount,
    bookingStatus: booking.bookingStatus.toLowerCase() as Lowercase<TicketBooking['bookingStatus']>,
    paymentStatus: booking.paymentStatus.toLowerCase() as Lowercase<TicketBooking['paymentStatus']>,
    ticketNumber: booking.ticketNumber,
    qrCode: booking.qrCode,
    bookedAt: booking.bookedAt,
    cancelledAt: booking.cancelledAt,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
    soldTickets,
    remainingSeats: getRemainingSeats(booking.event.attendeeLimit, soldTickets),
    event: {
      id: booking.event.id,
      title: booking.event.title,
      image: booking.event.bannerImage ?? booking.event.galleryImages?.[0] ?? null,
      bannerImage: booking.event.bannerImage ?? null,
      category: booking.event.category,
      ticketPrice: booking.event.ticketPrice,
      attendeeLimit: booking.event.attendeeLimit,
      startDate: booking.event.startDate,
      endDate: booking.event.endDate,
      startTime: booking.event.startTime,
      endTime: booking.event.endTime,
      status: booking.event.status,
      lifecycleStatus: getEventStatus(booking.event),
      venue: booking.event.venue
        ? {
            id: booking.event.venue.id,
            name: booking.event.venue.name,
            location: booking.event.venue.location,
            capacity: booking.event.venue.capacity,
            isActive: booking.event.venue.isActive,
          }
        : null,
    },
  };
}
