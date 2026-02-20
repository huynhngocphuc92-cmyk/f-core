import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";
import { GET as getServiceAnalytics } from "@/app/api/service/analytics/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);
const TENANT_ID = "tenant-test-id";

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
});

describe("service analytics API", () => {
  it("returns service analytics payload", async () => {
    mockPrisma.ticket.findMany.mockResolvedValue([
      {
        id: "ticket-1",
        status: "resolved",
        priority: "high",
        source: "email",
        category: "support",
        createdAt: new Date("2026-02-14T08:00:00.000Z"),
        firstResponseAt: new Date("2026-02-14T08:10:00.000Z"),
        resolvedAt: new Date("2026-02-14T10:00:00.000Z"),
        assignee: { id: "user-1", name: "Agent One" },
      },
    ] as any);

    mockPrisma.activity.findMany.mockResolvedValue([
      {
        contactId: "contact-1",
        body: null,
        metadata: { source: "service_survey", status: "sent", ticketId: "ticket-1" },
        createdAt: new Date("2026-02-14T11:00:00.000Z"),
      },
      {
        contactId: "contact-1",
        body: "Awesome help",
        metadata: {
          source: "service_survey",
          status: "responded",
          ticketId: "ticket-1",
          csatScore: 5,
          npsScore: 9,
        },
        createdAt: new Date("2026-02-14T11:30:00.000Z"),
      },
    ] as any);

    const response = await getServiceAnalytics(createMockRequest("/api/service/analytics?days=30"));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.windowDays).toBe(30);
    expect(body.summary.totalTickets).toBe(1);
    expect(body.summary.resolutionRatePct).toBe(100);
    expect(body.byChannel[0].channel).toBe("email");
    expect(body.surveys.csatAverage).toBe(5);
  });

  it("returns 401 when not authenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));

    const response = await getServiceAnalytics(createMockRequest("/api/service/analytics"));
    expect(response.status).toBe(401);
  });
});
