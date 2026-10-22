CREATE TABLE "StripeCustomer" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "providerCustomerId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StripeCustomer_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "StripeCustomer_userId_key" ON "StripeCustomer"("userId");
CREATE UNIQUE INDEX "StripeCustomer_providerCustomerId_key" ON "StripeCustomer"("providerCustomerId");
ALTER TABLE "StripeCustomer" ADD CONSTRAINT "StripeCustomer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE TABLE "StripeSubscription" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "providerSubscriptionId" TEXT NOT NULL,
  "providerCustomerId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "currentPeriodStart" TIMESTAMP(3),
  "currentPeriodEnd" TIMESTAMP(3),
  "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StripeSubscription_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "StripeSubscription_providerSubscriptionId_key" ON "StripeSubscription"("providerSubscriptionId");
CREATE INDEX "StripeSubscription_userId_status_idx" ON "StripeSubscription"("userId", "status");
ALTER TABLE "StripeSubscription" ADD CONSTRAINT "StripeSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE TABLE "StripeEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "providerEventId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "payloadHash" TEXT NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  CONSTRAINT "StripeEvent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "StripeEvent_providerEventId_key" ON "StripeEvent"("providerEventId");
ALTER TABLE "StripeEvent" ADD CONSTRAINT "StripeEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
