export type EventStatus = 'draft' | 'published' | 'cancelled';

export interface EventDto {
  id: string;
  title: string;
  description: string | null;
  category: string;
  startDate: Date;
  endDate: Date;
  startTime: string | null;
  endTime: string | null;
  attendeeLimit: number;
  venueId: string | null;
  organizerId: string;
  status: EventStatus;
  createdAt: Date;
  updatedAt: Date;
  venue?: {
    id: string;
    name: string;
    location: string;
    capacity: number;
    isActive: boolean;
  } | null;
  organizer?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface EventListQuery {
  category?: string;
  date?: string;
  status?: EventStatus;
  includeUnpublished?: boolean;
  page: number;
  limit: number;
}

export interface PaginatedEventsData {
  events: EventDto[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateEventInput {
  title: string;
  description?: string;
  category: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  attendeeLimit: number;
  venueId?: string;
  organizerId: string;
  status?: EventStatus;
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  attendeeLimit?: number;
  venueId?: string | null;
  status?: EventStatus;
}
