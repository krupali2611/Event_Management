import fs from 'fs';
import path from 'path';
import { prisma } from '../src/config/prisma';
import { cloudinary } from '../src/config/cloudinary';

type MigratedAsset = {
  secureUrl: string;
  publicId: string;
};

const uploadsRoot = path.join(process.cwd(), 'uploads');
const shouldApply = process.argv.includes('--apply');

function resolveLegacyUploadPath(imageUrl: string): string | null {
  const uploadsIndex = imageUrl.indexOf('/uploads/');

  if (uploadsIndex < 0) {
    return null;
  }

  const relativeUploadPath = imageUrl.slice(uploadsIndex + '/uploads/'.length).replace(/\//g, path.sep);
  const absolutePath = path.resolve(uploadsRoot, relativeUploadPath);

  if (!absolutePath.startsWith(uploadsRoot)) {
    return null;
  }

  return absolutePath;
}

async function uploadLegacyFile(localFilePath: string, folder: string): Promise<MigratedAsset> {
  const result = await cloudinary.uploader.upload(localFilePath, {
    folder,
    resource_type: 'image',
  });

  return {
    secureUrl: result.secure_url,
    publicId: result.public_id,
  };
}

async function migrateVenueImages(): Promise<void> {
  const venues = await prisma.venue.findMany({
    where: {
      image: {
        contains: '/uploads/',
      },
    },
    select: {
      id: true,
      image: true,
      imagePublicId: true,
    },
  });

  for (const venue of venues) {
    if (!venue.image || venue.imagePublicId) {
      continue;
    }

    const localFilePath = resolveLegacyUploadPath(venue.image);

    if (!localFilePath || !fs.existsSync(localFilePath)) {
      console.warn(`Skipping venue ${venue.id}: file not found for ${venue.image}`);
      continue;
    }

    const migratedAsset = await uploadLegacyFile(localFilePath, 'event-management-system/venues');

    if (shouldApply) {
      await prisma.venue.update({
        where: { id: venue.id },
        data: {
          image: migratedAsset.secureUrl,
          imagePublicId: migratedAsset.publicId,
        },
      });
    }

    console.log(`${shouldApply ? 'Migrated' : 'Dry run for'} venue ${venue.id}`);
  }
}

async function migrateEventImages(): Promise<void> {
  const events = await prisma.event.findMany({
    select: {
      id: true,
      bannerImage: true,
      bannerImagePublicId: true,
      galleryImages: true,
      galleryImagePublicIds: true,
    },
  });

  for (const event of events) {
    const hasLegacyBanner = Boolean(event.bannerImage?.includes('/uploads/'));
    const hasLegacyGallery = event.galleryImages.some((imageUrl) => imageUrl.includes('/uploads/'));

    if (!hasLegacyBanner && !hasLegacyGallery) {
      continue;
    }

    let nextBannerImage = event.bannerImage;
    let nextBannerImagePublicId = event.bannerImagePublicId;
    const nextGalleryImages = [...event.galleryImages];
    const nextGalleryImagePublicIds = [...event.galleryImagePublicIds];

    if (event.bannerImage && !event.bannerImagePublicId && event.bannerImage.includes('/uploads/')) {
      const localBannerPath = resolveLegacyUploadPath(event.bannerImage);

      if (localBannerPath && fs.existsSync(localBannerPath)) {
        const migratedBanner = await uploadLegacyFile(localBannerPath, 'event-management-system/events/banners');
        nextBannerImage = migratedBanner.secureUrl;
        nextBannerImagePublicId = migratedBanner.publicId;
      } else {
        console.warn(`Skipping banner for event ${event.id}: file not found for ${event.bannerImage}`);
      }
    }

    for (let index = 0; index < event.galleryImages.length; index += 1) {
      const imageUrl = event.galleryImages[index];
      const existingPublicId = event.galleryImagePublicIds[index];

      if (!imageUrl?.includes('/uploads/') || existingPublicId) {
        continue;
      }

      const localGalleryPath = resolveLegacyUploadPath(imageUrl);

      if (!localGalleryPath || !fs.existsSync(localGalleryPath)) {
        console.warn(`Skipping gallery image for event ${event.id}: file not found for ${imageUrl}`);
        continue;
      }

      const migratedGalleryImage = await uploadLegacyFile(localGalleryPath, 'event-management-system/events/gallery');
      nextGalleryImages[index] = migratedGalleryImage.secureUrl;
      nextGalleryImagePublicIds[index] = migratedGalleryImage.publicId;
    }

    if (shouldApply) {
      await prisma.event.update({
        where: { id: event.id },
        data: {
          bannerImage: nextBannerImage,
          bannerImagePublicId: nextBannerImagePublicId,
          galleryImages: nextGalleryImages,
          galleryImagePublicIds: nextGalleryImagePublicIds,
        },
      });
    }

    console.log(`${shouldApply ? 'Migrated' : 'Dry run for'} event ${event.id}`);
  }
}

async function main(): Promise<void> {
  console.log(shouldApply ? 'Applying Cloudinary migration for legacy local images...' : 'Running dry-run for legacy local image migration...');
  await migrateVenueImages();
  await migrateEventImages();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
