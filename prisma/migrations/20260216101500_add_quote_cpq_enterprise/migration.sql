-- AlterTable
ALTER TABLE "Quote"
ADD COLUMN "approvalStatus" TEXT NOT NULL DEFAULT 'not_requested',
ADD COLUMN "approvalRequestedAt" TIMESTAMP(3),
ADD COLUMN "approvalDecidedAt" TIMESTAMP(3),
ADD COLUMN "approvalDecidedBy" TEXT,
ADD COLUMN "eSignStatus" TEXT NOT NULL DEFAULT 'not_sent',
ADD COLUMN "eSignSentAt" TIMESTAMP(3),
ADD COLUMN "eSignCompletedAt" TIMESTAMP(3),
ADD COLUMN "buyerLastActivityAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "QuoteApprovalRequest" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "requestedBy" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "decisionBy" TEXT,
    "decisionAt" TIMESTAMP(3),
    "note" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteBuyerActivity" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "actorType" TEXT NOT NULL DEFAULT 'buyer',
    "actorName" TEXT,
    "actorEmail" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteBuyerActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuoteApprovalRequest_tenantId_idx" ON "QuoteApprovalRequest"("tenantId");

-- CreateIndex
CREATE INDEX "QuoteApprovalRequest_quoteId_requestedAt_idx" ON "QuoteApprovalRequest"("quoteId", "requestedAt" DESC);

-- CreateIndex
CREATE INDEX "QuoteApprovalRequest_tenantId_quoteId_status_idx" ON "QuoteApprovalRequest"("tenantId", "quoteId", "status");

-- CreateIndex
CREATE INDEX "QuoteBuyerActivity_tenantId_idx" ON "QuoteBuyerActivity"("tenantId");

-- CreateIndex
CREATE INDEX "QuoteBuyerActivity_quoteId_occurredAt_idx" ON "QuoteBuyerActivity"("quoteId", "occurredAt" DESC);

-- CreateIndex
CREATE INDEX "QuoteBuyerActivity_tenantId_quoteId_type_idx" ON "QuoteBuyerActivity"("tenantId", "quoteId", "type");

-- AddForeignKey
ALTER TABLE "QuoteApprovalRequest" ADD CONSTRAINT "QuoteApprovalRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteApprovalRequest" ADD CONSTRAINT "QuoteApprovalRequest_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteBuyerActivity" ADD CONSTRAINT "QuoteBuyerActivity_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteBuyerActivity" ADD CONSTRAINT "QuoteBuyerActivity_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
