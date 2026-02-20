-- CreateTable
CREATE TABLE "MarketingSocialPost" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "channels" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingSocialPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingExperiment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "winnerVariantKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "MarketingExperiment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingExperimentVariant" (
    "id" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trafficPct" INTEGER NOT NULL,
    "exposures" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingExperimentVariant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarketingSocialPost_tenantId_idx" ON "MarketingSocialPost"("tenantId");

-- CreateIndex
CREATE INDEX "MarketingSocialPost_tenantId_status_idx" ON "MarketingSocialPost"("tenantId", "status");

-- CreateIndex
CREATE INDEX "MarketingSocialPost_tenantId_createdAt_idx" ON "MarketingSocialPost"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "MarketingExperiment_tenantId_idx" ON "MarketingExperiment"("tenantId");

-- CreateIndex
CREATE INDEX "MarketingExperiment_tenantId_status_idx" ON "MarketingExperiment"("tenantId", "status");

-- CreateIndex
CREATE INDEX "MarketingExperiment_tenantId_type_idx" ON "MarketingExperiment"("tenantId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "MarketingExperimentVariant_experimentId_key_key" ON "MarketingExperimentVariant"("experimentId", "key");

-- CreateIndex
CREATE INDEX "MarketingExperimentVariant_experimentId_idx" ON "MarketingExperimentVariant"("experimentId");

-- AddForeignKey
ALTER TABLE "MarketingSocialPost" ADD CONSTRAINT "MarketingSocialPost_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingExperiment" ADD CONSTRAINT "MarketingExperiment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingExperimentVariant" ADD CONSTRAINT "MarketingExperimentVariant_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "MarketingExperiment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
