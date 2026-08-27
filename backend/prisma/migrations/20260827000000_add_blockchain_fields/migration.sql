-- CreateEnum
CREATE TYPE "BlockchainStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED');

-- AlterTable: add blockchain fields to Certificate (all nullable / with defaults so existing rows keep working)
ALTER TABLE "Certificate"
  ADD COLUMN "blockchainTxHash"  TEXT,
  ADD COLUMN "blockchainHash"    TEXT,
  ADD COLUMN "blockchainStatus"  "BlockchainStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "blockchainNetwork" TEXT;
