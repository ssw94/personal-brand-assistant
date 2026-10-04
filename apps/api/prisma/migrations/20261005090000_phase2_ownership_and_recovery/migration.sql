-- Harden Phase 2 run ownership/recovery and artifact-to-content ownership.

ALTER TABLE "AgentRun"
  ADD COLUMN "schemaName" TEXT NOT NULL DEFAULT 'unknown',
  ADD COLUMN "schemaVersion" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "heartbeatAt" TIMESTAMP(3),
  ADD COLUMN "leaseExpiresAt" TIMESTAMP(3);

ALTER TABLE "PromptVersion"
  ADD COLUMN "schemaVersion" INTEGER NOT NULL DEFAULT 1;
UPDATE "PromptVersion" SET "schemaName" = 'unknown' WHERE "schemaName" IS NULL;
ALTER TABLE "PromptVersion" ALTER COLUMN "schemaName" SET NOT NULL;
ALTER TABLE "AgentRun" ALTER COLUMN "schemaName" DROP DEFAULT;
ALTER TABLE "AgentRun" ALTER COLUMN "schemaVersion" DROP DEFAULT;
ALTER TABLE "PromptVersion" ALTER COLUMN "schemaVersion" DROP DEFAULT;

CREATE UNIQUE INDEX "ContentDraft_id_userId_key" ON "ContentDraft"("id", "userId");

ALTER TABLE "ContentRevision" ADD COLUMN "userId" TEXT;
UPDATE "ContentRevision" AS revision
SET "userId" = draft."userId"
FROM "ContentDraft" AS draft
WHERE revision."draftId" = draft."id";
ALTER TABLE "ContentRevision" ALTER COLUMN "userId" SET NOT NULL;

ALTER TABLE "ContentRevision" DROP CONSTRAINT "ContentRevision_draftId_fkey";
ALTER TABLE "ContentRevision" ADD CONSTRAINT "ContentRevision_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContentRevision" ADD CONSTRAINT "ContentRevision_draftId_userId_fkey" FOREIGN KEY ("draftId", "userId") REFERENCES "ContentDraft"("id", "userId") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "ContentRevision_id_userId_key" ON "ContentRevision"("id", "userId");
ALTER TABLE "AgentArtifact" DROP CONSTRAINT "AgentArtifact_draftId_fkey";
ALTER TABLE "AgentArtifact" DROP CONSTRAINT "AgentArtifact_revisionId_fkey";
ALTER TABLE "AgentArtifact" ADD CONSTRAINT "AgentArtifact_draftId_userId_fkey" FOREIGN KEY ("draftId", "userId") REFERENCES "ContentDraft"("id", "userId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgentArtifact" ADD CONSTRAINT "AgentArtifact_revisionId_userId_fkey" FOREIGN KEY ("revisionId", "userId") REFERENCES "ContentRevision"("id", "userId") ON DELETE RESTRICT ON UPDATE CASCADE;
