import { z } from 'zod';

const positiveInteger = z.coerce.number().int().min(1);
const optionalTrimmedString = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

const amenitiesSchema = z
  .array(z.string().trim().min(1, 'Amenity cannot be empty'))
  .max(30, 'Too many amenities')
  .default([])
  .transform((amenities) => Array.from(new Set(amenities.map((item) => item.trim()).filter(Boolean))));

export const venueIdParamSchema = z.object({
  id: z.string().trim().min(1, 'Venue id is required'),
});

export const venueListQuerySchema = z.object({
  page: positiveInteger.default(1),
  limit: positiveInteger.max(50).default(10),
  offset: z.coerce.number().int().min(0).optional(),
  search: z
    .string()
    .trim()
    .max(100, 'Search term is too long')
    .optional()
    .transform((value) => (value ? value : undefined)),
  location: z
    .string()
    .trim()
    .max(100, 'Location filter is too long')
    .optional()
    .transform((value) => (value ? value : undefined)),
  minCapacity: z.coerce.number().int().min(1).optional(),
  isActive: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return undefined;
      }

      return value === 'true';
    }),
  includeInactive: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
});

export const createVenueBodySchema = z.object({
  name: z.string().trim().min(1, 'Venue name is required').max(120, 'Venue name is too long'),
  location: z.string().trim().min(1, 'Location is required').max(120, 'Location is too long'),
  address: optionalTrimmedString,
  capacity: positiveInteger,
  description: optionalTrimmedString,
  image: z.string().trim().optional().transform((value) => (value ? value : undefined)),
  imagePublicId: z.string().trim().optional().transform((value) => (value ? value : undefined)),
  amenities: amenitiesSchema,
  isActive: z.boolean().optional(),
});

export const updateVenueBodySchema = z
  .object({
    name: z.string().trim().min(1, 'Venue name is required').max(120, 'Venue name is too long').optional(),
    location: z.string().trim().min(1, 'Location is required').max(120, 'Location is too long').optional(),
    address: optionalTrimmedString,
    capacity: positiveInteger.optional(),
    description: optionalTrimmedString,
    image: z.string().trim().optional().transform((value) => (value ? value : undefined)),
    imagePublicId: z.string().trim().optional().transform((value) => (value ? value : undefined)),
    amenities: amenitiesSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => Object.values(value).some((item) => item !== undefined), {
    message: 'At least one field is required',
  });
