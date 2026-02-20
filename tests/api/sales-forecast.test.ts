import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";
import { GET as getSalesForecast } from "@/app/api/sales/forecast/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);
const TENANT_ID = "tenant-test-id";

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
});

describe("sales forecast API", () => {
  it("returns monthly forecast series by default", async () => {
    mockPrisma.deal.findMany.mockResolvedValue([
      {
        amount: 18000,
        probability: 50,
        closeDate: new Date("2026-03-20T00:00:00.000Z"),
        closedReason: null,
        closedAt: null,
        stage: { probability: 55 },
      },
    ] as any);

    const response = await getSalesForecast(createMockRequest("/api/sales/forecast"));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.summary).toBeDefined();
    expect(body.monthly).toHaveLength(6);
    expect(body.quarterly).toHaveLength(4);
  });

  it("returns selected series when period=quarter", async () => {
    mockPrisma.deal.findMany.mockResolvedValue([] as any);

    const response = await getSalesForecast(
      createMockRequest("/api/sales/forecast", {
        searchParams: { period: "quarter" },
      })
    );
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.period).toBe("quarter");
    expect(body.series).toHaveLength(4);
  });

  it("returns 401 when not authenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));

    const response = await getSalesForecast(createMockRequest("/api/sales/forecast"));
    expect(response.status).toBe(401);
  });
});
