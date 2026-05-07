ALTER TABLE "Event"
ADD COLUMN "bannerImage" TEXT,
ADD COLUMN "galleryImages" TEXT[] DEFAULT ARRAY[]::TEXT[];
