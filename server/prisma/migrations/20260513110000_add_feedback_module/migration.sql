CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "attendeeId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "review" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Feedback_eventId_attendeeId_key" ON "Feedback"("eventId", "attendeeId");
CREATE INDEX "Feedback_eventId_createdAt_idx" ON "Feedback"("eventId", "createdAt");
CREATE INDEX "Feedback_attendeeId_createdAt_idx" ON "Feedback"("attendeeId", "createdAt");
CREATE INDEX "Feedback_rating_idx" ON "Feedback"("rating");

ALTER TABLE "Feedback"
ADD CONSTRAINT "Feedback_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Feedback"
ADD CONSTRAINT "Feedback_attendeeId_fkey" FOREIGN KEY ("attendeeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
