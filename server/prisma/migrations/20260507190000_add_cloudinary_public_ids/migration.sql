ALTER TABLE "Event"
ADD COLUMN "bannerImagePublicId" TEXT,
ADD COLUMN "galleryImagePublicIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "Venue"
ADD COLUMN "imagePublicId" TEXT;
