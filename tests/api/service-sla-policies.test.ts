import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getTenantId } from "@/lib/auth-helpers";
import {
  GET as getPolicies,
  PUT as putPolicies,
} from "@/app/api/service/sla/policies/route";
import { resetSlaPolicyStoreForTests } from "@/lib/sla-policy-store";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);
const TENANT_ID = "tenant-test-id";

beforeEach(async () => {
  vi.clearAllMocks();
  await resetSlaPolicyStoreForTests();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
});

describe("SLA policy API", () => {
  it("returns default policy when none configured", async () => {
    const response = await getPolicies(createMockRequest("/api/service/sla/policies"));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.policy.medium.resolutionHours).toBe(24);
  });

  it("returns default policy when SLA table is missing", async () => {
    mockPrisma.serviceSlaPolicyConfig.findFirst.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("Missing table", {
        code: "P2021",
        clientVersion: "test",
      })
    );

    const response = await getPolicies(createMockRequest("/api/service/sla/policies"));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.policy.urgent.firstResponseMinutes).toBe(15);
  });

  it("updates and returns tenant policy", async () => {
    const response = await putPolicies(
      createMockRequest("/api/service/sla/policies", {
        method: "PUT",
        body: {
          policy: {
            low: { firstResponseMinutes: 120, resolutionHours: 48 },
            medium: { firstResponseMinutes: 60, resolutionHours: 12 },
            high: { firstResponseMinutes: 30, resolutionHours: 4 },
            urgent: { firstResponseMinutes: 10, resolutionHours: 2 },
          },
        },
      })
    );
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.policy.high.resolutionHours).toBe(4);
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "updated",
          entity: "sla_policy",
          entityId: TENANT_ID,
        }),
      })
    );
  });

  it("gracefully returns payload when SLA table is missing during update", async () => {
    mockPrisma.serviceSlaPolicyConfig.findFirst.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("Missing table", {
        code: "P2021",
        clientVersion: "test",
      })
    );

    const response = await putPolicies(
      createMockRequest("/api/service/sla/policies", {
        method: "PUT",
        body: {
          policy: {
            low: { firstResponseMinutes: 120, resolutionHours: 48 },
            medium: { firstResponseMinutes: 60, resolutionHours: 12 },
            high: { firstResponseMinutes: 30, resolutionHours: 4 },
            urgent: { firstResponseMinutes: 10, resolutionHours: 2 },
          },
        },
      })
    );
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.policy.medium.firstResponseMinutes).toBe(60);
  });

  it("returns 400 on invalid payload", async () => {
    const response = await putPolicies(
      createMockRequest("/api/service/sla/policies", {
        method: "PUT",
        body: {
          policy: {
            low: { firstResponseMinutes: 0, resolutionHours: 48 },
            medium: { firstResponseMinutes: 60, resolutionHours: 12 },
            high: { firstResponseMinutes: 30, resolutionHours: 4 },
            urgent: { firstResponseMinutes: 10, resolutionHours: 2 },
          },
        },
      })
    );

    expect(response.status).toBe(400);
  });
});
