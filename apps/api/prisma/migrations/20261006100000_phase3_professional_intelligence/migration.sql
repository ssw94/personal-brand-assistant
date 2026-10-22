-- Phase 3 professional intelligence: provenance-aware memory and writing style.

CREATE TYPE "MemoryFactType" AS ENUM ('SUMMARY', 'EXPERIENCE', 'EDUCATION', 'SKILL', 'PROJECT', 'CERTIFICATION', 'ACHIEVEMENT', 'PREFERENCE', 'OTHER');
CREATE TYPE "MemoryReviewState" AS ENUM ('CANDIDATE', 'VERIFIED', 'REJECTED', 'SUPERSEDED');
CREATE TYPE "MemorySourceType" AS ENUM ('PROFILE', 'RESUME', 'PROJECT', 'USER_ENTERED', 'IMPORTED_DOCUMENT', 'AI_EXTRACTED_CANDIDATE');
CREATE TYPE "StyleExampleSourceType" AS ENUM ('USER_ENTERED', 'CONTENT_DRAFT', 'IMPORTED_DOCUMENT');

CREATE TABLE "SourceDocument" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "sourceType" "MemorySourceType" NOT NULL,
  "sourceRef" TEXT,
  "title" TEXT NOT NULL,
  "contentHash" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SourceDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MemoryFact" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "factType" "MemoryFactType" NOT NULL,
  "category" TEXT NOT NULL,
  "normalizedValue" TEXT NOT NULL,
  "canonicalKey" TEXT,
  "confidence" DOUBLE PRECISION,
  "reviewState" "MemoryReviewState" NOT NULL DEFAULT 'CANDIDATE',
  "version" INTEGER NOT NULL DEFAULT 1,
  "verifiedAt" TIMESTAMP(3),
  "rejectedAt" TIMESTAMP(3),
  "supersededAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MemoryFact_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MemoryFactVersion" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "factId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "factType" "MemoryFactType" NOT NULL,
  "category" TEXT NOT NULL,
  "normalizedValue" TEXT NOT NULL,
  "confidence" DOUBLE PRECISION,
  "reviewState" "MemoryReviewState" NOT NULL,
  "changeReason" TEXT,
  "changedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MemoryFactVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MemorySource" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "factId" TEXT NOT NULL,
  "sourceType" "MemorySourceType" NOT NULL,
  "sourceRef" TEXT,
  "sourceDocumentId" TEXT,
  "sourceDocumentUserId" TEXT,
  "sourceLabel" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MemorySource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WritingStyleProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tone" TEXT,
  "sentenceStyle" TEXT,
  "technicalDepth" TEXT,
  "storytellingPreference" TEXT,
  "hookStyle" TEXT,
  "formattingPreference" TEXT,
  "emojiUsage" TEXT,
  "ctaPreference" TEXT,
  "opinionStrength" TEXT,
  "firstPersonUsage" TEXT,
  "typicalLength" TEXT,
  "explicitPreferences" JSONB,
  "reviewState" "MemoryReviewState" NOT NULL DEFAULT 'CANDIDATE',
  "analysisRunId" TEXT,
  "analysisRunUserId" TEXT,
  "analyzedExampleIds" JSONB,
  "analyzedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WritingStyleProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WritingStyleExample" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "sourceType" "StyleExampleSourceType" NOT NULL,
  "sourceRef" TEXT,
  "includedInAnalysis" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WritingStyleExample_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WritingStyleProfile_userId_key" ON "WritingStyleProfile"("userId");
CREATE UNIQUE INDEX "SourceDocument_id_userId_key" ON "SourceDocument"("id", "userId");
CREATE UNIQUE INDEX "MemoryFact_id_userId_key" ON "MemoryFact"("id", "userId");
CREATE UNIQUE INDEX "MemoryFactVersion_factId_version_key" ON "MemoryFactVersion"("factId", "version");
CREATE INDEX "SourceDocument_userId_sourceType_updatedAt_idx" ON "SourceDocument"("userId", "sourceType", "updatedAt");
CREATE INDEX "SourceDocument_userId_sourceRef_idx" ON "SourceDocument"("userId", "sourceRef");
CREATE INDEX "MemoryFact_userId_reviewState_updatedAt_idx" ON "MemoryFact"("userId", "reviewState", "updatedAt");
CREATE INDEX "MemoryFact_userId_factType_reviewState_idx" ON "MemoryFact"("userId", "factType", "reviewState");
CREATE INDEX "MemoryFact_userId_canonicalKey_idx" ON "MemoryFact"("userId", "canonicalKey");
CREATE INDEX "MemoryFactVersion_userId_factId_createdAt_idx" ON "MemoryFactVersion"("userId", "factId", "createdAt");
CREATE INDEX "MemorySource_userId_factId_createdAt_idx" ON "MemorySource"("userId", "factId", "createdAt");
CREATE INDEX "MemorySource_userId_sourceType_sourceRef_idx" ON "MemorySource"("userId", "sourceType", "sourceRef");
CREATE INDEX "MemorySource_sourceDocumentId_idx" ON "MemorySource"("sourceDocumentId");
CREATE INDEX "WritingStyleProfile_reviewState_updatedAt_idx" ON "WritingStyleProfile"("reviewState", "updatedAt");
CREATE INDEX "WritingStyleProfile_analysisRunId_idx" ON "WritingStyleProfile"("analysisRunId");
CREATE INDEX "WritingStyleExample_userId_includedInAnalysis_updatedAt_idx" ON "WritingStyleExample"("userId", "includedInAnalysis", "updatedAt");
CREATE INDEX "WritingStyleExample_userId_sourceType_sourceRef_idx" ON "WritingStyleExample"("userId", "sourceType", "sourceRef");

ALTER TABLE "SourceDocument" ADD CONSTRAINT "SourceDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MemoryFact" ADD CONSTRAINT "MemoryFact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MemoryFactVersion" ADD CONSTRAINT "MemoryFactVersion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MemoryFactVersion" ADD CONSTRAINT "MemoryFactVersion_factId_userId_fkey" FOREIGN KEY ("factId", "userId") REFERENCES "MemoryFact"("id", "userId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MemorySource" ADD CONSTRAINT "MemorySource_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MemorySource" ADD CONSTRAINT "MemorySource_factId_userId_fkey" FOREIGN KEY ("factId", "userId") REFERENCES "MemoryFact"("id", "userId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MemorySource" ADD CONSTRAINT "MemorySource_sourceDocumentId_sourceDocumentUserId_fkey" FOREIGN KEY ("sourceDocumentId", "sourceDocumentUserId") REFERENCES "SourceDocument"("id", "userId") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WritingStyleProfile" ADD CONSTRAINT "WritingStyleProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WritingStyleProfile" ADD CONSTRAINT "WritingStyleProfile_analysisRunId_analysisRunUserId_fkey" FOREIGN KEY ("analysisRunId", "analysisRunUserId") REFERENCES "AgentRun"("id", "userId") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WritingStyleExample" ADD CONSTRAINT "WritingStyleExample_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
