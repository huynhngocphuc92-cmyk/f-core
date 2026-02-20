import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { checkPermission, getTenantId } from "@/lib/auth-helpers";
import { GET as getSsoSettings, PUT as putSsoSettings } from "@/app/api/settings/sso/route";
import { resetSsoConfigStoreForTests } from "@/lib/sso-config-store";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);
const mockCheckPermission = vi.mocked(checkPermission);
const TENANT_ID = "tenant-settings-sso";

beforeEach(async () => {
  vi.clearAllMocks();
  await resetSsoConfigStoreForTests();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
  mockCheckPermission.mockResolvedValue(true);
});

describe("settings sso API", () => {
  it("returns current SSO configuration", async () => {
    const response = await getSsoSettings(createMockRequest("/api/settings/sso"));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data.provider).toBe("oidc");
  });

  it("updates SSO policy", async () => {
    const response = await putSsoSettings(
      createMockRequest("/api/settings/sso", {
        method: "PUT",
        body: {
          tenantSlug: "acme",
          enabled: true,
          ssoOnly: true,
          provider: "saml",
          idpDisplayName: "Acme Okta",
          connectionId: "saml-acme",
          entryPointUrl: "https://acme.example.com/saml",
          domains: ["acme.com"],
        },
      })
    );
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data.ssoOnly).toBe(true);
    expect(body.data.provider).toBe("saml");
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "updated",
          entity: "sso_policy",
        }),
      })
    );
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));

    const response = await getSsoSettings(createMockRequest("/api/settings/sso"));
    expect(response.status).toBe(401);
  });

  it("returns 403 when missing permission", async () => {
    mockCheckPermission.mockRejectedValue(new Error("Forbidden: Missing permission settings.manage"));
    const response = await putSsoSettings(
      createMockRequest("/api/settings/sso", {
        method: "PUT",
        body: {
          tenantSlug: "f-core",
          enabled: true,
          ssoOnly: false,
          provider: "oidc",
          idpDisplayName: "Okta Demo",
          connectionId: "oidc-f-core-demo",
          entryPointUrl: "https://idp.f-core-demo.example.com/oauth2/v1/authorize",
          domains: ["f-core.com"],
        },
      })
    );

    expect(response.status).toBe(403);
  });
});
