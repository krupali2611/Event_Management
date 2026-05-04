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

export interface VenueListFilters {
  page: number;
  limit: number;
  search: string;
  location: string;
  minCapacity: string;
  status: '' | 'ACTIVE' | 'INACTIVE';
  includeInactive?: boolean;
}

export interface VenueListData {
  venues: Venue[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface VenuePayload {
  name: string;
  location: string;
  address?: string;
  capacity: number;
  description?: string;
  image?: string;
  amenities: string[];
  isActive?: boolean;
}

export type VenuesResponse = ApiResponse<VenueListData>;
export type VenueResponse = ApiResponse<Venue>;
export type VenueImageUploadResponse = ApiResponse<{ imageUrl: string }>;
