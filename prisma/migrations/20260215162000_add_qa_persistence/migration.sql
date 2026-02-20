-- CreateTable
CREATE TABLE "ApiPerformanceBudget" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "maxP95LatencyMs" INTEGER NOT NULL,
    "maxErrorRatePct" DOUBLE PRECISION NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiPerformanceBudget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiPerformanceEvaluation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "checkedEndpoints" INTEGER NOT NULL,
    "breachedEndpoints" INTEGER NOT NULL,
    "passRatePct" DOUBLE PRECISION NOT NULL,
    "alerts" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiPerformanceEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FrontendRouteThreshold" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "maxLcpMs" INTEGER NOT NULL,
    "maxInpMs" INTEGER NOT NULL,
    "maxCls" DOUBLE PRECISION NOT NULL,
    "maxJsKb" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FrontendRouteThreshold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FrontendPerformanceEvaluation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "checkedRoutes" INTEGER NOT NULL,
    "breachedRoutes" INTEGER NOT NULL,
    "passRatePct" DOUBLE PRECISION NOT NULL,
    "alerts" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FrontendPerformanceEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReleaseChecklistGate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "gateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "command" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReleaseChecklistGate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReleaseReadinessResult" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "releaseTag" TEXT,
    "branch" TEXT,
    "actor" TEXT,
    "status" TEXT NOT NULL,
    "requiredGateCount" INTEGER NOT NULL,
    "requiredPassCount" INTEGER NOT NULL,
    "requiredFailCount" INTEGER NOT NULL,
    "scorePct" INTEGER NOT NULL,
    "gates" JSONB NOT NULL DEFAULT '[]',
    "blockers" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReleaseReadinessResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApiPerformanceBudget_tenantId_endpoint_key" ON "ApiPerformanceBudget"("tenantId", "endpoint");

-- CreateIndex
CREATE INDEX "ApiPerformanceBudget_tenantId_idx" ON "ApiPerformanceBudget"("tenantId");

-- CreateIndex
CREATE INDEX "ApiPerformanceBudget_tenantId_endpoint_idx" ON "ApiPerformanceBudget"("tenantId", "endpoint");

-- CreateIndex
CREATE INDEX "ApiPerformanceEvaluation_tenantId_idx" ON "ApiPerformanceEvaluation"("tenantId");

-- CreateIndex
CREATE INDEX "ApiPerformanceEvaluation_tenantId_createdAt_idx" ON "ApiPerformanceEvaluation"("tenantId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FrontendRouteThreshold_tenantId_route_key" ON "FrontendRouteThreshold"("tenantId", "route");

-- CreateIndex
CREATE INDEX "FrontendRouteThreshold_tenantId_idx" ON "FrontendRouteThreshold"("tenantId");

-- CreateIndex
CREATE INDEX "FrontendRouteThreshold_tenantId_route_idx" ON "FrontendRouteThreshold"("tenantId", "route");

-- CreateIndex
CREATE INDEX "FrontendPerformanceEvaluation_tenantId_idx" ON "FrontendPerformanceEvaluation"("tenantId");

-- CreateIndex
CREATE INDEX "FrontendPerformanceEvaluation_tenantId_createdAt_idx" ON "FrontendPerformanceEvaluation"("tenantId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReleaseChecklistGate_tenantId_gateId_key" ON "ReleaseChecklistGate"("tenantId", "gateId");

-- CreateIndex
CREATE INDEX "ReleaseChecklistGate_tenantId_idx" ON "ReleaseChecklistGate"("tenantId");

-- CreateIndex
CREATE INDEX "ReleaseReadinessResult_tenantId_idx" ON "ReleaseReadinessResult"("tenantId");

-- CreateIndex
CREATE INDEX "ReleaseReadinessResult_tenantId_createdAt_idx" ON "ReleaseReadinessResult"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "ReleaseReadinessResult_tenantId_status_idx" ON "ReleaseReadinessResult"("tenantId", "status");

-- AddForeignKey
ALTER TABLE "ApiPerformanceBudget" ADD CONSTRAINT "ApiPerformanceBudget_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiPerformanceEvaluation" ADD CONSTRAINT "ApiPerformanceEvaluation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FrontendRouteThreshold" ADD CONSTRAINT "FrontendRouteThreshold_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FrontendPerformanceEvaluation" ADD CONSTRAINT "FrontendPerformanceEvaluation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReleaseChecklistGate" ADD CONSTRAINT "ReleaseChecklistGate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReleaseReadinessResult" ADD CONSTRAINT "ReleaseReadinessResult_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
