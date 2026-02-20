import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import { GET as discoverPolicy } from "@/app/api/auth/policy/discovery/route";
import { resetTenantPolicyStoreForTests, updateTenantPolicy } from "@/lib/tenant-policy-store";

const mockPrisma = vi.mocked(prisma);

beforeEach(async () => {
  vi.clearAllMocks();
  await resetTenantPolicyStoreForTests();
});

describe("auth policy discovery API", () => {
  it("returns null when workspace is missing", async () => {
    const response = await discoverPolicy(createMockRequest("/api/auth/policy/discovery"));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data).toBe(null);
  });

  it("returns null when workspace is unknown", async () => {
    const response = await discoverPolicy(createMockRequest("/api/auth/policy/discovery?workspace=missing"));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data).toBe(null);
  });

  it("returns default workspace policy", async () => {
    const response = await discoverPolicy(createMockRequest("/api/auth/policy/discovery?workspace=f-core"));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data.tenantSlug).toBe("f-core");
    expect(body.data.ipAllowlistEnabled).toBe(false);
    expect(body.data.ipAllowed).toBe(true);
  });

  it("returns fallback workspace policy when tenant policy table is missing", async () => {
    mockPrisma.tenantPolicy.findFirst.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("Missing table", {
        code: "P2021",
        clientVersion: "test",
      })
    );

    const response = await discoverPolicy(createMockRequest("/api/auth/policy/discovery?workspace=f-core"));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data.tenantSlug).toBe("f-core");
    expect(body.data.ipAllowed).toBe(true);
  });

  it("evaluates allowlist from forwarded client IP", async () => {
    await updateTenantPolicy("tenant-acme", {
      tenantSlug: "acme",
      session: {
        maxSessionMinutes: 240,
        idleTimeoutMinutes: 30,
        rememberMeAllowed: false,
      },
      password: {
        minLength: 12,
        requireUppercase: true,
        requireNumber: true,
        requireSpecialChar: false,
      },
      ipAllowlist: {
        enabled: true,
        entries: ["203.0.113.5", "10.10.0.0/16"],
      },
    });

    const denied = await discoverPolicy(
      createMockRequest("/api/auth/policy/discovery?workspace=acme", {
        headers: { "x-forwarded-for": "198.51.100.2" },
      })
    );
    const deniedBody = await getResponseBody(denied);

    expect(denied.status).toBe(200);
    expect(deniedBody.data.ipAllowlistEnabled).toBe(true);
    expect(deniedBody.data.ipAllowed).toBe(false);

    const allowed = await discoverPolicy(
      createMockRequest("/api/auth/policy/discovery?workspace=acme", {
        headers: { "x-forwarded-for": "10.10.23.9" },
      })
    );
    const allowedBody = await getResponseBody(allowed);

    expect(allowed.status).toBe(200);
    expect(allowedBody.data.ipAllowed).toBe(true);
  });
});
