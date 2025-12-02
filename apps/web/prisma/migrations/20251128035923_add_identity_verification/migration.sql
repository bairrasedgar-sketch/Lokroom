/*
  Warnings:

  - You are about to drop the column `phoneNumber` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `phonePendingNumber` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `phoneVerificationCodeHash` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `phoneVerificationExpiresAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `phoneVerifiedAt` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "IdentityVerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');

-- DropIndex
DROP INDEX "User_phoneNumber_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "phoneNumber",
DROP COLUMN "phonePendingNumber",
DROP COLUMN "phoneVerificationCodeHash",
DROP COLUMN "phoneVerificationExpiresAt",
DROP COLUMN "phoneVerifiedAt",
ADD COLUMN     "identityLastVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "identityStatus" "IdentityVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
ADD COLUMN     "identityStripeSessionId" TEXT;
