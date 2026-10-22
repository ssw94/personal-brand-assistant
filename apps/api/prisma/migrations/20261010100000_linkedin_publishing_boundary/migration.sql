CREATE TABLE "LinkedInAccount" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "providerMemberId" TEXT NOT NULL,
  "displayName" TEXT,
  "scopes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "accessTokenCiphertext" TEXT NOT NULL,
  "accessTokenExpiresAt" TIMESTAMP(3),
  "refreshTokenCiphertext" TEXT,
  "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "disconnectedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LinkedInAccount_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "LinkedInAccount_id_userId_key" ON "LinkedInAccount"("id", "userId");
CREATE UNIQUE INDEX "LinkedInAccount_userId_providerMemberId_key" ON "LinkedInAccount"("userId", "providerMemberId");
CREATE INDEX "LinkedInAccount_userId_disconnectedAt_idx" ON "LinkedInAccount"("userId", "disconnectedAt");
ALTER TABLE "LinkedInAccount" ADD CONSTRAINT "LinkedInAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "OAuthState" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "stateHash" TEXT NOT NULL,
  "codeVerifierHash" TEXT NOT NULL,
  "redirectUri" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OAuthState_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "OAuthState_provider_stateHash_key" ON "OAuthState"("provider", "stateHash");
CREATE INDEX "OAuthState_userId_provider_expiresAt_idx" ON "OAuthState"("userId", "provider", "expiresAt");
ALTER TABLE "OAuthState" ADD CONSTRAINT "OAuthState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "PublishedPost" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "draftId" TEXT NOT NULL,
  "revisionId" TEXT NOT NULL,
  "providerPostId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
  "publishedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PublishedPost_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PublishedPost_userId_providerPostId_key" ON "PublishedPost"("userId", "providerPostId");
CREATE UNIQUE INDEX "PublishedPost_id_userId_key" ON "PublishedPost"("id", "userId");
CREATE UNIQUE INDEX "PublishedPost_userId_draftId_revisionId_key" ON "PublishedPost"("userId", "draftId", "revisionId");
CREATE INDEX "PublishedPost_userId_publishedAt_idx" ON "PublishedPost"("userId", "publishedAt");
ALTER TABLE "PublishedPost" ADD CONSTRAINT "PublishedPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PublishedPost" ADD CONSTRAINT "PublishedPost_accountId_userId_fkey" FOREIGN KEY ("accountId", "userId") REFERENCES "LinkedInAccount"("id", "userId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PublishedPost" ADD CONSTRAINT "PublishedPost_draftId_userId_fkey" FOREIGN KEY ("draftId", "userId") REFERENCES "ContentDraft"("id", "userId") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "PublishingAttempt" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "publishedPostId" TEXT,
  "draftId" TEXT NOT NULL,
  "revisionId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "providerStatus" INTEGER,
  "providerPostId" TEXT,
  "errorCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PublishingAttempt_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PublishingAttempt_userId_draftId_createdAt_idx" ON "PublishingAttempt"("userId", "draftId", "createdAt");
ALTER TABLE "PublishingAttempt" ADD CONSTRAINT "PublishingAttempt_publishedPostId_userId_fkey" FOREIGN KEY ("publishedPostId", "userId") REFERENCES "PublishedPost"("id", "userId") ON DELETE RESTRICT ON UPDATE CASCADE;
