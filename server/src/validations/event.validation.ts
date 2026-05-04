import { z } from 'zod';

const positiveInteger = z.coerce.number().int().min(1);
const optionalTrimmedString = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

const dateStringSchema = z.string().datetime({ offset: true }).or(z.string().date());
const statusSchema = z.enum(['draft', 'published', 'cancelled']);

export const eventIdParamSchema = z.object({
  id: z.string().trim().min(1, 'Event id is required'),
});

export const eventListQuerySchema = z.object({
  page: positiveInteger.default(1),
  limit: positiveInteger.max(50).default(10),
  category: optionalTrimmedString,
  date: z.string().date().optional(),
  status: statusSchema.optional(),
  includeUnpublished: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
});

export const createEventBodySchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(150, 'Title is too long'),
    description: optionalTrimmedString,
    category: z.string().trim().min(1, 'Category is required').max(80, 'Category is too long'),
    startDate: dateStringSchema,
    endDate: dateStringSchema,
    startTime: optionalTrimmedString,
    endTime: optionalTrimmedString,
    attendeeLimit: positiveInteger,
    venueId: z.string().trim().min(1).optional(),
    status: statusSchema.optional(),
  })
  .refine((value) => new Date(value.startDate).getTime() <= new Date(value.endDate).getTime(), {
    message: 'Start date must be on or before end date',
    path: ['endDate'],
  });

export const updateEventBodySchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(150, 'Title is too long').optional(),
    description: optionalTrimmedString,
    category: z.string().trim().min(1, 'Category is required').max(80, 'Category is too long').optional(),
    startDate: dateStringSchema.optional(),
    endDate: dateStringSchema.optional(),
    startTime: optionalTrimmedString,
    endTime: optionalTrimmedString,
    attendeeLimit: positiveInteger.optional(),
    venueId: z.union([z.string().trim().min(1), z.null()]).optional(),
    status: statusSchema.optional(),
  })
  .refine((value) => Object.values(value).some((item) => item !== undefined), {
    message: 'At least one field is required',
  });
