ALTER TABLE "Event"
DROP COLUMN "location",
DROP COLUMN "date",
ADD COLUMN "attendeeLimit" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "category" TEXT NOT NULL DEFAULT 'general',
ADD COLUMN "endDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "endTime" TEXT,
ADD COLUMN "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "startTime" TEXT,
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'draft',
ADD COLUMN "venueId" TEXT,
ALTER COLUMN "id" SET DEFAULT gen_random_uuid(),
ALTER COLUMN "description" DROP NOT NULL;

UPDATE "Event"
SET
  "startDate" = COALESCE("startDate", CURRENT_TIMESTAMP),
  "endDate" = COALESCE("endDate", "startDate", CURRENT_TIMESTAMP),
  "category" = COALESCE(NULLIF("category", ''), 'general'),
  "status" = COALESCE(NULLIF("status", ''), 'draft'),
  "attendeeLimit" = COALESCE("attendeeLimit", 1);

ALTER TABLE "Event"
ALTER COLUMN "attendeeLimit" DROP DEFAULT,
ALTER COLUMN "category" DROP DEFAULT,
ALTER COLUMN "endDate" DROP DEFAULT,
ALTER COLUMN "startDate" DROP DEFAULT;

CREATE INDEX "Event_organizerId_idx" ON "Event"("organizerId");
CREATE INDEX "Event_venueId_idx" ON "Event"("venueId");
CREATE INDEX "Event_category_idx" ON "Event"("category");
CREATE INDEX "Event_status_idx" ON "Event"("status");
CREATE INDEX "Event_startDate_endDate_idx" ON "Event"("startDate", "endDate");

ALTER TABLE "Event" ADD CONSTRAINT "Event_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
