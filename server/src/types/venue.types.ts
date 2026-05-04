export interface VenueDto {
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
  createdAt: Date;
  updatedAt: Date;
}

export interface VenueListItemDto extends VenueDto {}

export interface PaginationDto {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedVenuesData {
  venues: VenueListItemDto[];
  pagination: PaginationDto;
}

export interface VenueListQuery {
  page: number;
  limit: number;
  search?: string;
  location?: string;
  minCapacity?: number;
  isActive?: boolean;
}

export interface CreateVenueInput {
  name: string;
  location: string;
  address?: string;
  capacity: number;
  description?: string;
  image?: string;
  amenities: string[];
  isActive?: boolean;
  createdById?: string;
}

export interface UpdateVenueInput {
  name?: string;
  location?: string;
  address?: string;
  capacity?: number;
  description?: string;
  image?: string;
  amenities?: string[];
  isActive?: boolean;
}

export interface VenueAvailabilityQuery {
  startDate: string;
  endDate: string;
}

export interface VenueAvailabilityResult {
  venueId: string;
  available: boolean;
  reason: string;
}

export interface VenueImageUploadDto {
  imageUrl: string;
}
