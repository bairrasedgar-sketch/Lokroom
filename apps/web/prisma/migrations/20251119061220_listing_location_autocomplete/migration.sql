-- CreateEnum
CREATE TYPE "MapProvider" AS ENUM ('GOOGLE', 'MAPBOX', 'OTHER');

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "addressLine1" TEXT,
ADD COLUMN     "mapPlaceId" TEXT,
ADD COLUMN     "mapProvider" "MapProvider" NOT NULL DEFAULT 'GOOGLE',
ADD COLUMN     "postalCode" TEXT;

-- CreateIndex
CREATE INDEX "Listing_mapPlaceId_idx" ON "Listing"("mapPlaceId");
