ALTER TABLE "Event"
ADD COLUMN "clientRequestId" TEXT;

CREATE UNIQUE INDEX "Event_clientRequestId_key" ON "Event"("clientRequestId");
CREATE INDEX "Event_clientRequestId_idx" ON "Event"("clientRequestId");
