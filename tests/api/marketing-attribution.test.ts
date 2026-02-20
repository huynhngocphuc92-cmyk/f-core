import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";
import { GET as getMarketingAttribution } from "@/app/api/marketing/attribution/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);
const TENANT_ID = "tenant-test-id";

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
});

describe("marketing attribution API", () => {
  it("returns first-touch attribution by default", async () => {
    mockPrisma.deal.findMany.mockResolvedValue([
      {
        id: "deal-1",
        amount: 300,
        closedAt: new Date("2026-02-14T10:00:00.000Z"),
        updatedAt: new Date("2026-02-14T10:00:00.000Z"),
        contacts: [{ contactId: "contact-1" }],
        companies: [{ companyId: "company-1" }],
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
      {
        dealId: "deal-1",
        contactId: null,
        companyId: null,
        type: "email",
        metadata: { channel: "email" },
        createdAt: new Date("2026-02-14T11:00:00.000Z"),
      },
    ] as any);

    const response = await getMarketingAttribution(createMockRequest("/api/marketing/attribution"));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.model).toBe("first_touch");
    expect(body.totals.attributedRevenue).toBe(300);
    expect(body.byChannel[0]).toMatchObject({
      channel: "paid_search",
      revenue: 300,
      conversions: 1,
      sharePct: 100,
    });
  });

  it("supports model and days query params", async () => {
    mockPrisma.deal.findMany.mockResolvedValue([
      {
        id: "deal-1",
        amount: 90,
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

    const response = await getMarketingAttribution(
      createMockRequest("/api/marketing/attribution", {
        searchParams: { model: "multi_touch", days: "5" },
      })
    );
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.model).toBe("multi_touch");
    expect(body.days).toBe(7);
    expect(body.byChannel).toHaveLength(2);
  });

  it("uses AND+OR filters for won and date constraints", async () => {
    mockPrisma.deal.findMany.mockResolvedValue([] as any);
    mockPrisma.activity.findMany.mockResolvedValue([] as any);

    const response = await getMarketingAttribution(createMockRequest("/api/marketing/attribution"));
    expect(response.status).toBe(200);

    expect(mockPrisma.deal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: TENANT_ID,
          deletedAt: null,
          AND: expect.arrayContaining([
            expect.objectContaining({ OR: expect.any(Array) }),
            expect.objectContaining({ OR: expect.any(Array) }),
          ]),
        }),
      })
    );
  });

  it("returns 400 for invalid model", async () => {
    const response = await getMarketingAttribution(
      createMockRequest("/api/marketing/attribution", {
        searchParams: { model: "invalid_model" },
      })
    );
    expect(response.status).toBe(400);
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));

    const response = await getMarketingAttribution(createMockRequest("/api/marketing/attribution"));
    expect(response.status).toBe(401);
  });
});
