-- AlterTable: make passwordHash nullable and add OAuth fields
ALTER TABLE "User"
  ALTER COLUMN "passwordHash" DROP NOT NULL,
  ADD COLUMN "oauthProvider" TEXT,
  ADD COLUMN "oauthId"       TEXT,
  ADD COLUMN "avatarUrl"     TEXT;

-- Create unique index so one Google account can't link to two users
CREATE UNIQUE INDEX "User_oauthProvider_oauthId_key" ON "User"("oauthProvider", "oauthId");
