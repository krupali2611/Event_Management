import type { Prisma, Venue } from '@prisma/client';
import { prisma } from '../config/prisma';
import type {
  CreateVenueInput,
  PaginatedVenuesData,
  UpdateVenueInput,
  VenueAvailabilityQuery,
  VenueDto,
  VenueListQuery,
} from '../types/venue.types';
import { AppError } from '../utils/response';
import { checkVenueAvailability } from '../utils/availability';

function getVenueDelegate() {
  if (!('venue' in prisma) || !prisma.venue) {
    throw new AppError('Venue model is not available in the Prisma client. Run Prisma generate and restart the server.', 500);
  }

  return prisma.venue;
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function normalizeVenuePayload<T extends { name?: string; location?: string; address?: string; description?: string; image?: string; amenities?: string[] }>(
  payload: T,
): T {
  return {
    ...payload,
    ...(payload.name !== undefined ? { name: normalizeText(payload.name) } : {}),
    ...(payload.location !== undefined ? { location: normalizeText(payload.location) } : {}),
    ...(payload.address !== undefined ? { address: payload.address ? normalizeText(payload.address) : undefined } : {}),
    ...(payload.description !== undefined ? { description: payload.description ? payload.description.trim() : undefined } : {}),
    ...(payload.image !== undefined ? { image: payload.image ? payload.image.trim() : undefined } : {}),
    ...(payload.amenities !== undefined
      ? {
          amenities: Array.from(new Set(payload.amenities.map((item) => normalizeText(item)).filter(Boolean))),
        }
      : {}),
  };
}

function toVenueDto(venue: Venue): VenueDto {
  return {
    id: venue.id,
    name: venue.name,
    location: venue.location,
    address: venue.address,
    capacity: venue.capacity,
    description: venue.description,
    image: venue.image,
    amenities: venue.amenities,
    isActive: venue.isActive,
    createdBy: venue.createdById,
    createdAt: venue.createdAt,
    updatedAt: venue.updatedAt,
  };
}

async function ensureVenueExists(id: string): Promise<Venue> {
  const venue = await getVenueDelegate().findUnique({ where: { id } });

  if (!venue) {
    throw new AppError('Venue not found', 404);
  }

  return venue;
}

async function assertVenueUniqueness(name: string, location: string, excludeId?: string): Promise<void> {
  const existingVenue = await getVenueDelegate().findFirst({
    where: {
      name: { equals: name, mode: 'insensitive' },
      location: { equals: location, mode: 'insensitive' },
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  });

  if (existingVenue) {
    throw new AppError('A venue with the same name and location already exists', 409);
  }
}

export async function createVenue(payload: CreateVenueInput): Promise<VenueDto> {
  const venueDelegate = getVenueDelegate();
  const normalizedPayload = normalizeVenuePayload(payload);
  await assertVenueUniqueness(normalizedPayload.name, normalizedPayload.location);

  const existingName = await venueDelegate.findFirst({
    where: {
      name: { equals: normalizedPayload.name, mode: 'insensitive' },
    },
  });

  if (existingName) {
    throw new AppError('Venue name must be unique', 409);
  }

  const venue = await venueDelegate.create({
    data: {
      name: normalizedPayload.name,
      location: normalizedPayload.location,
      address: normalizedPayload.address,
      capacity: normalizedPayload.capacity,
      description: normalizedPayload.description,
      image: normalizedPayload.image,
      amenities: normalizedPayload.amenities ?? [],
      isActive: normalizedPayload.isActive ?? true,
      createdById: normalizedPayload.createdById,
    },
  });

  return toVenueDto(venue);
}

export async function getVenues(query: VenueListQuery): Promise<PaginatedVenuesData> {
  const venueDelegate = getVenueDelegate();
  const whereClause: Prisma.VenueWhereInput = {
    ...(query.location ? { location: { contains: query.location, mode: 'insensitive' } } : {}),
    ...(query.minCapacity ? { capacity: { gte: query.minCapacity } } : {}),
    ...(query.isActive !== undefined ? { isActive: query.isActive } : query.includeInactive ? {} : { isActive: true }),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { location: { contains: query.search, mode: 'insensitive' } },
            { address: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const skip = query.offset ?? (query.page - 1) * query.limit;
  const [items, totalItems] = await Promise.all([
    venueDelegate.findMany({
      where: whereClause,
      orderBy: [{ createdAt: 'desc' }],
      skip,
      take: query.limit,
    }),
    venueDelegate.count({ where: whereClause }),
  ]);

  return {
    venues: items.map(toVenueDto),
    hasMore: skip + items.length < totalItems,
    pagination: {
      total: totalItems,
      page: query.offset !== undefined ? Math.floor(query.offset / query.limit) + 1 : query.page,
      limit: query.limit,
      totalPages: Math.max(1, Math.ceil(totalItems / query.limit)),
      offset: skip,
    },
  };
}

export async function getVenueById(id: string): Promise<VenueDto> {
  const venue = await ensureVenueExists(id);
  return toVenueDto(venue);
}

export async function updateVenue(id: string, payload: UpdateVenueInput): Promise<VenueDto> {
  const venueDelegate = getVenueDelegate();
  const existingVenue = await ensureVenueExists(id);
  const normalizedPayload = normalizeVenuePayload(payload);
  const nextName = normalizedPayload.name ?? existingVenue.name;
  const nextLocation = normalizedPayload.location ?? existingVenue.location;

  await assertVenueUniqueness(nextName, nextLocation, id);

  if (normalizedPayload.name && normalizedPayload.name.toLowerCase() !== existingVenue.name.toLowerCase()) {
    const existingName = await venueDelegate.findFirst({
      where: {
        name: { equals: normalizedPayload.name, mode: 'insensitive' },
        NOT: { id },
      },
    });

    if (existingName) {
      throw new AppError('Venue name must be unique', 409);
    }
  }

  const venue = await venueDelegate.update({
    where: { id },
    data: {
      ...(normalizedPayload.name !== undefined ? { name: normalizedPayload.name } : {}),
      ...(normalizedPayload.location !== undefined ? { location: normalizedPayload.location } : {}),
      ...(normalizedPayload.address !== undefined ? { address: normalizedPayload.address ?? null } : {}),
      ...(normalizedPayload.capacity !== undefined ? { capacity: normalizedPayload.capacity } : {}),
      ...(normalizedPayload.description !== undefined ? { description: normalizedPayload.description ?? null } : {}),
      ...(normalizedPayload.image !== undefined ? { image: normalizedPayload.image ?? null } : {}),
      ...(normalizedPayload.amenities !== undefined ? { amenities: normalizedPayload.amenities } : {}),
      ...(normalizedPayload.isActive !== undefined ? { isActive: normalizedPayload.isActive } : {}),
    },
  });

  return toVenueDto(venue);
}

export async function deactivateVenue(id: string): Promise<VenueDto> {
  const venueDelegate = getVenueDelegate();
  await ensureVenueExists(id);
  const venue = await venueDelegate.update({
    where: { id },
    data: { isActive: false },
  });

  return toVenueDto(venue);
}

export async function toggleVenueStatus(id: string): Promise<VenueDto> {
  const venueDelegate = getVenueDelegate();
  const existingVenue = await ensureVenueExists(id);
  const venue = await venueDelegate.update({
    where: { id },
    data: { isActive: !existingVenue.isActive },
  });

  return toVenueDto(venue);
}

export async function getVenueAvailability(venueId: string, dateRange: VenueAvailabilityQuery) {
  await ensureVenueExists(venueId);
  return checkVenueAvailability(venueId, dateRange);
}
