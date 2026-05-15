import type { Request, Response } from 'express';
import { createEvent, deleteEvent, getEventById, getEvents, getPublicEventById, getPublicEvents, updateEvent, updateEventStatus } from '../services/event.service';
import type { ApiResponse } from '../types/api';
import type { AuthenticatedRequest } from '../types/auth.types';
import type { EventDto, PaginatedEventsData } from '../types/event.types';
import { deleteFromCloudinary } from '../utils/deleteFromCloudinary';
import { createEventBodySchema, eventIdParamSchema, eventListQuerySchema, updateEventBodySchema, updateEventStatusBodySchema } from '../validations/event.validation';
import { sendSuccess } from '../utils/response';
import { uploadToCloudinary } from '../utils/uploadToCloudinary';

function normalizeGalleryImages(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  }

  if (typeof value !== 'string' || value.trim().length === 0) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : undefined;
  } catch {
    return [value.trim()];
  }
}

function normalizeEventBody(body: AuthenticatedRequest['body']): Record<string, unknown> {
  const normalizedBody: Record<string, unknown> = { ...body };

  if (typeof body.bannerImage === 'string') {
    normalizedBody.bannerImage = body.bannerImage.trim().length > 0 ? body.bannerImage.trim() : null;
  }

  const galleryImages = normalizeGalleryImages(body.galleryImages);

  if (galleryImages !== undefined) {
    normalizedBody.galleryImages = galleryImages;
  }

  if (body.venueId === '') {
    normalizedBody.venueId = null;
  }

  return normalizedBody;
}

async function getUploadedEventImages(request: AuthenticatedRequest): Promise<{
  bannerImage?: string;
  bannerImagePublicId?: string;
  galleryImages?: string[];
  galleryImagePublicIds?: string[];
}> {
  const uploadedFiles = request.files as Record<string, Express.Multer.File[]> | undefined;
  const bannerFile = uploadedFiles?.bannerImageFile?.[0];
  const galleryFiles = uploadedFiles?.galleryImageFiles ?? [];
  const [uploadedBanner, uploadedGallery] = await Promise.all([
    bannerFile
      ? uploadToCloudinary(request, bannerFile, {
          folder: 'event-management-system/events/banners',
        })
      : Promise.resolve(null),
    galleryFiles.length > 0
      ? Promise.all(
          galleryFiles.map((file) =>
            uploadToCloudinary(request, file, {
              folder: 'event-management-system/events/gallery',
            }),
          ),
        )
      : Promise.resolve([]),
  ]);

  return {
    ...(uploadedBanner ? { bannerImage: uploadedBanner.secureUrl, bannerImagePublicId: uploadedBanner.publicId } : {}),
    ...(uploadedGallery.length > 0
      ? {
          galleryImages: uploadedGallery.map((image) => image.secureUrl),
          galleryImagePublicIds: uploadedGallery.map((image) => image.publicId),
        }
      : {}),
  };
}

async function cleanupUploadedImages(publicIds: Array<string | null | undefined>): Promise<void> {
  await Promise.all(publicIds.map((publicId) => deleteFromCloudinary(publicId).catch(() => undefined)));
}

export async function createEventController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<EventDto>>,
): Promise<void> {
  const uploadedImages = await getUploadedEventImages(request);
  const payload = createEventBodySchema.parse({
    ...normalizeEventBody(request.body),
    ...(uploadedImages.bannerImage ? { bannerImage: uploadedImages.bannerImage, bannerImagePublicId: uploadedImages.bannerImagePublicId } : {}),
    ...(uploadedImages.galleryImages ? { galleryImages: uploadedImages.galleryImages, galleryImagePublicIds: uploadedImages.galleryImagePublicIds } : {}),
  });
  let event: EventDto;

  try {
    event = await createEvent({
      ...payload,
      organizerId: request.user!.id,
    }, request.user!);
  } catch (error) {
    await cleanupUploadedImages([uploadedImages.bannerImagePublicId, ...(uploadedImages.galleryImagePublicIds ?? [])]);
    throw error;
  }

  sendSuccess(response, 201, 'Event created successfully', event);
}

export async function getEventsController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<PaginatedEventsData>>,
): Promise<void> {
  const query = eventListQuerySchema.parse(request.query);
  const events = await getEvents(query, request.user!);
  sendSuccess(response, 200, 'Events fetched successfully', events);
}

export async function getPublicEventsController(
  request: Request,
  response: Response<ApiResponse<PaginatedEventsData>>,
): Promise<void> {
  const query = eventListQuerySchema.parse(request.query);
  const events = await getPublicEvents(query);
  sendSuccess(response, 200, 'Public events fetched successfully', events);
}

export async function getEventController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<EventDto>>,
): Promise<void> {
  const { id } = eventIdParamSchema.parse(request.params);
  const event = await getEventById(id, request.user!);
  sendSuccess(response, 200, 'Event fetched successfully', event);
}

export async function getPublicEventController(
  request: Request,
  response: Response<ApiResponse<EventDto>>,
): Promise<void> {
  const { id } = eventIdParamSchema.parse(request.params);
  const event = await getPublicEventById(id);
  sendSuccess(response, 200, 'Public event fetched successfully', event);
}

export async function updateEventController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<EventDto>>,
): Promise<void> {
  const { id } = eventIdParamSchema.parse(request.params);
  const uploadedImages = await getUploadedEventImages(request);
  const normalizedBody = normalizeEventBody(request.body);
  const retainedGalleryImages = normalizeGalleryImages(normalizedBody.galleryImages);
  const nextGalleryImages =
    retainedGalleryImages !== undefined || uploadedImages.galleryImages
      ? [...(retainedGalleryImages ?? []), ...(uploadedImages.galleryImages ?? [])]
      : undefined;
  const payload = updateEventBodySchema.parse({
    ...normalizedBody,
    ...(uploadedImages.bannerImage ? { bannerImage: uploadedImages.bannerImage, bannerImagePublicId: uploadedImages.bannerImagePublicId } : {}),
    ...(nextGalleryImages !== undefined ? { galleryImages: nextGalleryImages, galleryImagePublicIds: uploadedImages.galleryImagePublicIds ?? [] } : {}),
  });
  let event: EventDto;

  try {
    event = await updateEvent(id, payload, request.user!);
  } catch (error) {
    await cleanupUploadedImages([uploadedImages.bannerImagePublicId, ...(uploadedImages.galleryImagePublicIds ?? [])]);
    throw error;
  }

  sendSuccess(response, 200, 'Event updated successfully', event);
}

export async function deleteEventController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse>,
): Promise<void> {
  const { id } = eventIdParamSchema.parse(request.params);
  await deleteEvent(id, request.user!);
  sendSuccess(response, 200, 'Event deleted successfully');
}

export async function updateEventStatusController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<EventDto>>,
): Promise<void> {
  const { id } = eventIdParamSchema.parse(request.params);
  const payload = updateEventStatusBodySchema.parse(request.body);
  const event = await updateEventStatus(id, payload, request.user!);
  sendSuccess(response, 200, 'Event status updated successfully', event);
}
