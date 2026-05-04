import { z } from 'zod';

const positiveInteger = z.coerce.number().int().min(1);
const optionalTimeString = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:MM format')
  .optional()
  .transform((value) => (value ? value : undefined));

const optionalIdString = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

export const venueBookingIdParamSchema = z.object({
  id: z.string().trim().min(1, 'Booking id is required'),
});

export const createVenueBookingBodySchema = z.object({
  venueId: z.string().trim().min(1, 'Venue id is required'),
  startDate: z.string().trim().min(1, 'Start date is required'),
  endDate: z.string().trim().min(1, 'End date is required'),
  startTime: optionalTimeString,
  endTime: optionalTimeString,
  eventId: optionalIdString.nullable().optional(),
});

export const checkAvailabilityBodySchema = z.object({
  venueId: z.string().trim().min(1, 'Venue id is required'),
  startDate: z.string().trim().min(1, 'Start date is required'),
  endDate: z.string().trim().min(1, 'End date is required'),
});

export const venueBookingListQuerySchema = z.object({
  venueId: z.string().trim().optional().transform((value) => (value ? value : undefined)),
  startDate: z.string().trim().optional().transform((value) => (value ? value : undefined)),
  endDate: z.string().trim().optional().transform((value) => (value ? value : undefined)),
  page: positiveInteger.default(1),
  limit: positiveInteger.max(50).default(10),
  sort: z.enum(['asc', 'desc']).default('asc'),
  upcomingOnly: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return undefined;
      }

      return value === 'true';
    }),
});
