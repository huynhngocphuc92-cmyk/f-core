import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";
import { GET as getMarketingJourney } from "@/app/api/marketing/journey/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);
const TENANT_ID = "tenant-test-id";

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
});

describe("marketing journey API", () => {
  it("returns customer journey timeline report", async () => {
    mockPrisma.deal.findMany.mockResolvedValue([
      {
        id: "deal-1",
        amount: 240,
        closedAt: new Date("2026-02-14T10:00:00.000Z"),
        updatedAt: new Date("2026-02-14T10:00:00.000Z"),
        contacts: [{ contactId: "contact-1" }],
        companies: [],
      },
    ] as any);

    mockPrisma.activity.findMany.mockResolvedValue([
      {
        dealId: null,
        contactId: "contact-1",
        companyId: null,
        type: "email",
        metadata: { channel: "google_ads" },
        createdAt: new Date("2026-02-14T08:00:00.000Z"),
      },
      {
        dealId: "deal-1",
        contactId: null,
        companyId: null,
        type: "email",
        metadata: { channel: "email" },
        createdAt: new Date("2026-02-14T09:00:00.000Z"),
      },
    ] as any);

    const response = await getMarketingJourney(createMockRequest("/api/marketing/journey"));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.totals.journeys).toBe(1);
    expect(body.topPaths[0].path).toBe("paid_search -> email");
    expect(body.journeys[0].conversionId).toBe("deal-1");
  });

  it("applies days and limit bounds", async () => {
    mockPrisma.deal.findMany.mockResolvedValue([] as any);
    mockPrisma.activity.findMany.mockResolvedValue([] as any);

    const response = await getMarketingJourney(
      createMockRequest("/api/marketing/journey", {
        searchParams: { days: "3", limit: "2" },
      })
    );
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.days).toBe(7);
    expect(body.limit).toBe(5);
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));

    const response = await getMarketingJourney(createMockRequest("/api/marketing/journey"));
    expect(response.status).toBe(401);
  });
});
