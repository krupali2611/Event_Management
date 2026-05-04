import type { Response } from 'express';
import { createEvent, deleteEvent, getEventById, getEvents, updateEvent } from '../services/event.service';
import type { ApiResponse } from '../types/api';
import type { AuthenticatedRequest } from '../types/auth.types';
import type { EventDto, PaginatedEventsData } from '../types/event.types';
import { createEventBodySchema, eventIdParamSchema, eventListQuerySchema, updateEventBodySchema } from '../validations/event.validation';
import { sendSuccess } from '../utils/response';

export async function createEventController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<EventDto>>,
): Promise<void> {
  const payload = createEventBodySchema.parse(request.body);
  const event = await createEvent({
    ...payload,
    organizerId: request.user!.id,
  });

  sendSuccess(response, 201, 'Event created successfully', event);
}

export async function getEventsController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<PaginatedEventsData>>,
): Promise<void> {
  const query = eventListQuerySchema.parse(request.query);
  const events = await getEvents(query);
  sendSuccess(response, 200, 'Events fetched successfully', events);
}

export async function getEventController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<EventDto>>,
): Promise<void> {
  const { id } = eventIdParamSchema.parse(request.params);
  const event = await getEventById(id);
  sendSuccess(response, 200, 'Event fetched successfully', event);
}

export async function updateEventController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<EventDto>>,
): Promise<void> {
  const { id } = eventIdParamSchema.parse(request.params);
  const payload = updateEventBodySchema.parse(request.body);
  const event = await updateEvent(id, payload);
  sendSuccess(response, 200, 'Event updated successfully', event);
}

export async function deleteEventController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse>,
): Promise<void> {
  const { id } = eventIdParamSchema.parse(request.params);
  await deleteEvent(id);
  sendSuccess(response, 200, 'Event deleted successfully');
}
