-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CertificateStatus" ADD VALUE 'DRAFT';
ALTER TYPE "CertificateStatus" ADD VALUE 'REJECTED';

-- DropIndex
DROP INDEX "User_oauthProvider_oauthId_key";

-- AlterTable
ALTER TABLE "CertificateReview" ADD COLUMN     "reviewerRole" "OrgMemberRole" NOT NULL DEFAULT 'STAFF';
