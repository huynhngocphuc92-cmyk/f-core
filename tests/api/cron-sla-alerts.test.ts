import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { POST as runCronSlaAlerts } from "@/app/api/cron/sla-alerts/route";
import { resetSlaPolicyStoreForTests } from "@/lib/sla-policy-store";
import { NextRequest } from "next/server";

const mockPrisma = vi.mocked(prisma);

beforeEach(async () => {
  vi.clearAllMocks();
  await resetSlaPolicyStoreForTests();
  process.env.SLA_ALERTS_CRON_SECRET = "test-cron-secret";
});

describe("POST /api/cron/sla-alerts", () => {
  it("returns 401 when secret is missing", async () => {
    const response = await runCronSlaAlerts(
      createMockRequest("/api/cron/sla-alerts", { method: "POST" })
    );

    expect(response.status).toBe(401);
  });

  it("runs a single tenant when tenantId is provided", async () => {
    mockPrisma.ticket.findMany.mockResolvedValue([] as any);
    mockPrisma.user.findMany.mockResolvedValue([] as any);

    const request = new NextRequest(
      "http://localhost:3000/api/cron/sla-alerts?tenantId=tenant-1&dryRun=true",
      {
        method: "POST",
        headers: { authorization: "Bearer test-cron-secret" },
      }
    );
    const response = await runCronSlaAlerts(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.summary.tenants).toBe(1);
    expect(body.dryRun).toBe(true);
    expect(mockPrisma.tenant.findMany).not.toHaveBeenCalled();
  });

  it("runs all tenants with x-cron-key", async () => {
    mockPrisma.tenant.findMany.mockResolvedValue([
      { id: "tenant-1" },
      { id: "tenant-2" },
    ] as any);
    mockPrisma.ticket.findMany.mockResolvedValue([] as any);
    mockPrisma.user.findMany.mockResolvedValue([] as any);

    const request = new NextRequest("http://localhost:3000/api/cron/sla-alerts", {
      method: "POST",
      headers: { "x-cron-key": "test-cron-secret" },
    });
    const response = await runCronSlaAlerts(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.summary.tenants).toBe(2);
    expect(body.results).toHaveLength(2);
  });
});
