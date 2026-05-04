import { httpClient } from '@/api/httpClient';
import type { VenueImageUploadResponse, VenueListFilters, VenuePayload, VenueResponse, VenuesResponse } from '@/types/venue.types';

export const venueService = {
  async getVenues(filters: VenueListFilters): Promise<VenuesResponse> {
    const response = await httpClient.get<VenuesResponse>('/venues', {
      params: {
        page: filters.page,
        limit: filters.limit,
        ...(filters.search ? { search: filters.search } : {}),
        ...(filters.location ? { location: filters.location } : {}),
        ...(filters.minCapacity ? { minCapacity: Number(filters.minCapacity) } : {}),
        ...(filters.status ? { isActive: filters.status === 'ACTIVE' } : {}),
        ...(filters.includeInactive ? { includeInactive: true } : {}),
      },
    });

    return response.data;
  },

  async getVenueById(venueId: string): Promise<VenueResponse> {
    const response = await httpClient.get<VenueResponse>(`/venues/${venueId}`);
    return response.data;
  },

  async createVenue(payload: VenuePayload): Promise<VenueResponse> {
    const response = await httpClient.post<VenueResponse>('/venues', payload);
    return response.data;
  },

  async uploadVenueImage(file: File): Promise<VenueImageUploadResponse> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await httpClient.post<VenueImageUploadResponse>('/venues/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  async updateVenue(venueId: string, payload: VenuePayload): Promise<VenueResponse> {
    const response = await httpClient.put<VenueResponse>(`/venues/${venueId}`, payload);
    return response.data;
  },

  async deactivateVenue(venueId: string): Promise<VenueResponse> {
    const response = await httpClient.delete<VenueResponse>(`/venues/${venueId}`);
    return response.data;
  },
};
