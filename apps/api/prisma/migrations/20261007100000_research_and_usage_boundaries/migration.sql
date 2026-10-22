CREATE TYPE "ResearchRunStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', 'UNAVAILABLE');
CREATE TYPE "ResearchSourceSafety" AS ENUM ('UNCLASSIFIED', 'SAFE_DATA', 'PROMPT_INJECTION_SUSPECTED', 'BLOCKED');
CREATE TYPE "UsagePeriodStatus" AS ENUM ('OPEN', 'CLOSED');
CREATE TYPE "UsageReservationStatus" AS ENUM ('RESERVED', 'CONSUMED', 'RELEASED', 'EXPIRED');

CREATE TABLE "ResearchRun" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "query" TEXT NOT NULL,
  "status" "ResearchRunStatus" NOT NULL DEFAULT 'QUEUED',
  "provider" TEXT NOT NULL,
  "failureReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ResearchRun_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ResearchRun_id_userId_key" ON "ResearchRun"("id", "userId");
CREATE INDEX "ResearchRun_userId_status_createdAt_idx" ON "ResearchRun"("userId", "status", "createdAt");
ALTER TABLE "ResearchRun" ADD CONSTRAINT "ResearchRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ResearchSource" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "runId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "title" TEXT,
  "contentHash" TEXT NOT NULL,
  "content" TEXT,
  "fetchedAt" TIMESTAMP(3),
  "freshnessUntil" TIMESTAMP(3),
  "safety" "ResearchSourceSafety" NOT NULL DEFAULT 'UNCLASSIFIED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ResearchSource_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ResearchSource_id_userId_key" ON "ResearchSource"("id", "userId");
CREATE UNIQUE INDEX "ResearchSource_runId_url_key" ON "ResearchSource"("runId", "url");
CREATE INDEX "ResearchSource_userId_createdAt_idx" ON "ResearchSource"("userId", "createdAt");
CREATE INDEX "ResearchSource_userId_contentHash_idx" ON "ResearchSource"("userId", "contentHash");
ALTER TABLE "ResearchSource" ADD CONSTRAINT "ResearchSource_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ResearchSource" ADD CONSTRAINT "ResearchSource_runId_userId_fkey" FOREIGN KEY ("runId", "userId") REFERENCES "ResearchRun"("id", "userId") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ResearchCitation" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "claim" TEXT NOT NULL,
  "quote" TEXT,
  "locator" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ResearchCitation_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ResearchCitation_userId_sourceId_idx" ON "ResearchCitation"("userId", "sourceId");
ALTER TABLE "ResearchCitation" ADD CONSTRAINT "ResearchCitation_sourceId_userId_fkey" FOREIGN KEY ("sourceId", "userId") REFERENCES "ResearchSource"("id", "userId") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "UsagePeriod" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "periodStart" TIMESTAMP(3) NOT NULL,
  "periodEnd" TIMESTAMP(3) NOT NULL,
  "postLimit" INTEGER,
  "reservedPosts" INTEGER NOT NULL DEFAULT 0,
  "consumedPosts" INTEGER NOT NULL DEFAULT 0,
  "status" "UsagePeriodStatus" NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UsagePeriod_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "UsagePeriod_id_userId_key" ON "UsagePeriod"("id", "userId");
CREATE UNIQUE INDEX "UsagePeriod_userId_periodStart_periodEnd_key" ON "UsagePeriod"("userId", "periodStart", "periodEnd");
CREATE INDEX "UsagePeriod_userId_status_periodEnd_idx" ON "UsagePeriod"("userId", "status", "periodEnd");
ALTER TABLE "UsagePeriod" ADD CONSTRAINT "UsagePeriod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "UsageReservation" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "periodId" TEXT NOT NULL,
  "operation" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "status" "UsageReservationStatus" NOT NULL DEFAULT 'RESERVED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "consumedAt" TIMESTAMP(3),
  "releasedAt" TIMESTAMP(3),
  CONSTRAINT "UsageReservation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "UsageReservation_userId_operation_idempotencyKey_key" ON "UsageReservation"("userId", "operation", "idempotencyKey");
CREATE INDEX "UsageReservation_userId_status_createdAt_idx" ON "UsageReservation"("userId", "status", "createdAt");
ALTER TABLE "UsageReservation" ADD CONSTRAINT "UsageReservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UsageReservation" ADD CONSTRAINT "UsageReservation_periodId_userId_fkey" FOREIGN KEY ("periodId", "userId") REFERENCES "UsagePeriod"("id", "userId") ON DELETE CASCADE ON UPDATE CASCADE;
