-- CreateTable
CREATE TABLE "WorkflowVersionSnapshot" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowVersionSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowRuntimeRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "maxRetries" INTEGER NOT NULL,
    "versionId" TEXT,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "attempts" JSONB NOT NULL DEFAULT '[]',
    "retriesUsed" INTEGER NOT NULL DEFAULT 0,
    "deadLetterId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowRuntimeRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowRuntimeDeadLetter" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "attempts" INTEGER NOT NULL,
    "latestError" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowRuntimeDeadLetter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiPromptVersion" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "agent" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiPromptVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiOrchestrationMemory" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "intents" JSONB NOT NULL DEFAULT '[]',
    "facts" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiOrchestrationMemory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowVersionSnapshot_tenantId_workflowId_version_key" ON "WorkflowVersionSnapshot"("tenantId", "workflowId", "version");

-- CreateIndex
CREATE INDEX "WorkflowVersionSnapshot_tenantId_idx" ON "WorkflowVersionSnapshot"("tenantId");

-- CreateIndex
CREATE INDEX "WorkflowVersionSnapshot_tenantId_workflowId_idx" ON "WorkflowVersionSnapshot"("tenantId", "workflowId");

-- CreateIndex
CREATE INDEX "WorkflowRuntimeRun_tenantId_idx" ON "WorkflowRuntimeRun"("tenantId");

-- CreateIndex
CREATE INDEX "WorkflowRuntimeRun_tenantId_workflowId_idx" ON "WorkflowRuntimeRun"("tenantId", "workflowId");

-- CreateIndex
CREATE INDEX "WorkflowRuntimeRun_tenantId_status_idx" ON "WorkflowRuntimeRun"("tenantId", "status");

-- CreateIndex
CREATE INDEX "WorkflowRuntimeRun_tenantId_startedAt_idx" ON "WorkflowRuntimeRun"("tenantId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowRuntimeDeadLetter_tenantId_runId_key" ON "WorkflowRuntimeDeadLetter"("tenantId", "runId");

-- CreateIndex
CREATE INDEX "WorkflowRuntimeDeadLetter_tenantId_idx" ON "WorkflowRuntimeDeadLetter"("tenantId");

-- CreateIndex
CREATE INDEX "WorkflowRuntimeDeadLetter_tenantId_workflowId_idx" ON "WorkflowRuntimeDeadLetter"("tenantId", "workflowId");

-- CreateIndex
CREATE INDEX "WorkflowRuntimeDeadLetter_tenantId_resolvedAt_idx" ON "WorkflowRuntimeDeadLetter"("tenantId", "resolvedAt");

-- CreateIndex
CREATE INDEX "WorkflowRuntimeDeadLetter_tenantId_createdAt_idx" ON "WorkflowRuntimeDeadLetter"("tenantId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AiPromptVersion_tenantId_agent_version_key" ON "AiPromptVersion"("tenantId", "agent", "version");

-- CreateIndex
CREATE INDEX "AiPromptVersion_tenantId_idx" ON "AiPromptVersion"("tenantId");

-- CreateIndex
CREATE INDEX "AiPromptVersion_tenantId_agent_idx" ON "AiPromptVersion"("tenantId", "agent");

-- CreateIndex
CREATE INDEX "AiPromptVersion_tenantId_agent_isActive_idx" ON "AiPromptVersion"("tenantId", "agent", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "AiOrchestrationMemory_tenantId_conversationId_key" ON "AiOrchestrationMemory"("tenantId", "conversationId");

-- CreateIndex
CREATE INDEX "AiOrchestrationMemory_tenantId_idx" ON "AiOrchestrationMemory"("tenantId");

-- CreateIndex
CREATE INDEX "AiOrchestrationMemory_tenantId_updatedAt_idx" ON "AiOrchestrationMemory"("tenantId", "updatedAt");

-- AddForeignKey
ALTER TABLE "WorkflowVersionSnapshot" ADD CONSTRAINT "WorkflowVersionSnapshot_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowRuntimeRun" ADD CONSTRAINT "WorkflowRuntimeRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowRuntimeDeadLetter" ADD CONSTRAINT "WorkflowRuntimeDeadLetter_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiPromptVersion" ADD CONSTRAINT "AiPromptVersion_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiOrchestrationMemory" ADD CONSTRAINT "AiOrchestrationMemory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
