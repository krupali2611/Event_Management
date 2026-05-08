import { NOTIFICATION_TYPE } from '@prisma/client';

export const NotificationType = NOTIFICATION_TYPE;

export const NOTIFICATION_CHANNELS = {
  IN_APP: 'IN_APP',
  EMAIL: 'EMAIL',
} as const;

export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[keyof typeof NOTIFICATION_CHANNELS];

export const REMINDER_NOTIFICATION_TYPES = new Set<NOTIFICATION_TYPE>([
  NOTIFICATION_TYPE.EVENT_REMINDER_24H,
  NOTIFICATION_TYPE.EVENT_REMINDER_1H,
]);
