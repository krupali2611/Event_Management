ALTER TABLE "Notification"
ADD COLUMN "readAt" TIMESTAMP(3);

UPDATE "Notification"
SET "readAt" = "createdAt"
WHERE "isRead" = true
  AND "readAt" IS NULL;

CREATE INDEX "Notification_isRead_readAt_idx" ON "Notification"("isRead", "readAt");
