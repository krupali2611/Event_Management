import type { ApiResponse } from '@/types/api';

export interface Venue {
  id: string;
  name: string;
  location: string;
  address: string | null;
  capacity: number;
  description: string | null;
  image: string | null;
  amenities: string[];
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VenueDeactivationConflict {
  bookingId: string;
  eventId: string;
  eventTitle: string;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
}

export interface VenueDeactivationImpact {
  venue: Venue;
  hasConflicts: boolean;
  conflicts: VenueDeactivationConflict[];
  confirmationMessage: string;
}

export interface VenueStatusChange {
  venue: Venue;
  hasConflicts: boolean;
  conflicts: VenueDeactivationConflict[];
  confirmationMessage?: string;
}

export interface VenueListFilters {
  page: number;
  limit: number;
  offset?: number;
  search: string;
  location: string;
  minCapacity: string;
  status: '' | 'ACTIVE' | 'INACTIVE';
  includeInactive?: boolean;
}

export interface VenueListData {
  venues: Venue[];
  hasMore: boolean;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    offset?: number;
  };
}

export interface VenuePayload {
  name: string;
  location: string;
  address?: string;
  capacity: number;
  description?: string;
  image?: string;
  imagePublicId?: string;
  amenities: string[];
  isActive?: boolean;
}

export type VenuesResponse = ApiResponse<VenueListData>;
export type VenueResponse = ApiResponse<Venue>;
export type VenueDeactivationImpactResponse = ApiResponse<VenueDeactivationImpact>;
export type VenueStatusChangeResponse = ApiResponse<VenueStatusChange>;
export type VenueImageUploadResponse = ApiResponse<{ imageUrl: string; publicId: string }>;
