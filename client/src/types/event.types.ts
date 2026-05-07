import type { ApiResponse } from '@/types/api';

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED';
export type EventLifecycleStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';

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
  image: string | null;
  bannerImage: string | null;
  galleryImages: string[];
  category: string;
  ticketPrice: number;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  attendeeLimit: number;
  venueId: string | null;
  organizerId: string;
  status: EventStatus;
  lifecycleStatus: EventLifecycleStatus;
  isEditable: boolean;
  isDeletable: boolean;
  createdAt: string;
  updatedAt: string;
  venue?: EventVenueSummary | null;
  organizer?: EventOrganizerSummary;
}

export interface EventListFilters {
  page: number;
  limit: number;
  search: string;
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
  bannerImage?: string | null;
  bannerImageFile?: File | null;
  galleryImages?: string[];
  galleryImageFiles?: File[];
  category: string;
  ticketPrice: number;
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
