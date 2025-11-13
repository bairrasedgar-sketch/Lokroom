-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('EUR', 'CAD');

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'EUR',
ALTER COLUMN "price" SET DATA TYPE DOUBLE PRECISION;
