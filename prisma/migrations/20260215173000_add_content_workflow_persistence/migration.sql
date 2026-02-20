-- CreateTable
CREATE TABLE "ContentBlogPost" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "reviewerId" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentBlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentApprovalPolicy" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "space" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "requiredApprovals" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentApprovalPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentApprovalRequest" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "space" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "assetTitle" TEXT NOT NULL,
    "assetUpdatedAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "reviewerId" TEXT,
    "decisionNote" TEXT,
    "requestNote" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentRemixVariant" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceTitle" TEXT NOT NULL,
    "targetFormat" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentRemixVariant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentBlogPost_tenantId_idx" ON "ContentBlogPost"("tenantId");

-- CreateIndex
CREATE INDEX "ContentBlogPost_tenantId_status_idx" ON "ContentBlogPost"("tenantId", "status");

-- CreateIndex
CREATE INDEX "ContentBlogPost_tenantId_updatedAt_idx" ON "ContentBlogPost"("tenantId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ContentApprovalPolicy_tenantId_space_key" ON "ContentApprovalPolicy"("tenantId", "space");

-- CreateIndex
CREATE INDEX "ContentApprovalPolicy_tenantId_idx" ON "ContentApprovalPolicy"("tenantId");

-- CreateIndex
CREATE INDEX "ContentApprovalRequest_tenantId_idx" ON "ContentApprovalRequest"("tenantId");

-- CreateIndex
CREATE INDEX "ContentApprovalRequest_tenantId_space_status_idx" ON "ContentApprovalRequest"("tenantId", "space", "status");

-- CreateIndex
CREATE INDEX "ContentApprovalRequest_tenantId_space_assetId_idx" ON "ContentApprovalRequest"("tenantId", "space", "assetId");

-- CreateIndex
CREATE INDEX "ContentApprovalRequest_tenantId_updatedAt_idx" ON "ContentApprovalRequest"("tenantId", "updatedAt");

-- CreateIndex
CREATE INDEX "ContentRemixVariant_tenantId_idx" ON "ContentRemixVariant"("tenantId");

-- CreateIndex
CREATE INDEX "ContentRemixVariant_tenantId_sourceType_sourceId_idx" ON "ContentRemixVariant"("tenantId", "sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "ContentRemixVariant_tenantId_targetFormat_idx" ON "ContentRemixVariant"("tenantId", "targetFormat");

-- CreateIndex
CREATE INDEX "ContentRemixVariant_tenantId_createdAt_idx" ON "ContentRemixVariant"("tenantId", "createdAt");

-- AddForeignKey
ALTER TABLE "ContentBlogPost" ADD CONSTRAINT "ContentBlogPost_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentApprovalPolicy" ADD CONSTRAINT "ContentApprovalPolicy_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentApprovalRequest" ADD CONSTRAINT "ContentApprovalRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentRemixVariant" ADD CONSTRAINT "ContentRemixVariant_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
