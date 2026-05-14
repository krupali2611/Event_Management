export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED';
export type EventLifecycleStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';

export interface EventDto {
  id: string;
  title: string;
  description: string | null;
  image: string | null;
  bannerImage: string | null;
  galleryImages: string[];
  category: string;
  ticketPrice: number;
  startDate: Date;
  endDate: Date;
  startTime: string | null;
  endTime: string | null;
  attendeeLimit: number;
  soldTickets: number;
  remainingSeats: number;
  venueId: string | null;
  organizerId: string;
  status: EventStatus;
  lifecycleStatus: EventLifecycleStatus;
  isEditable: boolean;
  isDeletable: boolean;
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
  search?: string;
  date?: string;
  status?: EventStatus;
  includeUnpublished?: boolean;
  organizerId?: string;
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
  clientRequestId?: string;
  title: string;
  description?: string;
  bannerImage?: string | null;
  bannerImagePublicId?: string | null;
  galleryImages?: string[];
  galleryImagePublicIds?: string[];
  category: string;
  ticketPrice: number;
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
  bannerImage?: string | null;
  bannerImagePublicId?: string | null;
  galleryImages?: string[];
  galleryImagePublicIds?: string[];
  category?: string;
  ticketPrice?: number;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  attendeeLimit?: number;
  venueId?: string | null;
  status?: EventStatus;
}

export interface UpdateEventStatusInput {
  status: EventStatus;
}
