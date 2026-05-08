-- CreateEnum
CREATE TYPE "BOOKING_STATUS" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PAYMENT_STATUS" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUN_PENDING', 'REFUNDED');

-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "galleryImages" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Venue" ALTER COLUMN "amenities" DROP DEFAULT;

-- CreateTable
CREATE TABLE "TicketBooking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "bookingStatus" "BOOKING_STATUS" NOT NULL DEFAULT 'PENDING',
    "paymentStatus" "PAYMENT_STATUS" NOT NULL DEFAULT 'PENDING',
    "ticketNumber" TEXT NOT NULL,
    "qrCode" TEXT,
    "bookedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TicketBooking_ticketNumber_key" ON "TicketBooking"("ticketNumber");

-- CreateIndex
CREATE INDEX "TicketBooking_userId_idx" ON "TicketBooking"("userId");

-- CreateIndex
CREATE INDEX "TicketBooking_eventId_idx" ON "TicketBooking"("eventId");

-- CreateIndex
CREATE INDEX "TicketBooking_bookingStatus_idx" ON "TicketBooking"("bookingStatus");

-- CreateIndex
CREATE INDEX "TicketBooking_paymentStatus_idx" ON "TicketBooking"("paymentStatus");

-- CreateIndex
CREATE INDEX "TicketBooking_bookedAt_idx" ON "TicketBooking"("bookedAt");

-- CreateIndex
CREATE INDEX "TicketBooking_eventId_bookingStatus_idx" ON "TicketBooking"("eventId", "bookingStatus");

-- CreateIndex
CREATE INDEX "TicketBooking_eventId_paymentStatus_idx" ON "TicketBooking"("eventId", "paymentStatus");

-- CreateIndex
CREATE INDEX "TicketBooking_userId_bookingStatus_idx" ON "TicketBooking"("userId", "bookingStatus");

-- CreateIndex
CREATE INDEX "TicketBooking_userId_eventId_createdAt_idx" ON "TicketBooking"("userId", "eventId", "createdAt");

-- AddForeignKey
ALTER TABLE "TicketBooking" ADD CONSTRAINT "TicketBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketBooking" ADD CONSTRAINT "TicketBooking_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
