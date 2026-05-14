import type { Response } from 'express';
import {
  createVenue,
  deactivateVenue,
  getVenueDeactivationImpact,
  getVenueAvailability,
  getVenueById,
  getVenues,
  toggleVenueStatus,
  updateVenue,
} from '../services/venue.service';
import type { ApiResponse } from '../types/api';
import type { AuthenticatedRequest } from '../types/auth.types';
import type {
  PaginatedVenuesData,
  VenueAvailabilityResult,
  VenueDeactivationImpactDto,
  VenueDto,
  VenueImageUploadDto,
  VenueStatusChangeDto,
} from '../types/venue.types';
import {
  createVenueBodySchema,
  venueIdParamSchema,
  venueListQuerySchema,
  updateVenueBodySchema,
} from '../validations/venue.validation';
import { AppError, sendSuccess } from '../utils/response';
import { uploadToCloudinary } from '../utils/uploadToCloudinary';

export async function createVenueController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<VenueDto>>,
): Promise<void> {
  const payload = createVenueBodySchema.parse(request.body);
  const venue = await createVenue({
    ...payload,
    createdById: request.user?.id,
  });

  sendSuccess(response, 201, 'Venue created successfully', venue);
}

export async function getVenuesController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<PaginatedVenuesData>>,
): Promise<void> {
  const query = venueListQuerySchema.parse(request.query);
  const venues = await getVenues(query);
  sendSuccess(response, 200, 'Venues fetched successfully', venues);
}

export async function getVenueController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<VenueDto>>,
): Promise<void> {
  const { id } = venueIdParamSchema.parse(request.params);
  const venue = await getVenueById(id);
  sendSuccess(response, 200, 'Venue fetched successfully', venue);
}

export async function updateVenueController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<VenueDto>>,
): Promise<void> {
  const { id } = venueIdParamSchema.parse(request.params);
  const payload = updateVenueBodySchema.parse(request.body);
  const venue = await updateVenue(id, payload);
  sendSuccess(response, 200, 'Venue updated successfully', venue);
}

export async function deactivateVenueController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<VenueDto>>,
): Promise<void> {
  const { id } = venueIdParamSchema.parse(request.params);
  const venue = await deactivateVenue(id);
  sendSuccess(response, 200, 'Venue marked inactive successfully', venue);
}

export async function toggleVenueStatusController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<VenueStatusChangeDto>>,
): Promise<void> {
  const { id } = venueIdParamSchema.parse(request.params);
  const venue = await toggleVenueStatus(id);
  sendSuccess(response, 200, `Venue ${venue.venue.isActive ? 'activated' : 'deactivated'} successfully`, venue);
}

export async function getVenueDeactivationImpactController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<VenueDeactivationImpactDto>>,
): Promise<void> {
  const { id } = venueIdParamSchema.parse(request.params);
  const impact = await getVenueDeactivationImpact(id);
  sendSuccess(response, 200, 'Venue deactivation impact fetched successfully', impact);
}

export async function getVenueAvailabilityController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<VenueAvailabilityResult>>,
): Promise<void> {
  const { id } = venueIdParamSchema.parse(request.params);
  const availability = await getVenueAvailability(id, {
    startDate: typeof request.query.startDate === 'string' ? request.query.startDate : '',
    endDate: typeof request.query.endDate === 'string' ? request.query.endDate : '',
  });

  sendSuccess(response, 200, 'Venue availability placeholder fetched successfully', availability);
}

export async function uploadVenueImageController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<VenueImageUploadDto>>,
): Promise<void> {
  if (!request.file) {
    throw new AppError('Venue image is required', 400);
  }

  const uploadedImage = await uploadToCloudinary(request.file, {
    folder: 'event-management-system/venues',
  });

  sendSuccess(response, 201, 'Venue image uploaded successfully', {
    imageUrl: uploadedImage.secureUrl,
    publicId: uploadedImage.publicId,
  });
}
