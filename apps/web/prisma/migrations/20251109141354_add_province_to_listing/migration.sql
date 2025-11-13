-- CreateEnum
CREATE TYPE "ProvinceCA" AS ENUM ('AB', 'BC', 'ON', 'QC', 'NB', 'NS', 'NL', 'PE');

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "province" "ProvinceCA";

-- CreateIndex
CREATE INDEX "Listing_country_province_idx" ON "Listing"("country", "province");
