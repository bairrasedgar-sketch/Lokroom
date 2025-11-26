-- AlterTable
ALTER TABLE "HostProfile" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "experienceYears" INTEGER,
ADD COLUMN     "instagram" TEXT,
ADD COLUMN     "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "responseTimeCategory" TEXT,
ADD COLUMN     "superhost" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verifiedEmail" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verifiedPhone" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "website" TEXT;
