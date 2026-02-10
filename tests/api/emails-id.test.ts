import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, createMockParams, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId, checkOwnership } from "@/lib/auth-helpers";

import {
  GET as getEmail,
  PATCH as updateEmail,
} from "@/app/api/emails/[id]/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);
const mockCheckOwnership = vi.mocked(checkOwnership);

const TENANT_ID = "tenant-test-id";

const sampleEmail = {
  id: "email-1",
  tenantId: TENANT_ID,
  type: "email",
  subject: "Follow up",
  body: "Just checking in...",
  emailTo: "john@example.com",
  emailCc: null,
  emailBcc: null,
  emailStatus: "sent",
  contactId: "contact-1",
  companyId: null,
  dealId: null,
  ownerId: "user-test-id",
  contact: { id: "contact-1", firstName: "John", lastName: "Doe", email: "john@example.com" },
  company: null,
  deal: null,
  owner: { id: "user-test-id", name: "Test User", email: "test@example.com" },
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
  mockCheckOwnership.mockResolvedValue(undefined);
});

// =============================================================================
// GET /api/emails/[id] - Get email detail
// =============================================================================
describe("GET /api/emails/[id]", () => {
  it("should return an email", async () => {
    mockPrisma.activity.findFirst.mockResolvedValue(sampleEmail);

    const request = createMockRequest("/api/emails/email-1");
    const response = await getEmail(request, createMockParams({ id: "email-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.subject).toBe("Follow up");
  });

  it("should return 404 when not found", async () => {
    mockPrisma.activity.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/emails/missing");
    const response = await getEmail(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });

  it("should check ownership after finding email", async () => {
    mockPrisma.activity.findFirst.mockResolvedValue(sampleEmail);

    const request = createMockRequest("/api/emails/email-1");
    await getEmail(request, createMockParams({ id: "email-1" }));

    expect(mockCheckOwnership).toHaveBeenCalledWith(TENANT_ID, request);
  });

  it("should filter by type email", async () => {
    mockPrisma.activity.findFirst.mockResolvedValue(sampleEmail);

    const request = createMockRequest("/api/emails/email-1");
    await getEmail(request, createMockParams({ id: "email-1" }));

    const findFirstCall = mockPrisma.activity.findFirst.mock.calls[0][0];
    expect(findFirstCall?.where).toMatchObject({
      id: "email-1",
      type: "email",
    });
  });
});

// =============================================================================
// PATCH /api/emails/[id] - Update email status
// =============================================================================
describe("PATCH /api/emails/[id]", () => {
  it("should update email status", async () => {
    mockPrisma.activity.findFirst.mockResolvedValue(sampleEmail);
    mockPrisma.activity.update.mockResolvedValue({
      ...sampleEmail,
      emailStatus: "delivered",
    });

    const request = createMockRequest("/api/emails/email-1", {
      method: "PATCH",
      body: { emailStatus: "delivered" },
    });
    const response = await updateEmail(request, createMockParams({ id: "email-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.emailStatus).toBe("delivered");
  });

  it("should return 404 when not found", async () => {
    mockPrisma.activity.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/emails/missing", {
      method: "PATCH",
      body: { emailStatus: "delivered" },
    });
    const response = await updateEmail(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });

  it("should return 400 for invalid status", async () => {
    const request = createMockRequest("/api/emails/email-1", {
      method: "PATCH",
      body: { emailStatus: "invalid-status" },
    });
    const response = await updateEmail(request, createMockParams({ id: "email-1" }));

    expect(response.status).toBe(400);
  });

  it("should check ownership", async () => {
    mockPrisma.activity.findFirst.mockResolvedValue(sampleEmail);
    mockPrisma.activity.update.mockResolvedValue(sampleEmail);

    const request = createMockRequest("/api/emails/email-1", {
      method: "PATCH",
      body: { emailStatus: "opened" },
    });
    await updateEmail(request, createMockParams({ id: "email-1" }));

    expect(mockCheckOwnership).toHaveBeenCalledWith(TENANT_ID, request);
  });
});
