import { USER_ROLE } from '@prisma/client';
import { z } from 'zod';

const positiveInteger = z.coerce.number().int().min(1);

export const userListQuerySchema = z.object({
  page: positiveInteger.default(1),
  limit: positiveInteger.max(50).default(10),
  search: z
    .string()
    .trim()
    .max(100, 'Search term is too long')
    .optional()
    .transform((value) => (value ? value : undefined)),
  role: z.nativeEnum(USER_ROLE).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  isActive: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return undefined;
      }

      return value === 'true';
    }),
});

export const userIdParamSchema = z.object({
  id: z.string().trim().min(1, 'User id is required'),
});

export const updateUserRoleBodySchema = z.object({
  role: z.nativeEnum(USER_ROLE),
});

export const updateUserStatusBodySchema = z
  .object({
    isActive: z.boolean().optional(),
  })
  .optional();
