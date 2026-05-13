import { z } from 'zod';

const positiveInteger = z.coerce.number().int().min(1);
const optionalTrimmedString = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

export const createFeedbackBodySchema = z.object({
  eventId: z.string().trim().min(1, 'Event id is required'),
  rating: z.coerce.number().int().min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5'),
  review: z
    .string()
    .trim()
    .min(10, 'Review must be at least 10 characters long')
    .max(1000, 'Review must not exceed 1000 characters'),
});

export const organizerFeedbackQuerySchema = z.object({
  page: positiveInteger.default(1),
  limit: positiveInteger.max(100).default(20),
  eventId: optionalTrimmedString,
});
