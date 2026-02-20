-- CreateTable
CREATE TABLE "CommerceDunningConfig" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "retryDelaysHours" JSONB NOT NULL DEFAULT '[]',
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "cancelAfterMaxRetries" BOOLEAN NOT NULL DEFAULT true,
    "notifyChannels" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommerceDunningConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommerceDunningCase" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "invoiceId" TEXT,
    "customerName" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'open',
    "attemptCount" INTEGER NOT NULL DEFAULT 1,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "nextRetryAt" TIMESTAMP(3),
    "lastAttemptAt" TIMESTAMP(3),
    "history" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommerceDunningCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommercePaymentProviderConfig" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "mode" TEXT NOT NULL DEFAULT 'test',
    "credentials" JSONB NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 1,
    "rotatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommercePaymentProviderConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingAdsConnector" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "connectorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "connected" BOOLEAN NOT NULL DEFAULT false,
    "accountId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'disconnected',
    "dailyBudget" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "syncWindowDays" INTEGER NOT NULL DEFAULT 30,
    "note" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingAdsConnector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingAdsCampaign" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "connectorId" TEXT NOT NULL,
    "externalCampaignId" TEXT NOT NULL,
    "campaignName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "spend" DECIMAL(15,2) NOT NULL,
    "impressions" INTEGER NOT NULL,
    "clicks" INTEGER NOT NULL,
    "leads" INTEGER NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingAdsCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommerceDunningConfig_tenantId_key" ON "CommerceDunningConfig"("tenantId");

-- CreateIndex
CREATE INDEX "CommerceDunningConfig_tenantId_idx" ON "CommerceDunningConfig"("tenantId");

-- CreateIndex
CREATE INDEX "CommerceDunningCase_tenantId_idx" ON "CommerceDunningCase"("tenantId");

-- CreateIndex
CREATE INDEX "CommerceDunningCase_tenantId_status_idx" ON "CommerceDunningCase"("tenantId", "status");

-- CreateIndex
CREATE INDEX "CommerceDunningCase_subscriptionId_idx" ON "CommerceDunningCase"("subscriptionId");

-- CreateIndex
CREATE INDEX "CommerceDunningCase_invoiceId_idx" ON "CommerceDunningCase"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "CommercePaymentProviderConfig_tenantId_provider_key" ON "CommercePaymentProviderConfig"("tenantId", "provider");

-- CreateIndex
CREATE INDEX "CommercePaymentProviderConfig_tenantId_idx" ON "CommercePaymentProviderConfig"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketingAdsConnector_tenantId_connectorId_key" ON "MarketingAdsConnector"("tenantId", "connectorId");

-- CreateIndex
CREATE INDEX "MarketingAdsConnector_tenantId_idx" ON "MarketingAdsConnector"("tenantId");

-- CreateIndex
CREATE INDEX "MarketingAdsCampaign_tenantId_idx" ON "MarketingAdsCampaign"("tenantId");

-- CreateIndex
CREATE INDEX "MarketingAdsCampaign_tenantId_connectorId_idx" ON "MarketingAdsCampaign"("tenantId", "connectorId");

-- CreateIndex
CREATE INDEX "MarketingAdsCampaign_tenantId_syncedAt_idx" ON "MarketingAdsCampaign"("tenantId", "syncedAt");

-- AddForeignKey
ALTER TABLE "CommerceDunningConfig" ADD CONSTRAINT "CommerceDunningConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommerceDunningCase" ADD CONSTRAINT "CommerceDunningCase_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercePaymentProviderConfig" ADD CONSTRAINT "CommercePaymentProviderConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingAdsConnector" ADD CONSTRAINT "MarketingAdsConnector_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingAdsCampaign" ADD CONSTRAINT "MarketingAdsCampaign_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
