import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";
import {
  GET as listDocumentEvents,
  POST as createDocumentEvent,
} from "@/app/api/sales/documents/events/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);
const TENANT_ID = "tenant-test-id";

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
});

describe("sales document events API", () => {
  it("returns document engagement events with summary", async () => {
    mockPrisma.activity.findMany.mockResolvedValue([
      {
        id: "ev-1",
        subject: "Document viewed",
        createdAt: new Date("2026-02-14T00:00:00.000Z"),
        metadata: {
          salesDocumentEvent: true,
          eventType: "view",
          quoteId: "quote-1",
          quoteTitle: "Q1 Renewal",
          source: "email",
        },
        dealId: "deal-1",
        contactId: "contact-1",
      },
    ] as any);

    const response = await listDocumentEvents(
      createMockRequest("/api/sales/documents/events", {
        searchParams: { quoteId: "quote-1" },
      })
    );
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.summary.view).toBe(1);
  });

  it("records a document event", async () => {
    mockPrisma.quote.findFirst.mockResolvedValue({
      id: "quote-1",
      title: "Q1 Renewal",
      dealId: "deal-1",
      contactId: "contact-1",
      companyId: "company-1",
    } as any);

    mockPrisma.activity.create.mockResolvedValue({
      id: "ev-2",
      subject: "Document signed",
      createdAt: new Date("2026-02-14T00:00:00.000Z"),
      metadata: {
        salesDocumentEvent: true,
        eventType: "signed",
      },
    } as any);

    const response = await createDocumentEvent(
      createMockRequest("/api/sales/documents/events", {
        method: "POST",
        body: {
          quoteId: "quote-1",
          eventType: "signed",
          source: "manual",
        },
      })
    );

    expect(response.status).toBe(201);
    expect(mockPrisma.activity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          dealId: "deal-1",
          metadata: expect.objectContaining({
            salesDocumentEvent: true,
            eventType: "signed",
            quoteId: "quote-1",
          }),
        }),
      })
    );
  });

  it("returns 404 when quote does not exist", async () => {
    mockPrisma.quote.findFirst.mockResolvedValue(null);

    const response = await createDocumentEvent(
      createMockRequest("/api/sales/documents/events", {
        method: "POST",
        body: {
          quoteId: "missing",
          eventType: "view",
        },
      })
    );

    expect(response.status).toBe(404);
  });

  it("returns 401 when not authenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));

    const response = await listDocumentEvents(createMockRequest("/api/sales/documents/events"));
    expect(response.status).toBe(401);
  });
});
