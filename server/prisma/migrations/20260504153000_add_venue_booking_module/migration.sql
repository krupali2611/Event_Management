CREATE TYPE "VENUE_BOOKING_STATUS" AS ENUM ('BOOKED', 'CANCELLED');

CREATE TABLE "VenueBooking" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "status" "VENUE_BOOKING_STATUS" NOT NULL DEFAULT 'BOOKED',
    "eventId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VenueBooking_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VenueBooking_venueId_startDate_endDate_startTime_endTime_key" ON "VenueBooking"("venueId", "startDate", "endDate", "startTime", "endTime");
CREATE INDEX "VenueBooking_venueId_startDate_endDate_idx" ON "VenueBooking"("venueId", "startDate", "endDate");
CREATE INDEX "VenueBooking_status_idx" ON "VenueBooking"("status");
CREATE INDEX "VenueBooking_eventId_idx" ON "VenueBooking"("eventId");
CREATE INDEX "VenueBooking_createdById_idx" ON "VenueBooking"("createdById");

ALTER TABLE "VenueBooking" ADD CONSTRAINT "VenueBooking_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VenueBooking" ADD CONSTRAINT "VenueBooking_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
