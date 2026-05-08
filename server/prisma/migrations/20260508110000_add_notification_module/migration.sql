ALTER TYPE "BOOKING_STATUS" ADD VALUE IF NOT EXISTS 'USED';

CREATE TYPE "NOTIFICATION_TYPE" AS ENUM (
    'USER_REGISTERED',
    'EVENT_UPDATED',
    'EVENT_CANCELLED',
    'TICKET_GENERATED',
    'TICKET_STATUS_CHANGED',
    'EVENT_REMINDER_24H',
    'EVENT_REMINDER_1H',
    'NEW_EVENT_CREATED',
    'EVENT_SEATS_FULL'
);

CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NOTIFICATION_TYPE" NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NotificationDispatchLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NOTIFICATION_TYPE" NOT NULL,
    "channel" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotificationDispatchLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt");
CREATE INDEX "Notification_userId_type_createdAt_idx" ON "Notification"("userId", "type", "createdAt");
CREATE INDEX "NotificationDispatchLog_type_createdAt_idx" ON "NotificationDispatchLog"("type", "createdAt");
CREATE UNIQUE INDEX "NotificationDispatchLog_userId_channel_dedupeKey_key" ON "NotificationDispatchLog"("userId", "channel", "dedupeKey");

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NotificationDispatchLog" ADD CONSTRAINT "NotificationDispatchLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
