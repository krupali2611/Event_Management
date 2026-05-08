import { z } from 'zod';

const positiveInteger = z.coerce.number().int().min(1);
const optionalTrimmedString = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));
const optionalNullableTrimmedString = z.union([z.string().trim(), z.null()]).optional().transform((value) => {
  if (value === null) {
    return null;
  }

  return value && value.length > 0 ? value : undefined;
});
const imageUrlArraySchema = z.array(z.string().trim().min(1));
const ticketPriceSchema = z.coerce.number().min(0, 'Ticket price cannot be negative');

const dateStringSchema = z.string().datetime({ offset: true }).or(z.string().date());
const normalizedStatusSchema = z
  .enum(['DRAFT', 'PUBLISHED', 'CANCELLED', 'draft', 'published', 'cancelled'])
  .transform((value) => value.toUpperCase() as 'DRAFT' | 'PUBLISHED' | 'CANCELLED');
const creatableStatusSchema = z
  .enum(['DRAFT', 'PUBLISHED', 'draft', 'published'])
  .transform((value) => value.toUpperCase() as 'DRAFT' | 'PUBLISHED');

export const eventIdParamSchema = z.object({
  id: z.string().trim().min(1, 'Event id is required'),
});

export const eventListQuerySchema = z.object({
  page: positiveInteger.default(1),
  limit: positiveInteger.max(50).default(10),
  search: optionalTrimmedString,
  date: z.string().date().optional(),
  status: normalizedStatusSchema.optional(),
  includeUnpublished: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
});

export const createEventBodySchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(150, 'Title is too long'),
    description: optionalTrimmedString,
    bannerImage: optionalNullableTrimmedString,
    bannerImagePublicId: optionalNullableTrimmedString,
    galleryImages: imageUrlArraySchema.optional(),
    galleryImagePublicIds: imageUrlArraySchema.optional(),
    category: z.string().trim().min(1, 'Category is required').max(80, 'Category is too long'),
    ticketPrice: ticketPriceSchema.default(0),
    startDate: dateStringSchema,
    endDate: dateStringSchema,
    startTime: optionalTrimmedString,
    endTime: optionalTrimmedString,
    attendeeLimit: positiveInteger,
    venueId: z.string().trim().min(1).optional(),
    status: creatableStatusSchema.optional(),
  })
  .refine((value) => new Date(value.startDate).getTime() <= new Date(value.endDate).getTime(), {
    message: 'Start date must be on or before end date',
    path: ['endDate'],
  });

export const updateEventBodySchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(150, 'Title is too long').optional(),
    description: optionalTrimmedString,
    bannerImage: optionalNullableTrimmedString,
    bannerImagePublicId: optionalNullableTrimmedString,
    galleryImages: imageUrlArraySchema.optional(),
    galleryImagePublicIds: imageUrlArraySchema.optional(),
    category: z.string().trim().min(1, 'Category is required').max(80, 'Category is too long').optional(),
    ticketPrice: ticketPriceSchema.optional(),
    startDate: dateStringSchema.optional(),
    endDate: dateStringSchema.optional(),
    startTime: optionalTrimmedString,
    endTime: optionalTrimmedString,
    attendeeLimit: positiveInteger.optional(),
    venueId: z.union([z.string().trim().min(1), z.null()]).optional(),
    status: normalizedStatusSchema.optional(),
  })
  .refine((value) => Object.values(value).some((item) => item !== undefined), {
    message: 'At least one field is required',
  });

export const updateEventStatusBodySchema = z.object({
  status: normalizedStatusSchema,
});
