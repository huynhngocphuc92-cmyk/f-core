-- AlterTable
ALTER TABLE "CommercePaymentProviderConfig"
ADD COLUMN "lastVerificationStatus" TEXT,
ADD COLUMN "lastVerificationError" TEXT,
ADD COLUMN "lastVerifiedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "MarketingAdsConnector"
ADD COLUMN "authConfig" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN "lastSyncStatus" TEXT,
ADD COLUMN "lastSyncError" TEXT,
ADD COLUMN "lastSyncDurationMs" INTEGER,
ADD COLUMN "consecutiveSyncFailures" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "MarketingAdsCampaign_tenantId_connectorId_externalCampaignId_key"
ON "MarketingAdsCampaign"("tenantId", "connectorId", "externalCampaignId");
