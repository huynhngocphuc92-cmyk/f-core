import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { issueCustomerPortalToken } from "@/lib/customer-portal-token";
import { POST as respondSurvey } from "@/app/api/service/surveys/respond/route";

const mockPrisma = vi.mocked(prisma);
const TENANT_ID = "tenant-test-id";
const CONTACT_ID = "contact-1";
const CONTACT_EMAIL = "contact@example.com";

function createPortalToken() {
  return issueCustomerPortalToken({
    tenantId: TENANT_ID,
    contactId: CONTACT_ID,
    email: CONTACT_EMAIL,
    expiresInMinutes: 60,
  }).token;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.contact.findFirst.mockResolvedValue({
    id: CONTACT_ID,
    tenantId: TENANT_ID,
    email: CONTACT_EMAIL,
  } as any);
});

describe("service survey respond API", () => {
  it("creates survey response for scoped contact ticket", async () => {
    const token = createPortalToken();
    mockPrisma.ticket.findFirst.mockResolvedValue({ id: "ticket-1", status: "resolved" } as any);
    mockPrisma.activity.findMany.mockResolvedValue([] as any);
    mockPrisma.activity.create.mockResolvedValue({ id: "reply-1" } as any);

    const response = await respondSurvey(
      createMockRequest("/api/service/surveys/respond", {
        method: "POST",
        searchParams: { token },
        body: {
          ticketId: "ticket-1",
          csatScore: 5,
          npsScore: 8,
          feedback: "Great support",
        },
      })
    );

    expect(response.status).toBe(201);
    expect(mockPrisma.activity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          contactId: CONTACT_ID,
          metadata: expect.objectContaining({
            source: "service_survey",
            status: "responded",
            ticketId: "ticket-1",
            csatScore: 5,
          }),
        }),
      })
    );
  });

  it("returns 409 if response already exists for ticket", async () => {
    const token = createPortalToken();
    mockPrisma.ticket.findFirst.mockResolvedValue({ id: "ticket-1", status: "resolved" } as any);
    mockPrisma.activity.findMany.mockResolvedValue([
      { metadata: { source: "service_survey", status: "responded", ticketId: "ticket-1" } },
    ] as any);

    const response = await respondSurvey(
      createMockRequest("/api/service/surveys/respond", {
        method: "POST",
        searchParams: { token },
        body: {
          ticketId: "ticket-1",
          csatScore: 4,
        },
      })
    );
    const body = await getResponseBody(response);

    expect(response.status).toBe(409);
    expect(body.error).toContain("Survey already submitted");
  });
});
