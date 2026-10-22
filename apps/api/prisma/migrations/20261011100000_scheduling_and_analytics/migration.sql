CREATE TYPE "PublishingJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

CREATE TABLE "PublishingJob" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "draftId" TEXT NOT NULL,
  "revisionId" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "scheduledAt" TIMESTAMP(3) NOT NULL,
  "timezone" TEXT NOT NULL,
  "status" "PublishingJobStatus" NOT NULL DEFAULT 'QUEUED',
  "idempotencyKey" TEXT NOT NULL,
  "leaseUntil" TIMESTAMP(3),
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PublishingJob_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PublishingJob_userId_idempotencyKey_key" ON "PublishingJob"("userId", "idempotencyKey");
CREATE UNIQUE INDEX "PublishingJob_id_userId_key" ON "PublishingJob"("id", "userId");
CREATE INDEX "PublishingJob_userId_status_scheduledAt_idx" ON "PublishingJob"("userId", "status", "scheduledAt");
ALTER TABLE "PublishingJob" ADD CONSTRAINT "PublishingJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PublishingJob" ADD CONSTRAINT "PublishingJob_draftId_userId_fkey" FOREIGN KEY ("draftId", "userId") REFERENCES "ContentDraft"("id", "userId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PublishingJob" ADD CONSTRAINT "PublishingJob_accountId_userId_fkey" FOREIGN KEY ("accountId", "userId") REFERENCES "LinkedInAccount"("id", "userId") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "PublishingJobAttempt" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "PublishingJobAttempt_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PublishingJobAttempt_userId_jobId_createdAt_idx" ON "PublishingJobAttempt"("userId", "jobId", "createdAt");
ALTER TABLE "PublishingJobAttempt" ADD CONSTRAINT "PublishingJobAttempt_jobId_userId_fkey" FOREIGN KEY ("jobId", "userId") REFERENCES "PublishingJob"("id", "userId") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "AnalyticsEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "publishedPostId" TEXT,
  "provider" TEXT NOT NULL,
  "providerEventId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AnalyticsEvent_userId_providerEventId_key" ON "AnalyticsEvent"("userId", "providerEventId");
CREATE INDEX "AnalyticsEvent_userId_eventType_occurredAt_idx" ON "AnalyticsEvent"("userId", "eventType", "occurredAt");
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_publishedPostId_userId_fkey" FOREIGN KEY ("publishedPostId", "userId") REFERENCES "PublishedPost"("id", "userId") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "PostMetricSnapshot" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "publishedPostId" TEXT NOT NULL,
  "metricName" TEXT NOT NULL,
  "value" DOUBLE PRECISION NOT NULL,
  "observedAt" TIMESTAMP(3) NOT NULL,
  "provider" TEXT NOT NULL,
  "capability" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PostMetricSnapshot_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PostMetricSnapshot_userId_publishedPostId_metricName_observ_key" ON "PostMetricSnapshot"("userId", "publishedPostId", "metricName", "observedAt");
CREATE INDEX "PostMetricSnapshot_userId_metricName_observedAt_idx" ON "PostMetricSnapshot"("userId", "metricName", "observedAt");
ALTER TABLE "PostMetricSnapshot" ADD CONSTRAINT "PostMetricSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PostMetricSnapshot" ADD CONSTRAINT "PostMetricSnapshot_publishedPostId_userId_fkey" FOREIGN KEY ("publishedPostId", "userId") REFERENCES "PublishedPost"("id", "userId") ON DELETE CASCADE ON UPDATE CASCADE;
