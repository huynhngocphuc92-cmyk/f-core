-- CreateTable
CREATE TABLE "CommerceInvoice" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "quoteId" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "notes" TEXT,
    "issuedAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "voidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommerceInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommerceSubscription" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "subscriptionNumber" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "cycle" TEXT NOT NULL DEFAULT 'monthly',
    "status" TEXT NOT NULL DEFAULT 'active',
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "cancellationReason" TEXT,
    "canceledAt" TIMESTAMP(3),
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "nextBillingAt" TIMESTAMP(3),
    "renewalCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommerceSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommerceInvoice_tenantId_invoiceNumber_key" ON "CommerceInvoice"("tenantId", "invoiceNumber");

-- CreateIndex
CREATE INDEX "CommerceInvoice_tenantId_idx" ON "CommerceInvoice"("tenantId");

-- CreateIndex
CREATE INDEX "CommerceInvoice_tenantId_status_idx" ON "CommerceInvoice"("tenantId", "status");

-- CreateIndex
CREATE INDEX "CommerceInvoice_quoteId_idx" ON "CommerceInvoice"("quoteId");

-- CreateIndex
CREATE UNIQUE INDEX "CommerceSubscription_tenantId_subscriptionNumber_key" ON "CommerceSubscription"("tenantId", "subscriptionNumber");

-- CreateIndex
CREATE INDEX "CommerceSubscription_tenantId_idx" ON "CommerceSubscription"("tenantId");

-- CreateIndex
CREATE INDEX "CommerceSubscription_tenantId_status_idx" ON "CommerceSubscription"("tenantId", "status");

-- AddForeignKey
ALTER TABLE "CommerceInvoice" ADD CONSTRAINT "CommerceInvoice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommerceInvoice" ADD CONSTRAINT "CommerceInvoice_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommerceSubscription" ADD CONSTRAINT "CommerceSubscription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
