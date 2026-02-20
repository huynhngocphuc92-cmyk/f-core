import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";
import { GET as getSurveys, POST as dispatchSurveys } from "@/app/api/service/surveys/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);
const TENANT_ID = "tenant-test-id";

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
});

describe("service surveys API", () => {
  it("returns summary and recent responses", async () => {
    mockPrisma.activity.findMany.mockResolvedValue([
      {
        id: "a1",
        contactId: "contact-1",
        body: null,
        metadata: { source: "service_survey", status: "sent", ticketId: "ticket-1" },
        createdAt: new Date("2026-02-14T10:00:00.000Z"),
      },
      {
        id: "a2",
        contactId: "contact-1",
        body: "Helpful",
        metadata: {
          source: "service_survey",
          status: "responded",
          ticketId: "ticket-1",
          csatScore: 5,
          npsScore: 9,
        },
        createdAt: new Date("2026-02-14T12:00:00.000Z"),
      },
    ] as any);

    mockPrisma.ticket.findMany.mockResolvedValue([
      { id: "ticket-1", subject: "Issue A", status: "resolved", priority: "high" },
    ] as any);

    const response = await getSurveys(createMockRequest("/api/service/surveys"));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.summary.sentCount).toBe(1);
    expect(body.summary.responseCount).toBe(1);
    expect(body.summary.csatAverage).toBe(5);
    expect(body.recentResponses).toHaveLength(1);
  });

  it("dispatches survey activities for resolved tickets without previous survey", async () => {
    mockPrisma.ticket.findMany.mockResolvedValue([
      {
        id: "ticket-1",
        tenantId: TENANT_ID,
        contactId: "contact-1",
        contact: { id: "contact-1", email: "contact@example.com" },
      },
    ] as any);
    mockPrisma.activity.findMany.mockResolvedValue([] as any);
    mockPrisma.activity.create.mockResolvedValue({ id: "activity-1" } as any);

    const response = await dispatchSurveys(createMockRequest("/api/service/surveys", { method: "POST" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.summary.created).toBe(1);
    expect(mockPrisma.activity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: TENANT_ID,
          contactId: "contact-1",
          metadata: expect.objectContaining({
            source: "service_survey",
            status: "sent",
            ticketId: "ticket-1",
          }),
        }),
      })
    );
  });
});
