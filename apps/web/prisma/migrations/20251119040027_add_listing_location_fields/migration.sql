/*
  Warnings:

  - Made the column `city` on table `Listing` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Listing_country_province_idx";

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "addressFull" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "lat" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "latPublic" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "lng" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "lngPublic" DOUBLE PRECISION NOT NULL DEFAULT 0,
ALTER COLUMN "city" SET NOT NULL,
ALTER COLUMN "city" SET DEFAULT '';

-- CreateIndex
CREATE INDEX "Listing_country_province_city_idx" ON "Listing"("country", "province", "city");
