-- Phase 2 generic AI execution infrastructure.
-- No agent, research, publishing, analytics, or billing entities are created here.

CREATE TYPE "AgentRunStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');
CREATE TYPE "AgentFailureCategory" AS ENUM ('CONFIGURATION', 'AUTHENTICATION', 'RATE_LIMIT', 'TIMEOUT', 'PROVIDER_UNAVAILABLE', 'INVALID_REQUEST', 'INVALID_OUTPUT', 'SAFETY_POLICY', 'CANCELLED', 'UNKNOWN');

CREATE TABLE "AgentRun" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "operation" TEXT NOT NULL,
  "status" "AgentRunStatus" NOT NULL DEFAULT 'QUEUED',
  "provider" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "promptIdentifier" TEXT NOT NULL,
  "promptVersion" INTEGER NOT NULL,
  "correlationId" TEXT,
  "idempotencyKey" TEXT,
  "inputTokenCount" INTEGER,
  "outputTokenCount" INTEGER,
  "totalTokenCount" INTEGER,
  "estimatedCost" DOUBLE PRECISION,
  "costCurrency" TEXT,
  "failureCategory" "AgentFailureCategory",
  "failureMessage" TEXT,
  "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AgentRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgentArtifact" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "runId" TEXT NOT NULL,
  "artifactType" TEXT NOT NULL,
  "payload" JSONB,
  "draftId" TEXT,
  "revisionId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AgentArtifact_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PromptVersion" (
  "id" TEXT NOT NULL,
  "identifier" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "schemaName" TEXT,
  "templateDigest" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PromptVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ModelUsage" (
  "id" TEXT NOT NULL,
  "runId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "inputTokens" INTEGER,
  "outputTokens" INTEGER,
  "totalTokens" INTEGER,
  "estimatedCost" DOUBLE PRECISION,
  "costCurrency" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ModelUsage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AgentRun_userId_status_createdAt_idx" ON "AgentRun"("userId", "status", "createdAt");
CREATE UNIQUE INDEX "AgentRun_id_userId_key" ON "AgentRun"("id", "userId");
CREATE INDEX "AgentRun_userId_operation_createdAt_idx" ON "AgentRun"("userId", "operation", "createdAt");
CREATE INDEX "AgentRun_userId_idempotencyKey_idx" ON "AgentRun"("userId", "idempotencyKey");
CREATE INDEX "AgentArtifact_userId_artifactType_createdAt_idx" ON "AgentArtifact"("userId", "artifactType", "createdAt");
CREATE INDEX "AgentArtifact_runId_createdAt_idx" ON "AgentArtifact"("runId", "createdAt");
CREATE INDEX "AgentArtifact_draftId_idx" ON "AgentArtifact"("draftId");
CREATE INDEX "AgentArtifact_revisionId_idx" ON "AgentArtifact"("revisionId");
CREATE UNIQUE INDEX "PromptVersion_identifier_version_key" ON "PromptVersion"("identifier", "version");
CREATE INDEX "PromptVersion_identifier_createdAt_idx" ON "PromptVersion"("identifier", "createdAt");
CREATE INDEX "ModelUsage_runId_createdAt_idx" ON "ModelUsage"("runId", "createdAt");
CREATE INDEX "ModelUsage_provider_model_createdAt_idx" ON "ModelUsage"("provider", "model", "createdAt");

ALTER TABLE "AgentRun" ADD CONSTRAINT "AgentRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgentArtifact" ADD CONSTRAINT "AgentArtifact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgentArtifact" ADD CONSTRAINT "AgentArtifact_runId_userId_fkey" FOREIGN KEY ("runId", "userId") REFERENCES "AgentRun"("id", "userId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgentArtifact" ADD CONSTRAINT "AgentArtifact_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "ContentDraft"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgentArtifact" ADD CONSTRAINT "AgentArtifact_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "ContentRevision"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ModelUsage" ADD CONSTRAINT "ModelUsage_runId_fkey" FOREIGN KEY ("runId") REFERENCES "AgentRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
