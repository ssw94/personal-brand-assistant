CREATE TYPE "WorkflowRunStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');
CREATE TYPE "WorkflowStepStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

CREATE TABLE "WorkflowRun" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "topicId" TEXT NOT NULL,
  "draftId" TEXT,
  "status" "WorkflowRunStatus" NOT NULL DEFAULT 'QUEUED',
  "currentStep" TEXT,
  "failureReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WorkflowRun_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "WorkflowRun_id_userId_key" ON "WorkflowRun"("id", "userId");
CREATE INDEX "WorkflowRun_userId_status_createdAt_idx" ON "WorkflowRun"("userId", "status", "createdAt");
ALTER TABLE "WorkflowRun" ADD CONSTRAINT "WorkflowRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkflowRun" ADD CONSTRAINT "WorkflowRun_topicId_userId_fkey" FOREIGN KEY ("topicId", "userId") REFERENCES "TopicCandidate"("id", "userId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorkflowRun" ADD CONSTRAINT "WorkflowRun_draftId_userId_fkey" FOREIGN KEY ("draftId", "userId") REFERENCES "ContentDraft"("id", "userId") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "WorkflowStep" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "runId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "status" "WorkflowStepStatus" NOT NULL DEFAULT 'QUEUED',
  "agentRunId" TEXT,
  "error" TEXT,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkflowStep_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "WorkflowStep_userId_runId_createdAt_idx" ON "WorkflowStep"("userId", "runId", "createdAt");
ALTER TABLE "WorkflowStep" ADD CONSTRAINT "WorkflowStep_runId_userId_fkey" FOREIGN KEY ("runId", "userId") REFERENCES "WorkflowRun"("id", "userId") ON DELETE CASCADE ON UPDATE CASCADE;
