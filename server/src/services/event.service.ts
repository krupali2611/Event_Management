import { Prisma, type Event, type VenueBooking } from '@prisma/client';
import { prisma } from '../config/prisma';
import { cancelBookingsForEvent } from './booking.service';
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
import { bookingApiClient } from '../utils/apiClient';
import { AppError } from '../utils/response';

type EventRecord = Pick<
  Event,
  'id' | 'title' | 'description' | 'category' | 'startDate' | 'endDate' | 'startTime' | 'endTime' | 'attendeeLimit' | 'venueId' | 'organizerId' | 'status' | 'createdAt' | 'updatedAt'
> & {
  bannerImage?: string | null;
  galleryImages?: string[];
  ticketPrice?: number;
  venue?: { id: string; name: string; location: string; capacity: number; isActive: boolean } | null;
  organizer?: { id: string; name: string; email: string } | null;
};

function getEventDelegate() {
  if (!('event' in prisma) || !prisma.event) {
    throw new AppError('Event model is not available in the Prisma client. Run Prisma generate and restart the server.', 500);
  }

  return prisma.event;
}

function getVenueBookingDelegate() {
  if (!('venueBooking' in prisma) || !prisma.venueBooking) {
    throw new AppError('VenueBooking model is not available in the Prisma client. Run Prisma generate and restart the server.', 500);
  }

  return prisma.venueBooking;
}

function getVenueDelegate() {
  if (!('venue' in prisma) || !prisma.venue) {
    throw new AppError('Venue model is not available in the Prisma client. Run Prisma generate and restart the server.', 500);
  }

  return prisma.venue;
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

async function getOptionalEventImageData(input: {
  bannerImage?: string | null;
  galleryImages?: string[];
}): Promise<Record<string, string | string[] | null>> {
  const [hasBannerImage, hasGalleryImages] = await Promise.all([
    supportsEventDatabaseField('bannerImage'),
    supportsEventDatabaseField('galleryImages'),
  ]);

  return {
    ...(hasBannerImage && input.bannerImage !== undefined ? { bannerImage: input.bannerImage } : {}),
    ...(hasGalleryImages && input.galleryImages !== undefined ? { galleryImages: input.galleryImages } : {}),
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

async function getEventSelect(includeRelations = false): Promise<Record<string, unknown>> {
  const [hasBannerImage, hasGalleryImages, hasTicketPrice] = await Promise.all([
    supportsEventDatabaseField('bannerImage'),
    supportsEventDatabaseField('galleryImages'),
    supportsEventDatabaseField('ticketPrice'),
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
    ...(hasBannerImage ? { bannerImage: true } : {}),
    ...(hasGalleryImages ? { galleryImages: true } : {}),
    ...(hasTicketPrice ? { ticketPrice: true } : {}),
    ...(includeRelations
      ? {
          venue: { select: { id: true, name: true, location: true, capacity: true, isActive: true } },
          organizer: { select: { id: true, name: true, email: true } },
        }
      : {}),
  };
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

function resolveEventBoundary(date: Date, time: string | null | undefined, endOfDay: boolean): Date {
  const boundary = new Date(date);

  if (!time) {
    boundary.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
    return boundary;
  }

  const [hoursPart, minutesPart] = time.split(':');
  const hours = Number.parseInt(hoursPart ?? '0', 10);
  const minutes = Number.parseInt(minutesPart ?? '0', 10);
  boundary.setHours(Number.isNaN(hours) ? 0 : hours, Number.isNaN(minutes) ? 0 : minutes, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  return boundary;
}

function getEventStartAt(event: Pick<Event, 'startDate' | 'startTime'>): Date {
  return resolveEventBoundary(event.startDate, event.startTime, false);
}

function getEventEndAt(event: Pick<Event, 'endDate' | 'endTime'>): Date {
  return resolveEventBoundary(event.endDate, event.endTime, true);
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

async function ensurePublishedVenueConflictFree(input: {
  eventId?: string;
  venueId: string;
  startDate: Date;
  endDate: Date;
}): Promise<void> {
  const conflictingEvent = await getEventDelegate().findFirst({
    where: {
      venueId: input.venueId,
      status: 'PUBLISHED',
      ...(input.eventId ? { NOT: { id: input.eventId } } : {}),
      AND: [
        {
          startDate: { lt: input.endDate },
        },
        {
          endDate: { gt: input.startDate },
        },
      ],
    },
    select: { id: true },
  });

  if (conflictingEvent) {
    throw new AppError('Venue is already booked for the selected schedule', 409);
  }
}

async function getActiveEventVenueBooking(eventId: string): Promise<VenueBooking | null> {
  return getVenueBookingDelegate().findFirst({
    where: {
      eventId,
      status: 'BOOKED',
    },
  });
}

async function reserveVenueForPublishedEvent(eventId: string, input: {
  venueId: string;
  startDate: Date;
  endDate: Date;
  startTime?: string | null;
  endTime?: string | null;
  createdById?: string;
}): Promise<void> {
  await ensurePublishedVenueConflictFree({
    eventId,
    venueId: input.venueId,
    startDate: input.startDate,
    endDate: input.endDate,
  });

  await bookingApiClient.reserveVenue({
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
      await bookingApiClient.cancelEventVenueReservation(eventId);
    }

    return;
  }

  await ensurePublishedVenueConflictFree({
    eventId,
    venueId: nextState.venueId,
    startDate: nextState.startDate,
    endDate: nextState.endDate,
  });

  const existingBooking = await getActiveEventVenueBooking(eventId);

  if (existingBooking) {
    await bookingApiClient.cancelEventVenueReservation(eventId);
  }

  await bookingApiClient.reserveVenue({
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
  event: EventRecord,
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
    venueId: event.venueId,
    organizerId: event.organizerId,
    status: event.status as EventDto['status'],
    lifecycleStatus: getEventStatus(event),
    isEditable: event.status !== 'CANCELLED' && new Date() < getEventStartAt(event),
    isDeletable: event.status === 'CANCELLED',
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
    ...(event.venue ? { venue: event.venue } : {}),
    ...(event.organizer ? { organizer: event.organizer } : {}),
  };
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
    },
  })) as EventRecord | null;

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

  if (user.role === 'ATTENDEE' && event.status === 'PUBLISHED' && getEventStatus(event) === 'UPCOMING') {
    return event;
  }

  throw new AppError('You do not have permission to access this event', 403);
}

async function validateVenueCapacity(venueId: string | null | undefined, attendeeLimit: number): Promise<void> {
  if (!venueId) {
    return;
  }

  const venue = await getVenueDelegate().findUnique({
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

export async function createEvent(payload: CreateEventInput): Promise<EventDto> {
  const eventDelegate = getEventDelegate();
  const normalizedPayload = normalizeEventPayload(payload);
  const startDate = new Date(normalizedPayload.startDate);
  const endDate = new Date(normalizedPayload.endDate);
  ensureValidDateRange(startDate, endDate);
  ensureStartDateIsFuture(startDate);
  await validateVenueCapacity(normalizedPayload.venueId, normalizedPayload.attendeeLimit);

  const createdEvent = await prisma.$transaction(async (transaction) => {
    const [optionalImageData, optionalScalarData] = await Promise.all([
      getOptionalEventImageData({
        bannerImage: normalizedPayload.bannerImage ?? null,
        galleryImages: normalizedPayload.galleryImages ?? [],
      }),
      getOptionalEventScalarData({ ticketPrice: normalizedPayload.ticketPrice }),
    ]);

    const event = await transaction.event.create({
      data: {
        title: normalizedPayload.title,
        description: normalizedPayload.description ?? null,
        ...optionalImageData,
        category: normalizedPayload.category,
        ...optionalScalarData,
        startDate,
        endDate,
        startTime: normalizedPayload.startTime ?? null,
        endTime: normalizedPayload.endTime ?? null,
        attendeeLimit: normalizedPayload.attendeeLimit,
        venueId: normalizedPayload.venueId ?? null,
        organizerId: normalizedPayload.organizerId,
        status: normalizedPayload.status ?? 'DRAFT',
      },
    });

    if (!normalizedPayload.venueId || event.status !== 'PUBLISHED') {
      return event;
    }

    await reserveVenueForPublishedEvent(event.id, {
      venueId: normalizedPayload.venueId,
      startDate,
      endDate,
      startTime: normalizedPayload.startTime ?? null,
      endTime: normalizedPayload.endTime ?? null,
      createdById: normalizedPayload.organizerId,
    });

    return event;
  });

  const event = (await eventDelegate.findUnique({ where: { id: createdEvent.id }, select: (await getEventSelect(true)) as never })) as EventRecord | null;

  if (!event) {
    throw new AppError('Event not found after creation', 500);
  }

  return toEventDto(event);
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
    andConditions.push({ startDate: { gt: new Date() } });
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

  const skip = (query.page - 1) * query.limit;
  const [items, totalItems] = await Promise.all([
    getEventDelegate().findMany({
      where: whereClause,
      select: (await getEventSelect(true)) as never,
      orderBy: [{ startDate: 'asc' }, { createdAt: 'desc' }],
      skip,
      take: query.limit,
    }),
    getEventDelegate().count({ where: whereClause }),
  ]);

  return {
    events: (items as EventRecord[]).map(toEventDto),
    pagination: {
      total: totalItems,
      page: query.page,
      limit: query.limit,
      totalPages: Math.max(1, Math.ceil(totalItems / query.limit)),
    },
  };
}

export async function getPublicEvents(query: EventListQuery): Promise<PaginatedEventsData> {
  const andConditions: Prisma.EventWhereInput[] = [{ startDate: { gt: new Date() } }];
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
  const [items, totalItems] = await Promise.all([
    getEventDelegate().findMany({
      where: whereClause,
      select: (await getEventSelect(true)) as never,
      orderBy: [{ startDate: 'asc' }, { createdAt: 'desc' }],
      skip,
      take: query.limit,
    }),
    getEventDelegate().count({ where: whereClause }),
  ]);

  return {
    events: (items as EventRecord[]).map(toEventDto),
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

  return toEventDto(event);
}

export async function getPublicEventById(id: string): Promise<EventDto> {
  const event = (await getEventDelegate().findFirst({
    where: {
      id,
      status: 'PUBLISHED',
      startDate: { gt: new Date() },
    },
    select: (await getEventSelect(true)) as never,
  })) as EventRecord | null;

  if (!event) {
    throw new AppError('Event not found', 404);
  }

  return toEventDto(event);
}

export async function updateEvent(id: string, payload: UpdateEventInput, user: AuthenticatedUser): Promise<EventDto> {
  const existingEvent = await ensureEventAccess(id, user);
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
  await validateVenueCapacity(nextVenueId, nextAttendeeLimit);

  const scheduleChanged =
    normalizedPayload.startDate !== undefined ||
    normalizedPayload.endDate !== undefined ||
    normalizedPayload.startTime !== undefined ||
    normalizedPayload.endTime !== undefined;
  const venueChanged = normalizedPayload.venueId !== undefined && normalizedPayload.venueId !== existingEvent.venueId;

  if (existingEvent.status === 'PUBLISHED' && (scheduleChanged || venueChanged)) {
    await syncPublishedEventVenueBooking(id, existingEvent, {
      venueId: nextVenueId,
      startDate: nextStartDate,
      endDate: nextEndDate,
      startTime: nextStartTime,
      endTime: nextEndTime,
      organizerId: existingEvent.organizerId,
    });
  }

  const [optionalImageData, optionalScalarData] = await Promise.all([
    getOptionalEventImageData({
      ...(normalizedPayload.bannerImage !== undefined ? { bannerImage: normalizedPayload.bannerImage } : {}),
      ...(normalizedPayload.galleryImages !== undefined ? { galleryImages: normalizedPayload.galleryImages } : {}),
    }),
    getOptionalEventScalarData({ ticketPrice: normalizedPayload.ticketPrice }),
  ]);

  await getEventDelegate().update({
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
  });

  if (normalizedPayload.status !== undefined && normalizedPayload.status !== existingEvent.status) {
    return updateEventStatus(id, { status: normalizedPayload.status }, user);
  }

  return getEventById(id, user);
}

export async function updateEventStatus(id: string, payload: UpdateEventStatusInput, user: AuthenticatedUser): Promise<EventDto> {
  const existingEvent = await ensureEventAccess(id, user);
  assertEventIsMutable(existingEvent);

  if (existingEvent.status === payload.status) {
    return getEventById(id, user);
  }

  if (!canTransitionToStatus(existingEvent.status as EventStatus, payload.status)) {
    throw new AppError(`Invalid event status transition from ${existingEvent.status} to ${payload.status}`, 400);
  }

  if (payload.status === 'PUBLISHED') {
    if (!existingEvent.venueId) {
      throw new AppError('A venue is required before publishing an event', 400);
    }

    ensureStartDateIsFuture(existingEvent.startDate);
    await reserveVenueForPublishedEvent(id, {
      venueId: existingEvent.venueId,
      startDate: existingEvent.startDate,
      endDate: existingEvent.endDate,
      startTime: existingEvent.startTime,
      endTime: existingEvent.endTime,
      createdById: existingEvent.organizerId,
    });
  }

  if (existingEvent.status === 'PUBLISHED' && payload.status === 'CANCELLED') {
    await cancelBookingsForEvent(id);
  }

  await getEventDelegate().update({
    where: { id },
    data: { status: payload.status },
  });

  return getEventById(id, user);
}

export async function deleteEvent(id: string, user: AuthenticatedUser): Promise<void> {
  const event = await ensureEventAccess(id, user);

  if (event.status !== 'CANCELLED') {
    throw new AppError('Only cancelled events can be deleted', 400);
  }

  if (event.venueId) {
    await cancelBookingsForEvent(id);
  }

  await getEventDelegate().delete({ where: { id } });
}
