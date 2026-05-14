import { httpClient } from '@/api/httpClient';
import type { ApiResponse } from '@/types/api';
import type { EventListFilters, EventPayload, EventResponse, EventsResponse, EventStatus } from '@/types/event.types';

function toEventFormData(payload: Partial<EventPayload>): FormData {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined) {
      return;
    }

    if (key === 'bannerImageFile' && value instanceof File) {
      formData.append('bannerImageFile', value);
      return;
    }

    if (key === 'galleryImageFiles' && Array.isArray(value)) {
      value.forEach((file) => {
        if (file instanceof File) {
          formData.append('galleryImageFiles', file);
        }
      });
      return;
    }

    if (key === 'galleryImages' && Array.isArray(value)) {
      formData.append('galleryImages', JSON.stringify(value));
      return;
    }

    formData.append(key, value === null ? '' : String(value));
  });

  return formData;
}

export const eventService = {
  async getEvents(filters: EventListFilters): Promise<EventsResponse> {
    const response = await httpClient.get<EventsResponse>('/events', {
      params: {
        page: filters.page,
        limit: filters.limit,
        ...(filters.search ? { search: filters.search } : {}),
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

  async getPublicEvents(filters: EventListFilters): Promise<EventsResponse> {
    const response = await httpClient.get<EventsResponse>('/events/public', {
      params: {
        page: filters.page,
        limit: filters.limit,
        ...(filters.search ? { search: filters.search } : {}),
        ...(filters.date ? { date: filters.date } : {}),
      },
    });

    return response.data;
  },

  async getPublicEventById(id: string): Promise<EventResponse> {
    const response = await httpClient.get<EventResponse>(`/events/public/${id}`);
    return response.data;
  },

  async createEvent(payload: EventPayload): Promise<EventResponse> {
    const response = await httpClient.post<EventResponse>('/events', toEventFormData(payload), {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000,
    });
    return response.data;
  },

  async updateEvent(id: string, payload: Partial<EventPayload>): Promise<EventResponse> {
    const response = await httpClient.put<EventResponse>(`/events/${id}`, toEventFormData(payload), {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000,
    });
    return response.data;
  },

  async updateEventStatus(id: string, status: EventStatus): Promise<EventResponse> {
    const response = await httpClient.patch<EventResponse>(`/events/${id}/status`, { status });
    return response.data;
  },

  async deleteEvent(id: string): Promise<ApiResponse<undefined>> {
    const response = await httpClient.delete<ApiResponse<undefined>>(`/events/${id}`);
    return response.data;
  },
};
