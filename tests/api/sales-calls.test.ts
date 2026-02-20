import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";
import { GET as getSalesCalls, POST as postSalesCall } from "@/app/api/sales/calls/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);
const TENANT_ID = "tenant-test-id";

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
});

describe("sales calls API", () => {
  it("returns call transcript intelligence data", async () => {
    mockPrisma.activity.findMany.mockResolvedValue([
      {
        id: "call-1",
        subject: "Discovery Call",
        body: "...",
        callDuration: 1200,
        dealId: "deal-1",
        contactId: "contact-1",
        companyId: "company-1",
        createdAt: new Date("2026-02-14T00:00:00.000Z"),
        metadata: {
          salesCallIntelligence: true,
          transcript: "Long transcript",
          highlights: ["Point A"],
          riskSignals: ["Budget concern mentioned"],
          sentimentScore: 0.1,
          recordingUrl: "https://example.com/rec",
        },
      },
    ] as any);

    const response = await getSalesCalls(createMockRequest("/api/sales/calls"));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.summary.totalCalls).toBe(1);
  });

  it("records a new call transcript", async () => {
    mockPrisma.activity.create.mockResolvedValue({
      id: "call-2",
      subject: "Recorded Call",
      createdAt: new Date("2026-02-14T00:00:00.000Z"),
      metadata: { salesCallIntelligence: true },
    } as any);

    const response = await postSalesCall(
      createMockRequest("/api/sales/calls", {
        method: "POST",
        body: {
          subject: "Recorded Call",
          recordingUrl: "https://example.com/rec-2",
          transcript:
            "We discussed budget and security review timeline, then agreed to follow-up with legal procurement and technical stakeholders.",
          durationSeconds: 1500,
          sentimentScore: 0.25,
        },
      })
    );

    expect(response.status).toBe(201);
    expect(mockPrisma.activity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "call",
          metadata: expect.objectContaining({
            salesCallIntelligence: true,
            recordingUrl: "https://example.com/rec-2",
          }),
        }),
      })
    );
  });

  it("returns 401 when not authenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));

    const response = await getSalesCalls(createMockRequest("/api/sales/calls"));
    expect(response.status).toBe(401);
  });
});
