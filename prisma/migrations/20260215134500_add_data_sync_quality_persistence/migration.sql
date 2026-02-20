-- CreateTable
CREATE TABLE "DataSyncMapping" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "integration" TEXT NOT NULL,
    "objectType" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "conflictResolution" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "fieldMappings" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataSyncMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataSyncJob" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "mappingId" TEXT NOT NULL,
    "integration" TEXT NOT NULL,
    "objectType" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "dryRun" BOOLEAN NOT NULL DEFAULT true,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "retriedFromJobId" TEXT,
    "processed" INTEGER NOT NULL DEFAULT 0,
    "imported" INTEGER NOT NULL DEFAULT 0,
    "exported" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "conflicts" INTEGER NOT NULL DEFAULT 0,
    "conflictItems" JSONB NOT NULL DEFAULT '[]',
    "diagnostics" JSONB NOT NULL DEFAULT '[]',
    "traces" JSONB NOT NULL DEFAULT '[]',
    "lineage" JSONB NOT NULL DEFAULT '[]',
    "sourceRecords" JSONB NOT NULL DEFAULT '[]',
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataSyncJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataQualityRule" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "objectType" TEXT NOT NULL,
    "requireEmail" BOOLEAN NOT NULL DEFAULT false,
    "requirePhone" BOOLEAN NOT NULL DEFAULT false,
    "requireDomain" BOOLEAN NOT NULL DEFAULT false,
    "minNameLength" INTEGER NOT NULL DEFAULT 2,
    "autoMergeExactKey" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataQualityRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataQualityMergeAudit" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "objectType" TEXT NOT NULL,
    "primaryId" TEXT NOT NULL,
    "duplicateId" TEXT NOT NULL,
    "mergedBy" TEXT NOT NULL,
    "dryRun" BOOLEAN NOT NULL DEFAULT true,
    "fieldsMerged" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataQualityMergeAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DataSyncMapping_tenantId_integration_objectType_key" ON "DataSyncMapping"("tenantId", "integration", "objectType");

-- CreateIndex
CREATE INDEX "DataSyncMapping_tenantId_idx" ON "DataSyncMapping"("tenantId");

-- CreateIndex
CREATE INDEX "DataSyncMapping_tenantId_integration_idx" ON "DataSyncMapping"("tenantId", "integration");

-- CreateIndex
CREATE INDEX "DataSyncMapping_tenantId_objectType_idx" ON "DataSyncMapping"("tenantId", "objectType");

-- CreateIndex
CREATE INDEX "DataSyncJob_tenantId_idx" ON "DataSyncJob"("tenantId");

-- CreateIndex
CREATE INDEX "DataSyncJob_tenantId_mappingId_idx" ON "DataSyncJob"("tenantId", "mappingId");

-- CreateIndex
CREATE INDEX "DataSyncJob_tenantId_status_idx" ON "DataSyncJob"("tenantId", "status");

-- CreateIndex
CREATE INDEX "DataSyncJob_tenantId_startedAt_idx" ON "DataSyncJob"("tenantId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DataQualityRule_tenantId_objectType_key" ON "DataQualityRule"("tenantId", "objectType");

-- CreateIndex
CREATE INDEX "DataQualityRule_tenantId_idx" ON "DataQualityRule"("tenantId");

-- CreateIndex
CREATE INDEX "DataQualityMergeAudit_tenantId_idx" ON "DataQualityMergeAudit"("tenantId");

-- CreateIndex
CREATE INDEX "DataQualityMergeAudit_tenantId_objectType_idx" ON "DataQualityMergeAudit"("tenantId", "objectType");

-- CreateIndex
CREATE INDEX "DataQualityMergeAudit_tenantId_createdAt_idx" ON "DataQualityMergeAudit"("tenantId", "createdAt");

-- AddForeignKey
ALTER TABLE "DataSyncMapping" ADD CONSTRAINT "DataSyncMapping_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataSyncJob" ADD CONSTRAINT "DataSyncJob_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataQualityRule" ADD CONSTRAINT "DataQualityRule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataQualityMergeAudit" ADD CONSTRAINT "DataQualityMergeAudit_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
