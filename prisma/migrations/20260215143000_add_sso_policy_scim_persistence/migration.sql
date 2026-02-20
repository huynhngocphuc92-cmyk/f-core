-- CreateTable
CREATE TABLE "SsoConfig" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tenantSlug" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "ssoOnly" BOOLEAN NOT NULL DEFAULT false,
    "provider" TEXT NOT NULL,
    "idpDisplayName" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "entryPointUrl" TEXT NOT NULL,
    "domains" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SsoConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantPolicy" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tenantSlug" TEXT NOT NULL,
    "session" JSONB NOT NULL DEFAULT '{}',
    "password" JSONB NOT NULL DEFAULT '{}',
    "ipAllowlistEnabled" BOOLEAN NOT NULL DEFAULT false,
    "ipAllowlistEntries" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScimUser" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "externalId" TEXT,
    "userName" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "displayName" TEXT NOT NULL,
    "givenName" TEXT,
    "familyName" TEXT,
    "emails" JSONB NOT NULL DEFAULT '[]',
    "roles" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScimUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SsoConfig_tenantId_key" ON "SsoConfig"("tenantId");

-- CreateIndex
CREATE INDEX "SsoConfig_tenantId_idx" ON "SsoConfig"("tenantId");

-- CreateIndex
CREATE INDEX "SsoConfig_tenantSlug_idx" ON "SsoConfig"("tenantSlug");

-- CreateIndex
CREATE UNIQUE INDEX "TenantPolicy_tenantId_key" ON "TenantPolicy"("tenantId");

-- CreateIndex
CREATE INDEX "TenantPolicy_tenantId_idx" ON "TenantPolicy"("tenantId");

-- CreateIndex
CREATE INDEX "TenantPolicy_tenantSlug_idx" ON "TenantPolicy"("tenantSlug");

-- CreateIndex
CREATE INDEX "ScimUser_tenantId_idx" ON "ScimUser"("tenantId");

-- CreateIndex
CREATE INDEX "ScimUser_tenantId_userName_idx" ON "ScimUser"("tenantId", "userName");

-- CreateIndex
CREATE INDEX "ScimUser_tenantId_externalId_idx" ON "ScimUser"("tenantId", "externalId");

-- AddForeignKey
ALTER TABLE "SsoConfig" ADD CONSTRAINT "SsoConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantPolicy" ADD CONSTRAINT "TenantPolicy_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScimUser" ADD CONSTRAINT "ScimUser_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
