import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId, getCurrentUser } from "@/lib/auth-helpers";

vi.mock("nanoid", () => ({
  nanoid: () => "mock-tracking-id",
}));

import { GET as listEmails, POST as sendEmail } from "@/app/api/emails/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);
const mockGetCurrentUser = vi.mocked(getCurrentUser);

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
  owner: { id: "user-test-id", name: "Test User" },
  metadata: { trackingId: "mock-tracking-id" },
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
  mockGetCurrentUser.mockResolvedValue({
    id: "user-test-id",
    email: "test@example.com",
    name: "Test User",
  } as any);
});

// =============================================================================
// GET /api/emails - List emails
// =============================================================================
describe("GET /api/emails", () => {
  it("should return paginated emails", async () => {
    mockPrisma.activity.findMany.mockResolvedValue([sampleEmail]);
    mockPrisma.activity.count.mockResolvedValue(1);

    const request = createMockRequest("/api/emails");
    const response = await listEmails(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].subject).toBe("Follow up");
  });

  it("should filter by search", async () => {
    mockPrisma.activity.findMany.mockResolvedValue([]);
    mockPrisma.activity.count.mockResolvedValue(0);

    const request = createMockRequest("/api/emails", {
      searchParams: { search: "follow" },
    });
    await listEmails(request);

    const findManyCall = mockPrisma.activity.findMany.mock.calls[0][0];
    expect(findManyCall?.where).toMatchObject({
      tenantId: TENANT_ID,
      type: "email",
      OR: expect.arrayContaining([
        expect.objectContaining({
          subject: { contains: "follow", mode: "insensitive" },
        }),
      ]),
    });
  });
});

// =============================================================================
// POST /api/emails - Send email
// =============================================================================
describe("POST /api/emails", () => {
  it("should send an email", async () => {
    mockPrisma.activity.create.mockResolvedValue(sampleEmail);
    mockPrisma.activity.update.mockResolvedValue(sampleEmail);

    const request = createMockRequest("/api/emails", {
      method: "POST",
      body: {
        to: "john@example.com",
        subject: "Follow up",
        body: "Just checking in...",
      },
    });
    const response = await sendEmail(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(201);
    expect(body.subject).toBe("Follow up");
  });

  it("should set ownerId from authenticated user", async () => {
    mockPrisma.activity.create.mockResolvedValue(sampleEmail);
    mockPrisma.activity.update.mockResolvedValue(sampleEmail);

    const request = createMockRequest("/api/emails", {
      method: "POST",
      body: { to: "test@test.com", subject: "Test", body: "Content" },
    });
    await sendEmail(request);

    const createCall = mockPrisma.activity.create.mock.calls[0][0];
    expect(createCall?.data.ownerId).toBe("user-test-id");
    expect(createCall?.data.tenantId).toBe(TENANT_ID);
    expect(createCall?.data.type).toBe("email");
    expect(createCall?.data.emailStatus).toBe("sent");
  });

  it("should include tracking ID in metadata", async () => {
    mockPrisma.activity.create.mockResolvedValue(sampleEmail);
    mockPrisma.activity.update.mockResolvedValue(sampleEmail);

    const request = createMockRequest("/api/emails", {
      method: "POST",
      body: { to: "test@test.com", subject: "Test", body: "Content" },
    });
    await sendEmail(request);

    const createCall = mockPrisma.activity.create.mock.calls[0][0];
    expect((createCall?.data.metadata as any).trackingId).toBe("mock-tracking-id");
  });

  it("should increment template usage when templateId is provided", async () => {
    mockPrisma.activity.create.mockResolvedValue(sampleEmail);
    mockPrisma.activity.update.mockResolvedValue(sampleEmail);
    mockPrisma.emailTemplate.update.mockResolvedValue({} as any);

    const request = createMockRequest("/api/emails", {
      method: "POST",
      body: {
        to: "test@test.com",
        subject: "Test",
        body: "Content",
        templateId: "tmpl-1",
      },
    });
    await sendEmail(request);

    expect(mockPrisma.emailTemplate.update).toHaveBeenCalledWith({
      where: { id: "tmpl-1" },
      data: { usageCount: { increment: 1 } },
    });
  });

  it("should simulate delivery by updating status", async () => {
    mockPrisma.activity.create.mockResolvedValue({ ...sampleEmail, id: "email-new" });
    mockPrisma.activity.update.mockResolvedValue(sampleEmail);

    const request = createMockRequest("/api/emails", {
      method: "POST",
      body: { to: "test@test.com", subject: "Test", body: "Content" },
    });
    await sendEmail(request);

    expect(mockPrisma.activity.update).toHaveBeenCalledWith({
      where: { id: "email-new" },
      data: { emailStatus: "delivered" },
    });
  });

  it("should return 400 when to is missing", async () => {
    const request = createMockRequest("/api/emails", {
      method: "POST",
      body: { subject: "Test", body: "Content" },
    });
    const response = await sendEmail(request);

    expect(response.status).toBe(400);
  });

  it("should return 400 when subject is missing", async () => {
    const request = createMockRequest("/api/emails", {
      method: "POST",
      body: { to: "test@test.com", body: "Content" },
    });
    const response = await sendEmail(request);

    expect(response.status).toBe(400);
  });
});
