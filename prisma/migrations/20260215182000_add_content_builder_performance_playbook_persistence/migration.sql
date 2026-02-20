-- CreateTable
CREATE TABLE "ContentPerformanceEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentPerformanceEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentReusableBlock" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sectionType" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "ctaLabel" TEXT,
    "ctaUrl" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentReusableBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesPlaybookRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "steps" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesPlaybookRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentPerformanceEvent_tenantId_idx" ON "ContentPerformanceEvent"("tenantId");

-- CreateIndex
CREATE INDEX "ContentPerformanceEvent_tenantId_sourceType_sourceId_idx" ON "ContentPerformanceEvent"("tenantId", "sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "ContentPerformanceEvent_tenantId_channel_idx" ON "ContentPerformanceEvent"("tenantId", "channel");

-- CreateIndex
CREATE INDEX "ContentPerformanceEvent_tenantId_occurredAt_idx" ON "ContentPerformanceEvent"("tenantId", "occurredAt");

-- CreateIndex
CREATE INDEX "ContentReusableBlock_tenantId_idx" ON "ContentReusableBlock"("tenantId");

-- CreateIndex
CREATE INDEX "ContentReusableBlock_tenantId_sectionType_idx" ON "ContentReusableBlock"("tenantId", "sectionType");

-- CreateIndex
CREATE INDEX "ContentReusableBlock_tenantId_updatedAt_idx" ON "ContentReusableBlock"("tenantId", "updatedAt");

-- CreateIndex
CREATE INDEX "SalesPlaybookRun_tenantId_idx" ON "SalesPlaybookRun"("tenantId");

-- CreateIndex
CREATE INDEX "SalesPlaybookRun_tenantId_dealId_idx" ON "SalesPlaybookRun"("tenantId", "dealId");

-- CreateIndex
CREATE INDEX "SalesPlaybookRun_tenantId_status_idx" ON "SalesPlaybookRun"("tenantId", "status");

-- CreateIndex
CREATE INDEX "SalesPlaybookRun_tenantId_startedAt_idx" ON "SalesPlaybookRun"("tenantId", "startedAt");

-- AddForeignKey
ALTER TABLE "ContentPerformanceEvent" ADD CONSTRAINT "ContentPerformanceEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentReusableBlock" ADD CONSTRAINT "ContentReusableBlock_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesPlaybookRun" ADD CONSTRAINT "SalesPlaybookRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
