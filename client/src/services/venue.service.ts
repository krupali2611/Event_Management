import { httpClient } from '@/api/httpClient';
import type {
  VenueDeactivationImpactResponse,
  VenueImageUploadResponse,
  VenueListFilters,
  VenuePayload,
  VenueResponse,
  VenueStatusChangeResponse,
  VenuesResponse,
} from '@/types/venue.types';

export const venueService = {
  async getVenues(filters: VenueListFilters): Promise<VenuesResponse> {
    const response = await httpClient.get<VenuesResponse>('/venues', {
      params: {
        page: filters.page,
        limit: filters.limit,
        ...(filters.offset !== undefined ? { offset: filters.offset } : {}),
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

  async getVenueDeactivationImpact(venueId: string): Promise<VenueDeactivationImpactResponse> {
    const response = await httpClient.get<VenueDeactivationImpactResponse>(`/venues/${venueId}/deactivation-impact`);
    return response.data;
  },

  async toggleVenueStatus(venueId: string): Promise<VenueStatusChangeResponse> {
    const response = await httpClient.patch<VenueStatusChangeResponse>(`/venues/${venueId}/status`);
    return response.data;
  },

  async deactivateVenue(venueId: string): Promise<VenueResponse> {
    const response = await httpClient.delete<VenueResponse>(`/venues/${venueId}`);
    return response.data;
  },
};
