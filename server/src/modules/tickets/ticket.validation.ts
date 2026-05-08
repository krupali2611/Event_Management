import { z } from 'zod';

const positiveInteger = z.coerce.number().int().min(1, 'Quantity must be greater than 0');
const optionalTrimmedString = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));
const normalizedBookingStatusSchema = z
  .enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'REFUNDED', 'pending', 'confirmed', 'cancelled', 'refunded'])
  .transform((value) => value.toUpperCase() as 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED');
const normalizedPaymentStatusSchema = z
  .enum(['PENDING', 'PAID', 'FAILED', 'REFUN_PENDING', 'REFUNDED', 'pending', 'paid', 'failed', 'refun_pending', 'refunded'])
  .transform((value) => value.toUpperCase() as 'PENDING' | 'PAID' | 'FAILED' | 'REFUN_PENDING' | 'REFUNDED');

export const ticketBookingIdParamSchema = z.object({
  id: z.string().trim().min(1, 'Ticket booking id is required'),
});

export const ticketEventIdParamSchema = z.object({
  eventId: z.string().trim().min(1, 'Event id is required'),
});

export const createTicketBookingBodySchema = z.object({
  eventId: z.string().trim().min(1, 'Event id is required'),
  quantity: positiveInteger,
});

export const ticketEventBookingsQuerySchema = z.object({
  page: positiveInteger.default(1),
  limit: positiveInteger.max(50).default(10),
  search: optionalTrimmedString,
  bookingStatus: normalizedBookingStatusSchema.optional(),
  paymentStatus: normalizedPaymentStatusSchema.optional(),
});
