-- CreateTable
CREATE TABLE "ServiceSlaPolicyConfig" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "policy" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceSlaPolicyConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceRoutingPolicyConfig" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "policy" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceRoutingPolicyConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServiceSlaPolicyConfig_tenantId_key" ON "ServiceSlaPolicyConfig"("tenantId");

-- CreateIndex
CREATE INDEX "ServiceSlaPolicyConfig_tenantId_idx" ON "ServiceSlaPolicyConfig"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceRoutingPolicyConfig_tenantId_key" ON "ServiceRoutingPolicyConfig"("tenantId");

-- CreateIndex
CREATE INDEX "ServiceRoutingPolicyConfig_tenantId_idx" ON "ServiceRoutingPolicyConfig"("tenantId");

-- AddForeignKey
ALTER TABLE "ServiceSlaPolicyConfig" ADD CONSTRAINT "ServiceSlaPolicyConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRoutingPolicyConfig" ADD CONSTRAINT "ServiceRoutingPolicyConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
