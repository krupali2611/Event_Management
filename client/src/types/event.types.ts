import type { ApiResponse } from '@/types/api';

export type EventStatus = 'draft' | 'published' | 'cancelled';

export interface EventVenueSummary {
  id: string;
  name: string;
  location: string;
  capacity: number;
  isActive: boolean;
}

export interface EventOrganizerSummary {
  id: string;
  name: string;
  email: string;
}

export interface EventItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  attendeeLimit: number;
  venueId: string | null;
  organizerId: string;
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
  venue?: EventVenueSummary | null;
  organizer?: EventOrganizerSummary;
}

export interface EventListFilters {
  page: number;
  limit: number;
  category: string;
  date: string;
  status: '' | EventStatus;
  includeUnpublished?: boolean;
}

export interface EventListData {
  events: EventItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface EventPayload {
  title: string;
  description?: string;
  category: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  attendeeLimit: number;
  venueId?: string | null;
  status?: EventStatus;
}

export type EventsResponse = ApiResponse<EventListData>;
export type EventResponse = ApiResponse<EventItem>;
