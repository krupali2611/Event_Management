import { Prisma, type Event, type PrismaClient, type VenueBooking } from '@prisma/client';
import {
  sendEventCancelledNotifications,
  sendEventUpdatedNotifications,
  sendNewEventCreatedNotificationToAdmins,
} from '../modules/notification/notification.service';
import { prisma } from '../config/prisma';
import { cancelBookingsForEventInTransaction, createBookingInTransaction } from './booking.service';
import { COUNTED_BOOKING_STATUSES } from '../modules/tickets/ticket.constants';
import type { AuthenticatedUser } from '../types/auth.types';
import type {
  CreateEventInput,
  EventDto,
  EventLifecycleStatus,
  EventListQuery,
  EventStatus,
  PaginatedEventsData,
  UpdateEventInput,
  UpdateEventStatusInput,
} from '../types/event.types';
import { dateTimeRangesOverlap, resolveDateTimeBoundary } from '../utils/dateUtils';
import { deleteFromCloudinary } from '../utils/deleteFromCloudinary';
import { AppError } from '../utils/response';
import { listEventChangeLabels } from '../modules/notification/notification.utils';

type EventRecord = Pick<
  Event,
  'id' | 'title' | 'description' | 'category' | 'startDate' | 'endDate' | 'startTime' | 'endTime' | 'attendeeLimit' | 'venueId' | 'organizerId' | 'status' | 'createdAt' | 'updatedAt'
> & {
  clientRequestId?: string | null;
  bannerImage?: string | null;
  bannerImagePublicId?: string | null;
  galleryImages?: string[];
  galleryImagePublicIds?: string[];
  ticketPrice?: number;
  venue?: { id: string; name: string; location: string; capacity: number; isActive: boolean } | null;
  organizer?: { id: string; name: string; email: string } | null;
};

type EventWithTicketMetrics = EventRecord & {
  soldTickets: number;
  remainingSeats: number;
};

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

type EventSchedule = {
  startDate: Date;
  endDate: Date;
  startTime: string | null;
  endTime: string | null;
};

type EventNotificationContext = {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  startTime: string | null;
  endTime: string | null;
  venue: { id: string; name: string; location: string } | null;
  organizer: { id: string; name: string; email: string };
};

function getEventDelegate(executor: PrismaExecutor = prisma) {
  if (!('event' in executor) || !executor.event) {
    throw new AppError('Event model is not available in the Prisma client. Run Prisma generate and restart the server.', 500);
  }

  return executor.event;
}

function getVenueBookingDelegate(executor: PrismaExecutor = prisma) {
  if (!('venueBooking' in executor) || !executor.venueBooking) {
    throw new AppError('VenueBooking model is not available in the Prisma client. Run Prisma generate and restart the server.', 500);
  }

  return executor.venueBooking;
}

function getVenueDelegate(executor: PrismaExecutor = prisma) {
  if (!('venue' in executor) || !executor.venue) {
    throw new AppError('Venue model is not available in the Prisma client. Run Prisma generate and restart the server.', 500);
  }

  return executor.venue;
}

function getTicketBookingDelegate(executor: PrismaExecutor = prisma) {
  if (!('ticketBooking' in executor) || !executor.ticketBooking) {
    throw new AppError('TicketBooking model is not available in the Prisma client. Run Prisma generate and restart the server.', 500);
  }

  return executor.ticketBooking;
}

function getRegistrationDelegate(executor: PrismaExecutor = prisma) {
  if (!('registration' in executor) || !executor.registration) {
    throw new AppError('Registration model is not available in the Prisma client. Run Prisma generate and restart the server.', 500);
  }

  return executor.registration;
}

async function cancelTicketBookingsForEventInTransaction(executor: PrismaExecutor, eventId: string): Promise<void> {
  await getTicketBookingDelegate(executor).updateMany({
    where: {
      eventId,
      bookingStatus: { not: 'CANCELLED' },
    },
    data: {
      bookingStatus: 'CANCELLED',
      cancelledAt: new Date(),
    },
  });
}

async function deleteEventRelationsInTransaction(executor: PrismaExecutor, eventId: string): Promise<void> {
  await getTicketBookingDelegate(executor).deleteMany({
    where: { eventId },
  });

  await getRegistrationDelegate(executor).deleteMany({
    where: { eventId },
  });

  await getVenueBookingDelegate(executor).deleteMany({
    where: { eventId },
  });
}

function getEventModelFieldNames(): Set<string> {
  const prismaMeta = Prisma as unknown as {
    dmmf?: {
      datamodel?: {
        models?: Array<{
          name: string;
          fields: Array<{ name: string }>;
        }>;
      };
    };
  };

  const eventModel = prismaMeta.dmmf?.datamodel?.models?.find((model) => model.name === 'Event');
  return new Set(eventModel?.fields.map((field) => field.name) ?? []);
}

const eventModelFields = getEventModelFieldNames();
let eventDatabaseFieldNamesPromise: Promise<Set<string>> | null = null;

function resetEventDatabaseFieldNamesCache(): void {
  eventDatabaseFieldNamesPromise = null;
}

function supportsEventField(fieldName: string): boolean {
  return eventModelFields.has(fieldName);
}

async function getEventDatabaseFieldNames(): Promise<Set<string>> {
  if (!eventDatabaseFieldNamesPromise) {
    eventDatabaseFieldNamesPromise = prisma
      .$queryRaw<Array<{ column_name: string }>>`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Event'
      `
      .then((rows) => new Set(rows.map((row) => row.column_name)))
      .catch(() => new Set<string>());
  }

  return eventDatabaseFieldNamesPromise;
}

async function supportsEventDatabaseField(fieldName: string): Promise<boolean> {
  if (!supportsEventField(fieldName)) {
    return false;
  }

  const fieldNames = await getEventDatabaseFieldNames();
  return fieldNames.has(fieldName);
}

function isMissingEventColumnError(error: unknown, fieldName: string): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.message.includes(`The column \`Event.${fieldName}\` does not exist in the current database.`);
}

async function withEventSchemaRetry<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (
      !isMissingEventColumnError(error, 'bannerImagePublicId') &&
      !isMissingEventColumnError(error, 'galleryImagePublicIds') &&
      !isMissingEventColumnError(error, 'clientRequestId')
    ) {
      throw error;
    }

    resetEventDatabaseFieldNamesCache();
    return operation();
  }
}

function toSqlTextArray(values: string[]): Prisma.Sql {
  if (values.length === 0) {
    return Prisma.sql`ARRAY[]::TEXT[]`;
  }

  return Prisma.sql`ARRAY[${Prisma.join(values)}]::TEXT[]`;
}

async function createEventRecord(
  executor: Prisma.TransactionClient,
  payload: {
    clientRequestId: string | null;
    title: string;
    description: string | null;
    bannerImage: string | null;
    galleryImages: string[];
    category: string;
    ticketPrice: number;
    startDate: Date;
    endDate: Date;
    startTime: string | null;
    endTime: string | null;
    attendeeLimit: number;
    venueId: string | null;
    organizerId: string;
    status: EventStatus;
  },
  optionalImageData: Record<string, string | string[] | null>,
  optionalScalarData: Record<string, number>,
): Promise<{ id: string; status: EventStatus }> {
  const [hasBannerImagePublicId, hasGalleryImagePublicIds, hasClientRequestId] = await Promise.all([
    supportsEventDatabaseField('bannerImagePublicId'),
    supportsEventDatabaseField('galleryImagePublicIds'),
    supportsEventDatabaseField('clientRequestId'),
  ]);

  if (hasBannerImagePublicId && hasGalleryImagePublicIds && hasClientRequestId) {
    return executor.event.create({
      data: {
        clientRequestId: payload.clientRequestId,
        title: payload.title,
        description: payload.description,
        ...optionalImageData,
        category: payload.category,
        ...optionalScalarData,
        startDate: payload.startDate,
        endDate: payload.endDate,
        startTime: payload.startTime,
        endTime: payload.endTime,
        attendeeLimit: payload.attendeeLimit,
        venueId: payload.venueId,
        organizerId: payload.organizerId,
        status: payload.status,
      },
      select: {
        id: true,
        status: true,
      },
    });
  }

  const insertedRows = await executor.$queryRaw<Array<{ id: string; status: EventStatus }>>`
    INSERT INTO "Event" (
      "clientRequestId",
      "title",
      "description",
      "bannerImage",
      "galleryImages",
      "category",
      "ticketPrice",
      "startDate",
      "endDate",
      "startTime",
      "endTime",
      "attendeeLimit",
      "venueId",
      "organizerId",
      "status"
    )
    VALUES (
      ${payload.clientRequestId},
      ${payload.title},
      ${payload.description},
      ${payload.bannerImage},
      ${toSqlTextArray(payload.galleryImages)},
      ${payload.category},
      ${payload.ticketPrice},
      ${payload.startDate},
      ${payload.endDate},
      ${payload.startTime},
      ${payload.endTime},
      ${payload.attendeeLimit},
      ${payload.venueId},
      ${payload.organizerId},
      ${payload.status}::"EVENT_STATUS"
    )
    RETURNING "id", "status"
  `;

  const insertedEvent = insertedRows[0];

  if (!insertedEvent) {
    throw new AppError('Event could not be created', 500);
  }

  return insertedEvent;
}

async function getOptionalEventImageData(input: {
  bannerImage?: string | null;
  bannerImagePublicId?: string | null;
  galleryImages?: string[];
  galleryImagePublicIds?: string[];
}): Promise<Record<string, string | string[] | null>> {
  const [hasBannerImage, hasBannerImagePublicId, hasGalleryImages, hasGalleryImagePublicIds] = await Promise.all([
    supportsEventDatabaseField('bannerImage'),
    supportsEventDatabaseField('bannerImagePublicId'),
    supportsEventDatabaseField('galleryImages'),
    supportsEventDatabaseField('galleryImagePublicIds'),
  ]);

  return {
    ...(hasBannerImage && input.bannerImage !== undefined ? { bannerImage: input.bannerImage } : {}),
    ...(hasBannerImagePublicId && input.bannerImagePublicId !== undefined ? { bannerImagePublicId: input.bannerImagePublicId } : {}),
    ...(hasGalleryImages && input.galleryImages !== undefined ? { galleryImages: input.galleryImages } : {}),
    ...(hasGalleryImagePublicIds && input.galleryImagePublicIds !== undefined ? { galleryImagePublicIds: input.galleryImagePublicIds } : {}),
  };
}

async function getOptionalEventScalarData(input: {
  ticketPrice?: number;
}): Promise<Record<string, number>> {
  const hasTicketPrice = await supportsEventDatabaseField('ticketPrice');

  return {
    ...(hasTicketPrice && input.ticketPrice !== undefined ? { ticketPrice: input.ticketPrice } : {}),
  };
}

async function getOptionalEventRequestData(input: {
  clientRequestId?: string | null;
}): Promise<Record<string, string | null>> {
  const hasClientRequestId = await supportsEventDatabaseField('clientRequestId');

  return {
    ...(hasClientRequestId && input.clientRequestId !== undefined ? { clientRequestId: input.clientRequestId } : {}),
  };
}

async function getEventSelect(includeRelations = false): Promise<Record<string, unknown>> {
  const [hasBannerImage, hasBannerImagePublicId, hasGalleryImages, hasGalleryImagePublicIds, hasTicketPrice, hasClientRequestId] = await Promise.all([
    supportsEventDatabaseField('bannerImage'),
    supportsEventDatabaseField('bannerImagePublicId'),
    supportsEventDatabaseField('galleryImages'),
    supportsEventDatabaseField('galleryImagePublicIds'),
    supportsEventDatabaseField('ticketPrice'),
    supportsEventDatabaseField('clientRequestId'),
  ]);

  return {
    id: true,
    title: true,
    description: true,
    category: true,
    startDate: true,
    endDate: true,
    startTime: true,
    endTime: true,
    attendeeLimit: true,
    venueId: true,
    organizerId: true,
    status: true,
    createdAt: true,
    updatedAt: true,
    ...(hasClientRequestId ? { clientRequestId: true } : {}),
    ...(hasBannerImage ? { bannerImage: true } : {}),
    ...(hasBannerImagePublicId ? { bannerImagePublicId: true } : {}),
    ...(hasGalleryImages ? { galleryImages: true } : {}),
    ...(hasGalleryImagePublicIds ? { galleryImagePublicIds: true } : {}),
    ...(hasTicketPrice ? { ticketPrice: true } : {}),
    ...(includeRelations
      ? {
          venue: { select: { id: true, name: true, location: true, capacity: true, isActive: true } },
          organizer: { select: { id: true, name: true, email: true } },
        }
      : {}),
  };
}

function buildGalleryImageEntries(event: Pick<EventRecord, 'galleryImages' | 'galleryImagePublicIds'>): Array<{ url: string; publicId: string | null }> {
  return (event.galleryImages ?? []).map((url, index) => ({
    url,
    publicId: event.galleryImagePublicIds?.[index] ?? null,
  }));
}

function resolveNextGalleryImagePublicIds(
  existingEvent: Pick<EventRecord, 'galleryImages' | 'galleryImagePublicIds'>,
  nextGalleryImages: string[],
  uploadedGalleryImagePublicIds: string[] = [],
): string[] {
  const existingEntries = buildGalleryImageEntries(existingEvent);
  const usedExistingIndexes = new Set<number>();
  let uploadedIndex = 0;

  return nextGalleryImages.map((imageUrl) => {
    const matchedIndex = existingEntries.findIndex(
      (entry, index) => !usedExistingIndexes.has(index) && entry.url === imageUrl,
    );

    if (matchedIndex >= 0) {
      usedExistingIndexes.add(matchedIndex);
      return existingEntries[matchedIndex]?.publicId ?? '';
    }

    const nextUploadedPublicId = uploadedGalleryImagePublicIds[uploadedIndex] ?? '';
    uploadedIndex += 1;
    return nextUploadedPublicId;
  });
}

function getRemovedGalleryImagePublicIds(
  existingEvent: Pick<EventRecord, 'galleryImages' | 'galleryImagePublicIds'>,
  nextGalleryImages?: string[],
): string[] {
  if (!nextGalleryImages) {
    return [];
  }

  const remainingEntries = [...buildGalleryImageEntries(existingEvent)];
  const keptPublicIds = new Set<string>();

  nextGalleryImages.forEach((imageUrl) => {
    const matchedIndex = remainingEntries.findIndex((entry) => entry.url === imageUrl);

    if (matchedIndex >= 0) {
      const [matchedEntry] = remainingEntries.splice(matchedIndex, 1);

      if (matchedEntry?.publicId) {
        keptPublicIds.add(matchedEntry.publicId);
      }
    }
  });

  return buildGalleryImageEntries(existingEvent)
    .filter((entry) => entry.publicId && !keptPublicIds.has(entry.publicId))
    .map((entry) => entry.publicId!);
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function normalizeEventPayload<T extends { title?: string; description?: string; category?: string; startTime?: string; endTime?: string }>(
  payload: T,
): T {
  return {
    ...payload,
    ...(payload.title !== undefined ? { title: normalizeText(payload.title) } : {}),
    ...(payload.description !== undefined ? { description: payload.description ? payload.description.trim() : undefined } : {}),
    ...(payload.category !== undefined ? { category: normalizeText(payload.category) } : {}),
    ...(payload.startTime !== undefined ? { startTime: payload.startTime ? payload.startTime.trim() : undefined } : {}),
    ...(payload.endTime !== undefined ? { endTime: payload.endTime ? payload.endTime.trim() : undefined } : {}),
  };
}

function getStartOfDay(date: Date): Date {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay;
}

function getEventStartAt(event: Pick<Event, 'startDate' | 'startTime'>): Date {
  return resolveDateTimeBoundary(event.startDate, event.startTime, false);
}

function getEventEndAt(event: Pick<Event, 'endDate' | 'endTime'>): Date {
  return resolveDateTimeBoundary(event.endDate, event.endTime, true);
}

function schedulesOverlap(left: EventSchedule, right: EventSchedule): boolean {
  return dateTimeRangesOverlap(getEventStartAt(left), getEventEndAt(left), getEventStartAt(right), getEventEndAt(right));
}

export function getEventStatus(event: Pick<Event, 'status' | 'startDate' | 'endDate' | 'startTime' | 'endTime'>): EventLifecycleStatus {
  if (event.status === 'CANCELLED') {
    return 'CANCELLED';
  }

  const now = new Date();
  const startAt = getEventStartAt(event);
  const endAt = getEventEndAt(event);

  if (now >= startAt && now <= endAt) {
    return 'ONGOING';
  }

  if (now > endAt) {
    return 'COMPLETED';
  }

  return 'UPCOMING';
}

function isEventVisibleToAttendees(event: Pick<Event, 'status' | 'startDate' | 'endDate' | 'startTime' | 'endTime'>): boolean {
  return event.status === 'PUBLISHED' && getEventStatus(event) === 'UPCOMING';
}

function getEventListPriority(event: Pick<Event, 'status' | 'startDate' | 'endDate' | 'startTime' | 'endTime'>): number {
  const lifecycleStatus = getEventStatus(event);

  if (event.status === 'CANCELLED' || lifecycleStatus === 'CANCELLED') {
    return 3;
  }

  if (lifecycleStatus === 'COMPLETED') {
    return 2;
  }

  if (lifecycleStatus === 'ONGOING') {
    return 0;
  }

  return 1;
}

function compareEventsForList(left: EventRecord, right: EventRecord): number {
  const priorityDifference = getEventListPriority(left) - getEventListPriority(right);

  if (priorityDifference !== 0) {
    return priorityDifference;
  }

  const startDateDifference = left.startDate.getTime() - right.startDate.getTime();

  if (startDateDifference !== 0) {
    return startDateDifference;
  }

  return right.createdAt.getTime() - left.createdAt.getTime();
}

function ensureValidDateRange(startDate: Date, endDate: Date): void {
  if (startDate.getTime() > endDate.getTime()) {
    throw new AppError('Start date must be on or before end date', 400);
  }
}

function ensureStartDateIsFuture(startDate: Date): void {
  const today = getStartOfDay(new Date());
  const normalizedStartDate = getStartOfDay(startDate);

  if (normalizedStartDate.getTime() <= today.getTime()) {
    throw new AppError('Event start date must be at least tomorrow', 400);
  }
}

function canTransitionToStatus(currentStatus: EventStatus, nextStatus: EventStatus): boolean {
  const transitions: Record<EventStatus, EventStatus[]> = {
    DRAFT: ['PUBLISHED'],
    PUBLISHED: ['CANCELLED'],
    CANCELLED: [],
  };

  return transitions[currentStatus].includes(nextStatus);
}

function assertEventIsMutable(event: Pick<Event, 'status'>): void {
  if (event.status === 'CANCELLED') {
    throw new AppError('Cancelled event cannot be modified', 400);
  }
}

function assertEventHasNotStarted(event: Pick<Event, 'startDate' | 'startTime'>): void {
  if (new Date() >= getEventStartAt(event)) {
    throw new AppError('Event already started. Editing not allowed.', 400);
  }
}

function canManageAllEvents(user: AuthenticatedUser): boolean {
  return user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
}

async function ensureExactEventScheduleIsUnique(input: {
  executor?: PrismaExecutor;
  eventId?: string;
  startDate: Date;
  endDate: Date;
  startTime?: string | null;
  endTime?: string | null;
}): Promise<void> {
  const conflictingEvent = await getEventDelegate(input.executor).findFirst({
    where: {
      status: { not: 'CANCELLED' },
      ...(input.eventId ? { NOT: { id: input.eventId } } : {}),
      startDate: input.startDate,
      endDate: input.endDate,
      startTime: input.startTime ?? null,
      endTime: input.endTime ?? null,
    },
    select: {
      id: true,
    },
  });

  if (conflictingEvent) {
    throw new AppError('An event already exists for the selected date and time slot', 409);
  }
}

async function ensureVenueScheduleConflictFree(input: {
  executor?: PrismaExecutor;
  eventId?: string;
  venueId: string;
  startDate: Date;
  endDate: Date;
  startTime?: string | null;
  endTime?: string | null;
}): Promise<void> {
  const candidateEvents = await getEventDelegate(input.executor).findMany({
    where: {
      venueId: input.venueId,
      status: { not: 'CANCELLED' },
      ...(input.eventId ? { NOT: { id: input.eventId } } : {}),
      startDate: { lte: input.endDate },
      endDate: { gte: input.startDate },
    },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      startTime: true,
      endTime: true,
    },
  });

  const conflictingEvent = candidateEvents.find((event) =>
    schedulesOverlap(
      {
        startDate: event.startDate,
        endDate: event.endDate,
        startTime: event.startTime,
        endTime: event.endTime,
      },
      {
        startDate: input.startDate,
        endDate: input.endDate,
        startTime: input.startTime ?? null,
        endTime: input.endTime ?? null,
      },
    ),
  );

  if (conflictingEvent) {
    throw new AppError('Venue is already booked for the selected schedule', 409);
  }
}

async function getActiveEventVenueBooking(eventId: string, executor: PrismaExecutor = prisma): Promise<VenueBooking | null> {
  return getVenueBookingDelegate(executor).findFirst({
    where: {
      eventId,
      status: 'BOOKED',
    },
  });
}

async function reserveVenueForPublishedEvent(eventId: string, input: {
  executor: PrismaExecutor;
  venueId: string;
  startDate: Date;
  endDate: Date;
  startTime?: string | null;
  endTime?: string | null;
  createdById?: string;
}): Promise<void> {
  await ensureVenueScheduleConflictFree({
    executor: input.executor,
    eventId,
    venueId: input.venueId,
    startDate: input.startDate,
    endDate: input.endDate,
    startTime: input.startTime,
    endTime: input.endTime,
  });

  await createBookingInTransaction(input.executor, {
    venueId: input.venueId,
    startDate: input.startDate.toISOString(),
    endDate: input.endDate.toISOString(),
    startTime: input.startTime ?? undefined,
    endTime: input.endTime ?? undefined,
    eventId,
    createdById: input.createdById,
  });
}

async function syncPublishedEventVenueBooking(
  executor: PrismaExecutor,
  eventId: string,
  currentEvent: Pick<Event, 'venueId'>,
  nextState: {
    venueId: string | null;
    startDate: Date;
    endDate: Date;
    startTime: string | null;
    endTime: string | null;
    organizerId: string;
  },
): Promise<void> {
  if (!nextState.venueId) {
    if (currentEvent.venueId) {
      await cancelBookingsForEventInTransaction(executor, eventId);
    }

    return;
  }

  await ensureVenueScheduleConflictFree({
    executor,
    eventId,
    venueId: nextState.venueId,
    startDate: nextState.startDate,
    endDate: nextState.endDate,
    startTime: nextState.startTime,
    endTime: nextState.endTime,
  });

  const existingBooking = await getActiveEventVenueBooking(eventId, executor);

  if (existingBooking) {
    await cancelBookingsForEventInTransaction(executor, eventId);
  }

  await createBookingInTransaction(executor, {
    venueId: nextState.venueId,
    startDate: nextState.startDate.toISOString(),
    endDate: nextState.endDate.toISOString(),
    startTime: nextState.startTime ?? undefined,
    endTime: nextState.endTime ?? undefined,
    eventId,
    createdById: nextState.organizerId,
  });
}

function toEventDto(
  event: EventWithTicketMetrics,
): EventDto {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    image: event.bannerImage ?? event.galleryImages?.[0] ?? null,
    bannerImage: event.bannerImage ?? null,
    galleryImages: event.galleryImages ?? [],
    category: event.category,
    ticketPrice: event.ticketPrice ?? 0,
    startDate: event.startDate,
    endDate: event.endDate,
    startTime: event.startTime,
    endTime: event.endTime,
    attendeeLimit: event.attendeeLimit,
    soldTickets: event.soldTickets,
    remainingSeats: event.remainingSeats,
    venueId: event.venueId,
    organizerId: event.organizerId,
    status: event.status as EventDto['status'],
    lifecycleStatus: getEventStatus(event),
    isEditable: event.status !== 'CANCELLED' && new Date() < getEventStartAt(event),
    isDeletable: event.status === 'CANCELLED' || getEventStatus(event) === 'COMPLETED',
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
    ...(event.venue ? { venue: event.venue } : {}),
    ...(event.organizer ? { organizer: event.organizer } : {}),
  };
}

async function getSoldTicketsByEventIds(eventIds: string[], executor: PrismaExecutor = prisma): Promise<Map<string, number>> {
  if (eventIds.length === 0) {
    return new Map();
  }

  const rows = await getTicketBookingDelegate(executor).groupBy({
    by: ['eventId'],
    where: {
      eventId: { in: eventIds },
      bookingStatus: { in: [...COUNTED_BOOKING_STATUSES] },
    },
    _sum: {
      quantity: true,
    },
  });

  return new Map(rows.map((row) => [row.eventId, row._sum.quantity ?? 0]));
}

async function attachTicketMetrics(events: EventRecord[], executor: PrismaExecutor = prisma): Promise<EventWithTicketMetrics[]> {
  const soldTicketsByEventId = await getSoldTicketsByEventIds(
    [...new Set(events.map((event) => event.id))],
    executor,
  );

  return events.map((event) => {
    const soldTickets = soldTicketsByEventId.get(event.id) ?? 0;

    return {
      ...event,
      soldTickets,
      remainingSeats: Math.max(event.attendeeLimit - soldTickets, 0),
    };
  });
}

async function ensureEventExists(id: string): Promise<EventRecord> {
  const event = (await getEventDelegate().findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      startDate: true,
      endDate: true,
      startTime: true,
      endTime: true,
      attendeeLimit: true,
      venueId: true,
      organizerId: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      bannerImage: true,
      bannerImagePublicId: true,
      galleryImages: true,
      galleryImagePublicIds: true,
    },
  })) as EventRecord | null;

  if (!event) {
    throw new AppError('Event not found', 404);
  }

  return event;
}

async function getEventNotificationContext(id: string, executor: PrismaExecutor = prisma): Promise<EventNotificationContext> {
  const event = await getEventDelegate(executor).findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      startDate: true,
      endDate: true,
      startTime: true,
      endTime: true,
      venue: {
        select: {
          id: true,
          name: true,
          location: true,
        },
      },
      organizer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!event) {
    throw new AppError('Event not found', 404);
  }

  return event;
}

async function ensureEventAccess(id: string, user: AuthenticatedUser): Promise<EventRecord> {
  const event = await ensureEventExists(id);

  if (canManageAllEvents(user)) {
    return event;
  }

  if (user.role === 'ORGANIZER' && event.organizerId === user.id) {
    return event;
  }

  if (user.role === 'ATTENDEE' && isEventVisibleToAttendees(event)) {
    return event;
  }

  throw new AppError('You do not have permission to access this event', 403);
}

async function validateVenueCapacity(venueId: string | null | undefined, attendeeLimit: number, executor: PrismaExecutor = prisma): Promise<void> {
  if (!venueId) {
    return;
  }

  const venue = await getVenueDelegate(executor).findUnique({
    where: { id: venueId },
    select: { id: true, capacity: true },
  });

  if (!venue) {
    throw new AppError('Venue not found', 404);
  }

  if (attendeeLimit > venue.capacity) {
    throw new AppError('Attendee limit exceeds venue capacity', 400);
  }
}

async function findEventByClientRequestId(clientRequestId: string | undefined, organizerId: string): Promise<EventRecord | null> {
  if (!clientRequestId || !(await supportsEventDatabaseField('clientRequestId'))) {
    return null;
  }

  return (await getEventDelegate().findFirst({
    where: {
      clientRequestId,
      organizerId,
    },
    select: (await getEventSelect(true)) as never,
  })) as EventRecord | null;
}

export async function createEvent(payload: CreateEventInput, actor: AuthenticatedUser): Promise<EventDto> {
  const eventDelegate = getEventDelegate();
  const normalizedPayload = normalizeEventPayload(payload);
  const startDate = new Date(normalizedPayload.startDate);
  const endDate = new Date(normalizedPayload.endDate);
  ensureValidDateRange(startDate, endDate);
  ensureStartDateIsFuture(startDate);
  const existingEventForRequest = await findEventByClientRequestId(normalizedPayload.clientRequestId, normalizedPayload.organizerId);

  if (existingEventForRequest) {
    return toEventDto((await attachTicketMetrics([existingEventForRequest]))[0]!);
  }

  let createdEvent: { id: string; status: EventStatus };

  try {
    createdEvent = await withEventSchemaRetry(() =>
      prisma.$transaction(async (transaction) => {
        await validateVenueCapacity(normalizedPayload.venueId, normalizedPayload.attendeeLimit, transaction);
        await ensureExactEventScheduleIsUnique({
          executor: transaction,
          startDate,
          endDate,
          startTime: normalizedPayload.startTime ?? null,
          endTime: normalizedPayload.endTime ?? null,
        });

        if (normalizedPayload.venueId) {
          await ensureVenueScheduleConflictFree({
            executor: transaction,
            venueId: normalizedPayload.venueId,
            startDate,
            endDate,
            startTime: normalizedPayload.startTime ?? null,
            endTime: normalizedPayload.endTime ?? null,
          });
        }

        const [optionalImageData, optionalScalarData, optionalRequestData] = await Promise.all([
          getOptionalEventImageData({
            bannerImage: normalizedPayload.bannerImage ?? null,
            bannerImagePublicId: normalizedPayload.bannerImagePublicId ?? null,
            galleryImages: normalizedPayload.galleryImages ?? [],
            galleryImagePublicIds: normalizedPayload.galleryImagePublicIds ?? [],
          }),
          getOptionalEventScalarData({ ticketPrice: normalizedPayload.ticketPrice }),
          getOptionalEventRequestData({ clientRequestId: normalizedPayload.clientRequestId ?? null }),
        ]);

        const event = await createEventRecord(
          transaction,
          {
            clientRequestId: typeof optionalRequestData.clientRequestId === 'string' ? optionalRequestData.clientRequestId : null,
            title: normalizedPayload.title,
            description: normalizedPayload.description ?? null,
            bannerImage: normalizedPayload.bannerImage ?? null,
            galleryImages: normalizedPayload.galleryImages ?? [],
            category: normalizedPayload.category,
            ticketPrice: normalizedPayload.ticketPrice,
            startDate,
            endDate,
            startTime: normalizedPayload.startTime ?? null,
            endTime: normalizedPayload.endTime ?? null,
            attendeeLimit: normalizedPayload.attendeeLimit,
            venueId: normalizedPayload.venueId ?? null,
            organizerId: normalizedPayload.organizerId,
            status: normalizedPayload.status ?? 'DRAFT',
          },
          optionalImageData,
          optionalScalarData,
        );

        if (!normalizedPayload.venueId || event.status !== 'PUBLISHED') {
          return event;
        }

        await reserveVenueForPublishedEvent(event.id, {
          executor: transaction,
          venueId: normalizedPayload.venueId,
          startDate,
          endDate,
          startTime: normalizedPayload.startTime ?? null,
          endTime: normalizedPayload.endTime ?? null,
          createdById: normalizedPayload.organizerId,
        });

        return event;
      }),
    );
  } catch (error) {
    if (
      normalizedPayload.clientRequestId &&
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const duplicateEvent = await findEventByClientRequestId(normalizedPayload.clientRequestId, normalizedPayload.organizerId);

      if (duplicateEvent) {
        return toEventDto((await attachTicketMetrics([duplicateEvent]))[0]!);
      }
    }

    throw error;
  }

  const event = (await eventDelegate.findUnique({ where: { id: createdEvent.id }, select: (await getEventSelect(true)) as never })) as EventRecord | null;

  if (!event) {
    throw new AppError('Event not found after creation', 500);
  }

  if (actor.role === 'ORGANIZER') {
    try {
      await sendNewEventCreatedNotificationToAdmins(await getEventNotificationContext(createdEvent.id));
    } catch (error) {
      console.error('[event:create] Admin notification failed after event creation', error);
    }
  }

  return toEventDto((await attachTicketMetrics([event]))[0]!);
}

export async function getEvents(query: EventListQuery, user: AuthenticatedUser): Promise<PaginatedEventsData> {
  const andConditions: Prisma.EventWhereInput[] = [];
  const whereClause: Prisma.EventWhereInput = {
    ...(query.search
      ? {
          OR: [
            { title: { contains: query.search, mode: 'insensitive' } },
            { category: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  if (canManageAllEvents(user)) {
    if (query.status) {
      whereClause.status = query.status;
    }
  } else if (user.role === 'ORGANIZER') {
    whereClause.organizerId = user.id;

    if (query.status) {
      whereClause.status = query.status;
    }
  } else {
    whereClause.status = 'PUBLISHED';
    andConditions.push({ endDate: { gte: getStartOfDay(new Date()) } });
  }

  if (query.date) {
    const selectedDate = new Date(query.date);
    selectedDate.setHours(0, 0, 0, 0);
    const rangeEnd = new Date(selectedDate);
    rangeEnd.setHours(23, 59, 59, 999);
    andConditions.push({ startDate: { lte: rangeEnd } });
    andConditions.push({ endDate: { gte: selectedDate } });
  }

  if (andConditions.length > 0) {
    whereClause.AND = andConditions;
  }

  const isAttendeeQuery = user.role === 'ATTENDEE';
  const skip = (query.page - 1) * query.limit;
  const [items, totalItems] = isAttendeeQuery
    ? await Promise.all([
        getEventDelegate().findMany({
          where: whereClause,
          select: (await getEventSelect(true)) as never,
          orderBy: [{ startDate: 'asc' }, { createdAt: 'desc' }],
        }),
        Promise.resolve(0),
      ])
    : await Promise.all([
        getEventDelegate().findMany({
          where: whereClause,
          select: (await getEventSelect(true)) as never,
          orderBy: [{ startDate: 'asc' }, { createdAt: 'desc' }],
          skip,
          take: query.limit,
        }),
        getEventDelegate().count({ where: whereClause }),
      ]);

  const eventsWithMetrics = (await attachTicketMetrics(items as EventRecord[])).sort(compareEventsForList);
  const attendeeVisibleEvents = isAttendeeQuery ? eventsWithMetrics.filter(isEventVisibleToAttendees) : eventsWithMetrics;
  const paginatedEvents = isAttendeeQuery ? attendeeVisibleEvents.slice(skip, skip + query.limit) : attendeeVisibleEvents;
  const resolvedTotalItems = isAttendeeQuery ? attendeeVisibleEvents.length : totalItems;

  return {
    events: paginatedEvents.map(toEventDto),
    pagination: {
      total: resolvedTotalItems,
      page: query.page,
      limit: query.limit,
      totalPages: Math.max(1, Math.ceil(resolvedTotalItems / query.limit)),
    },
  };
}

export async function getPublicEvents(query: EventListQuery): Promise<PaginatedEventsData> {
  const andConditions: Prisma.EventWhereInput[] = [{ endDate: { gte: getStartOfDay(new Date()) } }];
  const whereClause: Prisma.EventWhereInput = {
    status: 'PUBLISHED',
    ...(query.search
      ? {
          OR: [
            { title: { contains: query.search, mode: 'insensitive' } },
            { category: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  if (query.date) {
    const selectedDate = new Date(query.date);
    selectedDate.setHours(0, 0, 0, 0);
    const rangeEnd = new Date(selectedDate);
    rangeEnd.setHours(23, 59, 59, 999);
    andConditions.push({ startDate: { lte: rangeEnd } });
    andConditions.push({ endDate: { gte: selectedDate } });
  }

  whereClause.AND = andConditions;

  const skip = (query.page - 1) * query.limit;
  const items = await getEventDelegate().findMany({
    where: whereClause,
    select: (await getEventSelect(true)) as never,
    orderBy: [{ startDate: 'asc' }, { createdAt: 'desc' }],
  });

  const eventsWithMetrics = await attachTicketMetrics(items as EventRecord[]);
  const upcomingEvents = eventsWithMetrics.filter(isEventVisibleToAttendees);
  const paginatedEvents = upcomingEvents.slice(skip, skip + query.limit);
  const totalItems = upcomingEvents.length;

  return {
    events: paginatedEvents.map(toEventDto),
    pagination: {
      total: totalItems,
      page: query.page,
      limit: query.limit,
      totalPages: Math.max(1, Math.ceil(totalItems / query.limit)),
    },
  };
}

export async function getEventById(id: string, user: AuthenticatedUser): Promise<EventDto> {
  await ensureEventAccess(id, user);
  const event = (await getEventDelegate().findUnique({
    where: { id },
    select: (await getEventSelect(true)) as never,
  })) as EventRecord | null;

  if (!event) {
    throw new AppError('Event not found', 404);
  }

  return toEventDto((await attachTicketMetrics([event]))[0]!);
}

export async function getPublicEventById(id: string): Promise<EventDto> {
  const event = (await getEventDelegate().findFirst({
    where: {
      id,
      status: 'PUBLISHED',
      endDate: { gte: getStartOfDay(new Date()) },
    },
    select: (await getEventSelect(true)) as never,
  })) as EventRecord | null;

  if (!event) {
    throw new AppError('Event not found', 404);
  }

  const resolvedEvent = (await attachTicketMetrics([event]))[0]!;

  if (!isEventVisibleToAttendees(resolvedEvent)) {
    throw new AppError('Event not found', 404);
  }

  return toEventDto(resolvedEvent);
}

export async function updateEvent(id: string, payload: UpdateEventInput, user: AuthenticatedUser): Promise<EventDto> {
  const existingEvent = await ensureEventAccess(id, user);
  const previousNotificationContext = await getEventNotificationContext(id);
  assertEventIsMutable(existingEvent);
  assertEventHasNotStarted(existingEvent);
  const normalizedPayload = normalizeEventPayload(payload);
  const nextStartDate = new Date(normalizedPayload.startDate ?? existingEvent.startDate.toISOString());
  const nextEndDate = new Date(normalizedPayload.endDate ?? existingEvent.endDate.toISOString());
  ensureValidDateRange(nextStartDate, nextEndDate);
  ensureStartDateIsFuture(nextStartDate);
  const nextVenueId = normalizedPayload.venueId === undefined ? existingEvent.venueId : normalizedPayload.venueId;
  const nextAttendeeLimit = normalizedPayload.attendeeLimit ?? existingEvent.attendeeLimit;
  const nextStartTime = normalizedPayload.startTime === undefined ? existingEvent.startTime : normalizedPayload.startTime ?? null;
  const nextEndTime = normalizedPayload.endTime === undefined ? existingEvent.endTime : normalizedPayload.endTime ?? null;

  const scheduleChanged =
    normalizedPayload.startDate !== undefined ||
    normalizedPayload.endDate !== undefined ||
    normalizedPayload.startTime !== undefined ||
    normalizedPayload.endTime !== undefined;
  const venueChanged = normalizedPayload.venueId !== undefined && normalizedPayload.venueId !== existingEvent.venueId;
  const nextBannerImage = normalizedPayload.bannerImage === undefined ? existingEvent.bannerImage ?? null : normalizedPayload.bannerImage;
  const nextBannerImagePublicId =
    normalizedPayload.bannerImage === undefined
      ? existingEvent.bannerImagePublicId ?? null
      : normalizedPayload.bannerImagePublicId ?? null;
  const nextGalleryImages = normalizedPayload.galleryImages ?? existingEvent.galleryImages ?? [];
  const nextGalleryImagePublicIds =
    normalizedPayload.galleryImages !== undefined
      ? resolveNextGalleryImagePublicIds(existingEvent, normalizedPayload.galleryImages, normalizedPayload.galleryImagePublicIds ?? [])
      : existingEvent.galleryImagePublicIds ?? [];
  const removedGalleryImagePublicIds =
    normalizedPayload.galleryImages !== undefined ? getRemovedGalleryImagePublicIds(existingEvent, normalizedPayload.galleryImages) : [];
  const shouldDeletePreviousBanner =
    normalizedPayload.bannerImage !== undefined &&
    existingEvent.bannerImagePublicId !== undefined &&
    existingEvent.bannerImagePublicId !== null &&
    existingEvent.bannerImagePublicId !== nextBannerImagePublicId;

  const [optionalImageData, optionalScalarData] = await Promise.all([
    getOptionalEventImageData({
      ...(normalizedPayload.bannerImage !== undefined ? { bannerImage: nextBannerImage, bannerImagePublicId: nextBannerImagePublicId } : {}),
      ...(normalizedPayload.galleryImages !== undefined ? { galleryImages: nextGalleryImages, galleryImagePublicIds: nextGalleryImagePublicIds } : {}),
    }),
    getOptionalEventScalarData({ ticketPrice: normalizedPayload.ticketPrice }),
  ]);
  const nextEventState: EventRecord = {
    ...existingEvent,
    ...(normalizedPayload.title !== undefined ? { title: normalizedPayload.title } : {}),
    ...(normalizedPayload.description !== undefined ? { description: normalizedPayload.description ?? null } : {}),
    ...(normalizedPayload.category !== undefined ? { category: normalizedPayload.category } : {}),
    ...(normalizedPayload.startDate !== undefined ? { startDate: nextStartDate } : {}),
    ...(normalizedPayload.endDate !== undefined ? { endDate: nextEndDate } : {}),
    startTime: nextStartTime,
    endTime: nextEndTime,
    attendeeLimit: nextAttendeeLimit,
    venueId: nextVenueId,
    ...(normalizedPayload.ticketPrice !== undefined ? { ticketPrice: normalizedPayload.ticketPrice } : {}),
    ...(normalizedPayload.bannerImage !== undefined ? { bannerImage: nextBannerImage, bannerImagePublicId: nextBannerImagePublicId } : {}),
    ...(normalizedPayload.galleryImages !== undefined ? { galleryImages: nextGalleryImages, galleryImagePublicIds: nextGalleryImagePublicIds } : {}),
  };
  const shouldNotifyAttendees =
    existingEvent.status === 'PUBLISHED' &&
    listEventChangeLabels({
      previous: {
        startDate: existingEvent.startDate,
        endDate: existingEvent.endDate,
        startTime: existingEvent.startTime,
        endTime: existingEvent.endTime,
        venueId: existingEvent.venueId,
      },
      next: {
        startDate: nextEventState.startDate,
        endDate: nextEventState.endDate,
        startTime: nextEventState.startTime,
        endTime: nextEventState.endTime,
        venueId: nextEventState.venueId,
      },
    }).length > 0;
  const shouldNotifyCancellation =
    existingEvent.status === 'PUBLISHED' &&
    normalizedPayload.status === 'CANCELLED';

  await withEventSchemaRetry(() =>
    prisma.$transaction(async (transaction) => {
      await validateVenueCapacity(nextVenueId, nextAttendeeLimit, transaction);
      await ensureExactEventScheduleIsUnique({
        executor: transaction,
        eventId: id,
        startDate: nextStartDate,
        endDate: nextEndDate,
        startTime: nextStartTime,
        endTime: nextEndTime,
      });

      if (nextVenueId && (scheduleChanged || venueChanged)) {
        await ensureVenueScheduleConflictFree({
          executor: transaction,
          eventId: id,
          venueId: nextVenueId,
          startDate: nextStartDate,
          endDate: nextEndDate,
          startTime: nextStartTime,
          endTime: nextEndTime,
        });
      }

      if (existingEvent.status === 'PUBLISHED' && (scheduleChanged || venueChanged)) {
        await syncPublishedEventVenueBooking(transaction, id, existingEvent, {
          venueId: nextVenueId,
          startDate: nextStartDate,
          endDate: nextEndDate,
          startTime: nextStartTime,
          endTime: nextEndTime,
          organizerId: existingEvent.organizerId,
        });
      }

      await getEventDelegate(transaction).update({
        where: { id },
        data: {
          ...(normalizedPayload.title !== undefined ? { title: normalizedPayload.title } : {}),
          ...(normalizedPayload.description !== undefined ? { description: normalizedPayload.description ?? null } : {}),
          ...optionalImageData,
          ...(normalizedPayload.category !== undefined ? { category: normalizedPayload.category } : {}),
          ...optionalScalarData,
          ...(normalizedPayload.startDate !== undefined ? { startDate: nextStartDate } : {}),
          ...(normalizedPayload.endDate !== undefined ? { endDate: nextEndDate } : {}),
          ...(normalizedPayload.startTime !== undefined ? { startTime: normalizedPayload.startTime ?? null } : {}),
          ...(normalizedPayload.endTime !== undefined ? { endTime: normalizedPayload.endTime ?? null } : {}),
          ...(normalizedPayload.attendeeLimit !== undefined ? { attendeeLimit: normalizedPayload.attendeeLimit } : {}),
          ...(normalizedPayload.venueId !== undefined ? { venueId: normalizedPayload.venueId } : {}),
        },
        select: {
          id: true,
        },
      });

      if (normalizedPayload.status !== undefined && normalizedPayload.status !== existingEvent.status) {
        await updateEventStatusInTransaction(transaction, id, { status: normalizedPayload.status }, user, nextEventState);
      }
    }),
  );

  if (shouldDeletePreviousBanner) {
    await deleteFromCloudinary(existingEvent.bannerImagePublicId);
  }

  if (removedGalleryImagePublicIds.length > 0) {
    await Promise.all(removedGalleryImagePublicIds.map((publicId) => deleteFromCloudinary(publicId)));
  }

  if (shouldNotifyAttendees && !shouldNotifyCancellation) {
    await sendEventUpdatedNotifications({
      previous: {
        startDate: previousNotificationContext.startDate,
        endDate: previousNotificationContext.endDate,
        startTime: previousNotificationContext.startTime,
        endTime: previousNotificationContext.endTime,
        venue: previousNotificationContext.venue,
      },
      next: await getEventNotificationContext(id),
    });
  }

  if (shouldNotifyCancellation) {
    await sendEventCancelledNotifications(await getEventNotificationContext(id));
  }

  return getEventById(id, user);
}

export async function updateEventStatus(id: string, payload: UpdateEventStatusInput, user: AuthenticatedUser): Promise<EventDto> {
  const existingEvent = await ensureEventAccess(id, user);
  await prisma.$transaction(async (transaction) => {
    await updateEventStatusInTransaction(transaction, id, payload, user, existingEvent);
  });
  if (existingEvent.status === 'PUBLISHED' && payload.status === 'CANCELLED') {
    await sendEventCancelledNotifications(await getEventNotificationContext(id));
  }
  return getEventById(id, user);
}

async function updateEventStatusInTransaction(
  transaction: Prisma.TransactionClient,
  id: string,
  payload: UpdateEventStatusInput,
  user: AuthenticatedUser,
  existingEvent?: EventRecord,
): Promise<void> {
  const currentEvent = existingEvent ?? (await ensureEventAccess(id, user));
  assertEventIsMutable(currentEvent);

  if (currentEvent.status === payload.status) {
    return;
  }

  if (!canTransitionToStatus(currentEvent.status as EventStatus, payload.status)) {
    throw new AppError(`Invalid event status transition from ${currentEvent.status} to ${payload.status}`, 400);
  }

  if (payload.status === 'PUBLISHED') {
    if (!currentEvent.venueId) {
      throw new AppError('A venue is required before publishing an event', 400);
    }

    ensureStartDateIsFuture(currentEvent.startDate);
    await reserveVenueForPublishedEvent(id, {
      executor: transaction,
      venueId: currentEvent.venueId,
      startDate: currentEvent.startDate,
      endDate: currentEvent.endDate,
      startTime: currentEvent.startTime,
      endTime: currentEvent.endTime,
      createdById: currentEvent.organizerId,
    });
  }

  if (currentEvent.status === 'PUBLISHED' && payload.status === 'CANCELLED') {
    await cancelTicketBookingsForEventInTransaction(transaction, id);
    await cancelBookingsForEventInTransaction(transaction, id);
  }

  await getEventDelegate(transaction).update({
    where: { id },
    data: { status: payload.status },
    select: {
      id: true,
    },
  });

}

export async function deleteEvent(id: string, user: AuthenticatedUser): Promise<void> {
  const event = await ensureEventAccess(id, user);

  if (event.status !== 'CANCELLED' && getEventStatus(event) !== 'COMPLETED') {
    throw new AppError('Only cancelled or completed events can be deleted', 400);
  }

  await prisma.$transaction(async (transaction) => {
    await deleteEventRelationsInTransaction(transaction, id);

    await getEventDelegate(transaction).delete({
      where: { id },
      select: {
        id: true,
      },
    });
  });

  await Promise.all([
    deleteFromCloudinary(event.bannerImagePublicId),
    ...((event.galleryImagePublicIds ?? []).map((publicId) => deleteFromCloudinary(publicId))),
  ]);
}
