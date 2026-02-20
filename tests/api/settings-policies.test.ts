import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { checkPermission, getTenantId } from "@/lib/auth-helpers";
import { GET as getPolicies, PUT as putPolicies } from "@/app/api/settings/policies/route";
import { resetTenantPolicyStoreForTests } from "@/lib/tenant-policy-store";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);
const mockCheckPermission = vi.mocked(checkPermission);
const TENANT_ID = "tenant-settings-policy";

beforeEach(async () => {
  vi.clearAllMocks();
  await resetTenantPolicyStoreForTests();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
  mockCheckPermission.mockResolvedValue(true);
});

describe("settings policies API", () => {
  it("returns current tenant policy", async () => {
    const response = await getPolicies(createMockRequest("/api/settings/policies"));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data.tenantSlug).toBe("f-core");
    expect(body.data.session.maxSessionMinutes).toBe(480);
  });

  it("returns default policy when tenant policy table is missing", async () => {
    mockPrisma.tenantPolicy.findFirst.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("Missing table", {
        code: "P2021",
        clientVersion: "test",
      })
    );

    const response = await getPolicies(createMockRequest("/api/settings/policies"));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data.tenantSlug).toBe("f-core");
  });

  it("updates tenant policy", async () => {
    const response = await putPolicies(
      createMockRequest("/api/settings/policies", {
        method: "PUT",
        body: {
          tenantSlug: "acme",
          session: {
            maxSessionMinutes: 180,
            idleTimeoutMinutes: 25,
            rememberMeAllowed: false,
          },
          password: {
            minLength: 14,
            requireUppercase: true,
            requireNumber: true,
            requireSpecialChar: true,
          },
          ipAllowlist: {
            enabled: true,
            entries: ["203.0.113.50", "10.10.0.0/16"],
          },
        },
      })
    );
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data.tenantSlug).toBe("acme");
    expect(body.data.password.minLength).toBe(14);
    expect(body.data.ipAllowlist.enabled).toBe(true);
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "updated",
          entity: "tenant_policy",
        }),
      })
    );
  });

  it("returns payload when tenant policy table is missing during update", async () => {
    mockPrisma.tenantPolicy.findFirst.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("Missing table", {
        code: "P2021",
        clientVersion: "test",
      })
    );

    const response = await putPolicies(
      createMockRequest("/api/settings/policies", {
        method: "PUT",
        body: {
          tenantSlug: "acme",
          session: {
            maxSessionMinutes: 180,
            idleTimeoutMinutes: 25,
            rememberMeAllowed: false,
          },
          password: {
            minLength: 14,
            requireUppercase: true,
            requireNumber: true,
            requireSpecialChar: true,
          },
          ipAllowlist: {
            enabled: true,
            entries: ["203.0.113.50", "10.10.0.0/16"],
          },
        },
      })
    );
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data.tenantSlug).toBe("acme");
    expect(body.data.ipAllowlist.entries).toEqual(["203.0.113.50", "10.10.0.0/16"]);
  });

  it("returns 400 for invalid payload", async () => {
    const response = await putPolicies(
      createMockRequest("/api/settings/policies", {
        method: "PUT",
        body: {
          tenantSlug: "acme",
          session: {
            maxSessionMinutes: 10,
            idleTimeoutMinutes: 1,
            rememberMeAllowed: true,
          },
          password: {
            minLength: 5,
            requireUppercase: true,
            requireNumber: true,
            requireSpecialChar: true,
          },
          ipAllowlist: {
            enabled: true,
            entries: [],
          },
        },
      })
    );

    expect(response.status).toBe(400);
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));

    const response = await getPolicies(createMockRequest("/api/settings/policies"));
    expect(response.status).toBe(401);
  });

  it("returns 403 when missing permission", async () => {
    mockCheckPermission.mockRejectedValue(new Error("Forbidden: Missing permission settings.manage"));

    const response = await putPolicies(
      createMockRequest("/api/settings/policies", {
        method: "PUT",
        body: {
          tenantSlug: "f-core",
          session: {
            maxSessionMinutes: 480,
            idleTimeoutMinutes: 60,
            rememberMeAllowed: true,
          },
          password: {
            minLength: 8,
            requireUppercase: true,
            requireNumber: true,
            requireSpecialChar: false,
          },
          ipAllowlist: {
            enabled: false,
            entries: [],
          },
        },
      })
    );

    expect(response.status).toBe(403);
  });
});
