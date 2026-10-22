CREATE TYPE "InsightStatus" AS ENUM ('CANDIDATE', 'ACCEPTED', 'DISMISSED');
CREATE TABLE "AnalyticsInsight" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "evidence" JSONB NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL,
  "status" "InsightStatus" NOT NULL DEFAULT 'CANDIDATE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AnalyticsInsight_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AnalyticsInsight_id_userId_key" ON "AnalyticsInsight"("id", "userId");
CREATE UNIQUE INDEX "AnalyticsInsight_userId_kind_summary_key" ON "AnalyticsInsight"("userId", "kind", "summary");
CREATE INDEX "AnalyticsInsight_userId_status_createdAt_idx" ON "AnalyticsInsight"("userId", "status", "createdAt");
ALTER TABLE "AnalyticsInsight" ADD CONSTRAINT "AnalyticsInsight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE TABLE "TopicFeedbackCandidate" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "insightId" TEXT NOT NULL,
  "guidance" TEXT NOT NULL,
  "status" "InsightStatus" NOT NULL DEFAULT 'CANDIDATE',
  "acceptedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TopicFeedbackCandidate_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TopicFeedbackCandidate_userId_status_createdAt_idx" ON "TopicFeedbackCandidate"("userId", "status", "createdAt");
ALTER TABLE "TopicFeedbackCandidate" ADD CONSTRAINT "TopicFeedbackCandidate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TopicFeedbackCandidate" ADD CONSTRAINT "TopicFeedbackCandidate_insightId_userId_fkey" FOREIGN KEY ("insightId", "userId") REFERENCES "AnalyticsInsight"("id", "userId") ON DELETE CASCADE ON UPDATE CASCADE;
