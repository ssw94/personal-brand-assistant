-- Phase 1 foundations: explicit content lifecycle, approval evidence,
-- ownership-scoped audit events, and request idempotency records.

CREATE TYPE "ContentDraftStatus" AS ENUM ('DRAFT', 'REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHING', 'PUBLISHED', 'PUBLISH_FAILED', 'ARCHIVED');
CREATE TYPE "ApprovalDecision" AS ENUM ('APPROVED', 'REJECTED', 'REQUEST_CHANGES');
CREATE TYPE "IdempotencyStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'FAILED');

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "ContentDraft"
    WHERE "status" NOT IN ('DRAFT', 'REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED', 'PUBLISHING', 'PUBLISH_FAILED')
  ) THEN
    RAISE EXCEPTION 'ContentDraft contains unsupported status values; normalize them before applying Phase 1 migration';
  END IF;
END $$;

ALTER TABLE "ContentDraft"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "ContentDraftStatus" USING "status"::"ContentDraftStatus",
  ALTER COLUMN "status" SET DEFAULT 'DRAFT';

CREATE TABLE "AuditEvent" (
  "id" TEXT NOT NULL,
  "ownerUserId" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "resourceType" TEXT NOT NULL,
  "resourceId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "result" TEXT NOT NULL,
  "reason" TEXT,
  "metadata" JSONB,
  "correlationId" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ContentApproval" (
  "id" TEXT NOT NULL,
  "ownerUserId" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "draftId" TEXT NOT NULL,
  "revisionId" TEXT NOT NULL,
  "decision" "ApprovalDecision" NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContentApproval_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IdempotencyRecord" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "operation" TEXT NOT NULL,
  "requestHash" TEXT NOT NULL,
  "status" "IdempotencyStatus" NOT NULL DEFAULT 'IN_PROGRESS',
  "responseStatus" INTEGER,
  "responseBody" JSONB,
  "resourceId" TEXT,
  "errorCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "expiresAt" TIMESTAMP(3),
  CONSTRAINT "IdempotencyRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditEvent_ownerUserId_occurredAt_idx" ON "AuditEvent"("ownerUserId", "occurredAt");
CREATE INDEX "AuditEvent_ownerUserId_resourceType_resourceId_occurredAt_idx" ON "AuditEvent"("ownerUserId", "resourceType", "resourceId", "occurredAt");
CREATE INDEX "AuditEvent_actorUserId_occurredAt_idx" ON "AuditEvent"("actorUserId", "occurredAt");
CREATE INDEX "ContentApproval_ownerUserId_createdAt_idx" ON "ContentApproval"("ownerUserId", "createdAt");
CREATE INDEX "ContentApproval_draftId_createdAt_idx" ON "ContentApproval"("draftId", "createdAt");
CREATE INDEX "ContentApproval_revisionId_idx" ON "ContentApproval"("revisionId");
CREATE UNIQUE INDEX "IdempotencyRecord_userId_key_operation_key" ON "IdempotencyRecord"("userId", "key", "operation");
CREATE INDEX "IdempotencyRecord_userId_createdAt_idx" ON "IdempotencyRecord"("userId", "createdAt");
CREATE INDEX "IdempotencyRecord_expiresAt_idx" ON "IdempotencyRecord"("expiresAt");

ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ContentApproval" ADD CONSTRAINT "ContentApproval_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ContentApproval" ADD CONSTRAINT "ContentApproval_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ContentApproval" ADD CONSTRAINT "ContentApproval_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "ContentDraft"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ContentApproval" ADD CONSTRAINT "ContentApproval_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "ContentRevision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "IdempotencyRecord" ADD CONSTRAINT "IdempotencyRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
