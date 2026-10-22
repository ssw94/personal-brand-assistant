CREATE TYPE "TopicCandidateStatus" AS ENUM ('CANDIDATE', 'SELECTED', 'REJECTED', 'EXPIRED');

CREATE TABLE "TopicCandidate" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "runId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "angle" TEXT NOT NULL,
  "rationale" TEXT NOT NULL,
  "noveltyKey" TEXT NOT NULL,
  "memoryFactIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "researchSourceIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "status" "TopicCandidateStatus" NOT NULL DEFAULT 'CANDIDATE',
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TopicCandidate_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TopicCandidate_id_userId_key" ON "TopicCandidate"("id", "userId");
CREATE INDEX "TopicCandidate_userId_status_createdAt_idx" ON "TopicCandidate"("userId", "status", "createdAt");
CREATE INDEX "TopicCandidate_userId_noveltyKey_idx" ON "TopicCandidate"("userId", "noveltyKey");
ALTER TABLE "TopicCandidate" ADD CONSTRAINT "TopicCandidate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TopicCandidate" ADD CONSTRAINT "TopicCandidate_runId_userId_fkey" FOREIGN KEY ("runId", "userId") REFERENCES "AgentRun"("id", "userId") ON DELETE CASCADE ON UPDATE CASCADE;
