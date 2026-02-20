-- CreateTable
CREATE TABLE "ServiceOmnichannelThread" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "externalThreadId" TEXT,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT,
    "assigneeId" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "messagePreview" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "lastMessageAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceOmnichannelThread_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServiceOmnichannelThread_tenantId_idx" ON "ServiceOmnichannelThread"("tenantId");

-- CreateIndex
CREATE INDEX "ServiceOmnichannelThread_tenantId_channel_status_idx" ON "ServiceOmnichannelThread"("tenantId", "channel", "status");

-- CreateIndex
CREATE INDEX "ServiceOmnichannelThread_tenantId_updatedAt_idx" ON "ServiceOmnichannelThread"("tenantId", "updatedAt");

-- AddForeignKey
ALTER TABLE "ServiceOmnichannelThread" ADD CONSTRAINT "ServiceOmnichannelThread_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
