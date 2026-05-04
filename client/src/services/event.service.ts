import { httpClient } from '@/api/httpClient';
import type { ApiResponse } from '@/types/api';
import type { EventListFilters, EventPayload, EventResponse, EventsResponse } from '@/types/event.types';

export const eventService = {
  async getEvents(filters: EventListFilters): Promise<EventsResponse> {
    const response = await httpClient.get<EventsResponse>('/events', {
      params: {
        page: filters.page,
        limit: filters.limit,
        ...(filters.category ? { category: filters.category } : {}),
        ...(filters.date ? { date: filters.date } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.includeUnpublished ? { includeUnpublished: true } : {}),
      },
    });

    return response.data;
  },

  async getEventById(id: string): Promise<EventResponse> {
    const response = await httpClient.get<EventResponse>(`/events/${id}`);
    return response.data;
  },

  async createEvent(payload: EventPayload): Promise<EventResponse> {
    const response = await httpClient.post<EventResponse>('/events', payload);
    return response.data;
  },

  async updateEvent(id: string, payload: Partial<EventPayload>): Promise<EventResponse> {
    const response = await httpClient.put<EventResponse>(`/events/${id}`, payload);
    return response.data;
  },

  async deleteEvent(id: string): Promise<ApiResponse<undefined>> {
    const response = await httpClient.delete<ApiResponse<undefined>>(`/events/${id}`);
    return response.data;
  },
};
