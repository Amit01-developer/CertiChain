-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ReviewDecision" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable: add reviews relation to Certificate (no column change needed — handled via foreign key on CertificateReview)

-- CreateTable: StaffInvitation
CREATE TABLE "StaffInvitation" (
    "id"             TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email"          TEXT NOT NULL,
    "tokenHash"      TEXT NOT NULL,
    "role"           "OrgMemberRole" NOT NULL DEFAULT 'STAFF',
    "status"         "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "invitedById"    TEXT,
    "expiresAt"      TIMESTAMP(3) NOT NULL,
    "acceptedAt"     TIMESTAMP(3),
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CertificateReview
CREATE TABLE "CertificateReview" (
    "id"            TEXT NOT NULL,
    "certificateId" TEXT NOT NULL,
    "reviewerId"    TEXT NOT NULL,
    "decision"      "ReviewDecision" NOT NULL DEFAULT 'PENDING',
    "comment"       TEXT,
    "decidedAt"     TIMESTAMP(3),
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CertificateReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StaffInvitation_tokenHash_key" ON "StaffInvitation"("tokenHash");
CREATE UNIQUE INDEX "StaffInvitation_organizationId_email_key" ON "StaffInvitation"("organizationId", "email");
CREATE INDEX "StaffInvitation_tokenHash_idx" ON "StaffInvitation"("tokenHash");
CREATE INDEX "StaffInvitation_organizationId_idx" ON "StaffInvitation"("organizationId");

CREATE UNIQUE INDEX "CertificateReview_certificateId_reviewerId_key" ON "CertificateReview"("certificateId", "reviewerId");
CREATE INDEX "CertificateReview_certificateId_idx" ON "CertificateReview"("certificateId");
CREATE INDEX "CertificateReview_reviewerId_idx" ON "CertificateReview"("reviewerId");
CREATE INDEX "CertificateReview_decision_idx" ON "CertificateReview"("decision");

-- AddForeignKey
ALTER TABLE "StaffInvitation" ADD CONSTRAINT "StaffInvitation_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificateReview" ADD CONSTRAINT "CertificateReview_certificateId_fkey"
    FOREIGN KEY ("certificateId") REFERENCES "Certificate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificateReview" ADD CONSTRAINT "CertificateReview_reviewerId_fkey"
    FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
