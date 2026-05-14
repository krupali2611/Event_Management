import { Prisma, VENUE_BOOKING_STATUS, type Venue } from '@prisma/client';
import { prisma } from '../config/prisma';
import type {
  CreateVenueInput,
  PaginatedVenuesData,
  UpdateVenueInput,
  VenueAvailabilityQuery,
  VenueDeactivationConflictDto,
  VenueDeactivationImpactDto,
  VenueDto,
  VenueListQuery,
  VenueStatusChangeDto,
} from '../types/venue.types';
import { deleteFromCloudinary } from '../utils/deleteFromCloudinary';
import { AppError } from '../utils/response';
import { checkVenueAvailability } from '../utils/availability';

type VenueRecord = Pick<
  Venue,
  'id' | 'name' | 'location' | 'address' | 'capacity' | 'description' | 'image' | 'amenities' | 'isActive' | 'createdById' | 'createdAt' | 'updatedAt'
> & {
  imagePublicId?: string | null;
};

function getVenueDelegate() {
  if (!('venue' in prisma) || !prisma.venue) {
    throw new AppError('Venue model is not available in the Prisma client. Run Prisma generate and restart the server.', 500);
  }

  return prisma.venue;
}

function getVenueModelFieldNames(): Set<string> {
  const prismaMeta = Prisma as unknown as {
    dmmf?: {
      datamodel?: {
        models?: Array<{
          name: string;
          fields: Array<{ name: string }>;
        }>;
      };
    };
  };

  const venueModel = prismaMeta.dmmf?.datamodel?.models?.find((model) => model.name === 'Venue');
  return new Set(venueModel?.fields.map((field) => field.name) ?? []);
}

const venueModelFields = getVenueModelFieldNames();
let venueDatabaseFieldNamesPromise: Promise<Set<string>> | null = null;

function supportsVenueField(fieldName: string): boolean {
  return venueModelFields.has(fieldName);
}

async function getVenueDatabaseFieldNames(): Promise<Set<string>> {
  if (!venueDatabaseFieldNamesPromise) {
    venueDatabaseFieldNamesPromise = prisma
      .$queryRaw<Array<{ column_name: string }>>`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Venue'
      `
      .then((rows) => new Set(rows.map((row) => row.column_name)))
      .catch(() => new Set<string>());
  }

  return venueDatabaseFieldNamesPromise;
}

async function supportsVenueDatabaseField(fieldName: string): Promise<boolean> {
  if (!supportsVenueField(fieldName)) {
    return false;
  }

  const fieldNames = await getVenueDatabaseFieldNames();
  return fieldNames.has(fieldName);
}

async function getVenueSelect(): Promise<Record<string, true>> {
  const hasImagePublicId = await supportsVenueDatabaseField('imagePublicId');

  return {
    id: true,
    name: true,
    location: true,
    address: true,
    capacity: true,
    description: true,
    image: true,
    amenities: true,
    isActive: true,
    createdById: true,
    createdAt: true,
    updatedAt: true,
    ...(hasImagePublicId ? { imagePublicId: true } : {}),
  };
}

async function getOptionalVenueImageData(input: { image?: string | null; imagePublicId?: string | null }): Promise<Record<string, string | null>> {
  const [hasImage, hasImagePublicId] = await Promise.all([
    supportsVenueDatabaseField('image'),
    supportsVenueDatabaseField('imagePublicId'),
  ]);

  return {
    ...(hasImage && input.image !== undefined ? { image: input.image } : {}),
    ...(hasImagePublicId && input.imagePublicId !== undefined ? { imagePublicId: input.imagePublicId } : {}),
  };
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function normalizeVenuePayload<T extends { name?: string; location?: string; address?: string; description?: string; image?: string; imagePublicId?: string; amenities?: string[] }>(
  payload: T,
): T {
  return {
    ...payload,
    ...(payload.name !== undefined ? { name: normalizeText(payload.name) } : {}),
    ...(payload.location !== undefined ? { location: normalizeText(payload.location) } : {}),
    ...(payload.address !== undefined ? { address: payload.address ? normalizeText(payload.address) : undefined } : {}),
    ...(payload.description !== undefined ? { description: payload.description ? payload.description.trim() : undefined } : {}),
    ...(payload.image !== undefined ? { image: payload.image ? payload.image.trim() : undefined } : {}),
    ...(payload.imagePublicId !== undefined ? { imagePublicId: payload.imagePublicId ? payload.imagePublicId.trim() : undefined } : {}),
    ...(payload.amenities !== undefined
      ? {
          amenities: Array.from(new Set(payload.amenities.map((item) => normalizeText(item)).filter(Boolean))),
        }
      : {}),
  };
}

function toVenueDto(venue: VenueRecord): VenueDto {
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

async function ensureVenueExists(id: string): Promise<VenueRecord> {
  const venue = (await getVenueDelegate().findUnique({
    where: { id },
    select: (await getVenueSelect()) as never,
  })) as VenueRecord | null;

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
    select: {
      id: true,
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
  const optionalImageData = await getOptionalVenueImageData({
    image: normalizedPayload.image ?? null,
    imagePublicId: normalizedPayload.imagePublicId ?? null,
  });

  const existingName = await venueDelegate.findFirst({
    where: {
      name: { equals: normalizedPayload.name, mode: 'insensitive' },
    },
    select: {
      id: true,
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
      ...optionalImageData,
      amenities: normalizedPayload.amenities ?? [],
      isActive: normalizedPayload.isActive ?? true,
      createdById: normalizedPayload.createdById,
    },
    select: (await getVenueSelect()) as never,
  });

  return toVenueDto(venue as VenueRecord);
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
      select: (await getVenueSelect()) as never,
      orderBy: [{ createdAt: 'desc' }],
      skip,
      take: query.limit,
    }),
    venueDelegate.count({ where: whereClause }),
  ]);

  return {
    venues: (items as VenueRecord[]).map(toVenueDto),
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
      select: {
        id: true,
      },
    });

    if (existingName) {
      throw new AppError('Venue name must be unique', 409);
    }
  }

  const isImageChanging = normalizedPayload.image !== undefined && normalizedPayload.image !== existingVenue.image;
  const nextImagePublicId = normalizedPayload.image !== undefined ? normalizedPayload.imagePublicId ?? null : existingVenue.imagePublicId;
  const optionalImageData = await getOptionalVenueImageData({
    ...(normalizedPayload.image !== undefined ? { image: normalizedPayload.image ?? null, imagePublicId: nextImagePublicId } : {}),
  });

  const venue = await venueDelegate.update({
    where: { id },
    data: {
      ...(normalizedPayload.name !== undefined ? { name: normalizedPayload.name } : {}),
      ...(normalizedPayload.location !== undefined ? { location: normalizedPayload.location } : {}),
      ...(normalizedPayload.address !== undefined ? { address: normalizedPayload.address ?? null } : {}),
      ...(normalizedPayload.capacity !== undefined ? { capacity: normalizedPayload.capacity } : {}),
      ...(normalizedPayload.description !== undefined ? { description: normalizedPayload.description ?? null } : {}),
      ...optionalImageData,
      ...(normalizedPayload.amenities !== undefined ? { amenities: normalizedPayload.amenities } : {}),
      ...(normalizedPayload.isActive !== undefined ? { isActive: normalizedPayload.isActive } : {}),
    },
    select: (await getVenueSelect()) as never,
  });

  if (isImageChanging && existingVenue.imagePublicId && existingVenue.imagePublicId !== nextImagePublicId) {
    await deleteFromCloudinary(existingVenue.imagePublicId);
  }

  return toVenueDto(venue as VenueRecord);
}

export async function deactivateVenue(id: string): Promise<VenueDto> {
  const venueDelegate = getVenueDelegate();
  await ensureVenueExists(id);
  const venue = await venueDelegate.update({
    where: { id },
    data: { isActive: false },
    select: (await getVenueSelect()) as never,
  });

  return toVenueDto(venue as VenueRecord);
}

async function getVenueDeactivationConflicts(id: string): Promise<VenueDeactivationConflictDto[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const bookings = await prisma.venueBooking.findMany({
    where: {
      venueId: id,
      eventId: { not: null },
      status: VENUE_BOOKING_STATUS.BOOKED,
      endDate: { gte: today },
    },
    select: {
      id: true,
      eventId: true,
      startDate: true,
      endDate: true,
      startTime: true,
      endTime: true,
      event: {
        select: {
          title: true,
        },
      },
    },
    orderBy: [{ startDate: 'asc' }, { startTime: 'asc' }, { createdAt: 'asc' }],
  });

  return bookings
    .filter((booking): booking is typeof booking & { eventId: string } => Boolean(booking.eventId))
    .map((booking) => ({
      bookingId: booking.id,
      eventId: booking.eventId,
      eventTitle: booking.event?.title ?? 'Untitled event',
      startDate: booking.startDate,
      endDate: booking.endDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
    }));
}

function buildVenueDeactivationConfirmationMessage(venueName: string, conflicts: VenueDeactivationConflictDto[]): string {
  if (conflicts.length === 0) {
    return `${venueName} will be deactivated. It will not appear for new event bookings.`;
  }

  return `${venueName} is already booked for ${conflicts.length} event${conflicts.length > 1 ? 's' : ''}. If you deactivate it, the venue will not appear for new events, but existing booked events will keep their current venue as it is.`;
}

export async function getVenueDeactivationImpact(id: string): Promise<VenueDeactivationImpactDto> {
  const venue = await ensureVenueExists(id);
  const conflicts = await getVenueDeactivationConflicts(id);

  return {
    venue: toVenueDto(venue),
    hasConflicts: conflicts.length > 0,
    conflicts,
    confirmationMessage: buildVenueDeactivationConfirmationMessage(venue.name, conflicts),
  };
}

export async function toggleVenueStatus(id: string): Promise<VenueStatusChangeDto> {
  const venueDelegate = getVenueDelegate();
  const existingVenue = await ensureVenueExists(id);
  const conflicts = existingVenue.isActive ? await getVenueDeactivationConflicts(id) : [];
  const venue = await venueDelegate.update({
    where: { id },
    data: { isActive: !existingVenue.isActive },
    select: (await getVenueSelect()) as never,
  });

  return {
    venue: toVenueDto(venue as VenueRecord),
    hasConflicts: conflicts.length > 0,
    conflicts,
    ...(existingVenue.isActive ? { confirmationMessage: buildVenueDeactivationConfirmationMessage(existingVenue.name, conflicts) } : {}),
  };
}

export async function getVenueAvailability(venueId: string, dateRange: VenueAvailabilityQuery) {
  await ensureVenueExists(venueId);
  return checkVenueAvailability(venueId, dateRange);
}
