import type { Event, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import type { CreateEventInput, EventDto, EventListQuery, PaginatedEventsData, UpdateEventInput } from '../types/event.types';
import { bookingApiClient } from '../utils/apiClient';
import { AppError } from '../utils/response';

function getEventDelegate() {
  if (!('event' in prisma) || !prisma.event) {
    throw new AppError('Event model is not available in the Prisma client. Run Prisma generate and restart the server.', 500);
  }

  return prisma.event;
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

function ensureValidDateRange(startDate: Date, endDate: Date): void {
  if (startDate.getTime() > endDate.getTime()) {
    throw new AppError('Start date must be on or before end date', 400);
  }
}

function toEventDto(
  event: Event & {
    venue?: { id: string; name: string; location: string; capacity: number; isActive: boolean } | null;
    organizer?: { id: string; name: string; email: string } | null;
  },
): EventDto {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    category: event.category,
    startDate: event.startDate,
    endDate: event.endDate,
    startTime: event.startTime,
    endTime: event.endTime,
    attendeeLimit: event.attendeeLimit,
    venueId: event.venueId,
    organizerId: event.organizerId,
    status: event.status as EventDto['status'],
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
    ...(event.venue ? { venue: event.venue } : {}),
    ...(event.organizer ? { organizer: event.organizer } : {}),
  };
}

async function ensureEventExists(id: string): Promise<Event> {
  const event = await getEventDelegate().findUnique({ where: { id } });

  if (!event) {
    throw new AppError('Event not found', 404);
  }

  return event;
}

async function syncVenueBookingForEvent(
  eventId: string,
  input: {
    currentVenueId?: string | null;
    nextVenueId?: string | null;
    startDate: string;
    endDate: string;
    startTime?: string;
    endTime?: string;
    createdById?: string;
  },
): Promise<string | null> {
  if (!input.nextVenueId) {
    if (input.currentVenueId) {
      await bookingApiClient.cancelEventVenueReservation(eventId);
    }

    return null;
  }

  const availability = await bookingApiClient.checkVenueAvailability({
    venueId: input.nextVenueId,
    startDate: input.startDate,
    endDate: input.endDate,
  });

  if (!availability.available) {
    throw new AppError('Venue is not available for the selected schedule', 409);
  }

  if (input.currentVenueId) {
    await bookingApiClient.cancelEventVenueReservation(eventId);
  }

  await bookingApiClient.reserveVenue({
    venueId: input.nextVenueId,
    startDate: input.startDate,
    endDate: input.endDate,
    startTime: input.startTime,
    endTime: input.endTime,
    eventId,
    createdById: input.createdById,
  });

  return input.nextVenueId;
}

export async function createEvent(payload: CreateEventInput): Promise<EventDto> {
  const eventDelegate = getEventDelegate();
  const normalizedPayload = normalizeEventPayload(payload);
  const startDate = new Date(normalizedPayload.startDate);
  const endDate = new Date(normalizedPayload.endDate);
  ensureValidDateRange(startDate, endDate);

  const createdEvent = await prisma.$transaction(async (transaction) => {
    const event = await transaction.event.create({
      data: {
        title: normalizedPayload.title,
        description: normalizedPayload.description ?? null,
        category: normalizedPayload.category,
        startDate,
        endDate,
        startTime: normalizedPayload.startTime ?? null,
        endTime: normalizedPayload.endTime ?? null,
        attendeeLimit: normalizedPayload.attendeeLimit,
        venueId: null,
        organizerId: normalizedPayload.organizerId,
        status: normalizedPayload.status ?? 'draft',
      },
    });

    if (!normalizedPayload.venueId) {
      return event;
    }

    const reservedVenueId = await syncVenueBookingForEvent(event.id, {
      nextVenueId: normalizedPayload.venueId,
      startDate: normalizedPayload.startDate,
      endDate: normalizedPayload.endDate,
      startTime: normalizedPayload.startTime,
      endTime: normalizedPayload.endTime,
      createdById: normalizedPayload.organizerId,
    });

    return transaction.event.update({
      where: { id: event.id },
      data: { venueId: reservedVenueId },
    });
  });

  const event = await eventDelegate.findUnique({
    where: { id: createdEvent.id },
    include: {
      venue: { select: { id: true, name: true, location: true, capacity: true, isActive: true } },
      organizer: { select: { id: true, name: true, email: true } },
    },
  });

  if (!event) {
    throw new AppError('Event not found after creation', 500);
  }

  return toEventDto(event);
}

export async function getEvents(query: EventListQuery): Promise<PaginatedEventsData> {
  const whereClause: Prisma.EventWhereInput = {
    ...(query.category ? { category: { equals: query.category, mode: 'insensitive' } } : {}),
    ...(query.status ? { status: query.status } : query.includeUnpublished ? {} : { status: 'published' }),
  };

  if (query.date) {
    const selectedDate = new Date(query.date);
    selectedDate.setHours(0, 0, 0, 0);
    const rangeEnd = new Date(selectedDate);
    rangeEnd.setHours(23, 59, 59, 999);
    whereClause.startDate = { lte: rangeEnd };
    whereClause.endDate = { gte: selectedDate };
  }

  const skip = (query.page - 1) * query.limit;
  const [items, totalItems] = await Promise.all([
    getEventDelegate().findMany({
      where: whereClause,
      include: {
        venue: { select: { id: true, name: true, location: true, capacity: true, isActive: true } },
        organizer: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ startDate: 'asc' }, { createdAt: 'desc' }],
      skip,
      take: query.limit,
    }),
    getEventDelegate().count({ where: whereClause }),
  ]);

  return {
    events: items.map(toEventDto),
    pagination: {
      total: totalItems,
      page: query.page,
      limit: query.limit,
      totalPages: Math.max(1, Math.ceil(totalItems / query.limit)),
    },
  };
}

export async function getEventById(id: string): Promise<EventDto> {
  const event = await getEventDelegate().findUnique({
    where: { id },
    include: {
      venue: { select: { id: true, name: true, location: true, capacity: true, isActive: true } },
      organizer: { select: { id: true, name: true, email: true } },
    },
  });

  if (!event) {
    throw new AppError('Event not found', 404);
  }

  return toEventDto(event);
}

export async function updateEvent(id: string, payload: UpdateEventInput): Promise<EventDto> {
  const existingEvent = await ensureEventExists(id);
  const normalizedPayload = normalizeEventPayload(payload);
  const nextStartDate = new Date(normalizedPayload.startDate ?? existingEvent.startDate.toISOString());
  const nextEndDate = new Date(normalizedPayload.endDate ?? existingEvent.endDate.toISOString());
  ensureValidDateRange(nextStartDate, nextEndDate);
  const nextVenueId = normalizedPayload.venueId === undefined ? existingEvent.venueId : normalizedPayload.venueId;

  const scheduleChanged =
    normalizedPayload.startDate !== undefined ||
    normalizedPayload.endDate !== undefined ||
    normalizedPayload.startTime !== undefined ||
    normalizedPayload.endTime !== undefined;
  const venueChanged = normalizedPayload.venueId !== undefined && normalizedPayload.venueId !== existingEvent.venueId;

  if (scheduleChanged || venueChanged) {
    await syncVenueBookingForEvent(id, {
      currentVenueId: existingEvent.venueId,
      nextVenueId,
      startDate: nextStartDate.toISOString(),
      endDate: nextEndDate.toISOString(),
      startTime: normalizedPayload.startTime ?? existingEvent.startTime ?? undefined,
      endTime: normalizedPayload.endTime ?? existingEvent.endTime ?? undefined,
      createdById: existingEvent.organizerId,
    });
  }

  const updatedEvent = await getEventDelegate().update({
    where: { id },
    data: {
      ...(normalizedPayload.title !== undefined ? { title: normalizedPayload.title } : {}),
      ...(normalizedPayload.description !== undefined ? { description: normalizedPayload.description ?? null } : {}),
      ...(normalizedPayload.category !== undefined ? { category: normalizedPayload.category } : {}),
      ...(normalizedPayload.startDate !== undefined ? { startDate: nextStartDate } : {}),
      ...(normalizedPayload.endDate !== undefined ? { endDate: nextEndDate } : {}),
      ...(normalizedPayload.startTime !== undefined ? { startTime: normalizedPayload.startTime ?? null } : {}),
      ...(normalizedPayload.endTime !== undefined ? { endTime: normalizedPayload.endTime ?? null } : {}),
      ...(normalizedPayload.attendeeLimit !== undefined ? { attendeeLimit: normalizedPayload.attendeeLimit } : {}),
      ...(normalizedPayload.status !== undefined ? { status: normalizedPayload.status } : {}),
      ...(normalizedPayload.venueId !== undefined ? { venueId: normalizedPayload.venueId } : {}),
    },
    include: {
      venue: { select: { id: true, name: true, location: true, capacity: true, isActive: true } },
      organizer: { select: { id: true, name: true, email: true } },
    },
  });

  return toEventDto(updatedEvent);
}

export async function deleteEvent(id: string): Promise<void> {
  const event = await ensureEventExists(id);

  if (event.venueId) {
    await bookingApiClient.cancelEventVenueReservation(id);
  }

  await getEventDelegate().delete({ where: { id } });
}
