import { z } from 'zod';

const positiveInteger = z.coerce.number().int().min(1);

export const notificationQuerySchema = z.object({
  page: positiveInteger.default(1),
  limit: positiveInteger.max(50).default(10),
  filter: z.enum(['all', 'read', 'unread']).default('all'),
});

export const notificationIdParamSchema = z.object({
  id: z.string().trim().min(1, 'Notification id is required'),
});
