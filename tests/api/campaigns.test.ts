import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId, getCurrentUser } from "@/lib/auth-helpers";

import { GET as listCampaigns, POST as createCampaign } from "@/app/api/campaigns/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);
const mockGetCurrentUser = vi.mocked(getCurrentUser);

const TENANT_ID = "tenant-test-id";

const sampleCampaign = {
  id: "camp-1",
  tenantId: TENANT_ID,
  name: "Black Friday Sale",
  subject: "50% Off Everything!",
  body: "<h1>Big Sale</h1>",
  previewText: "Don't miss out",
  templateId: null,
  status: "draft",
  ownerId: "user-test-id",
  owner: { id: "user-test-id", name: "Test User", email: "test@example.com" },
  scheduledAt: null,
  sentAt: null,
  totalSent: 0,
  totalOpened: 0,
  totalClicked: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
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
// GET /api/campaigns - List campaigns
// =============================================================================
describe("GET /api/campaigns", () => {
  it("should return paginated campaigns", async () => {
    mockPrisma.emailCampaign.findMany.mockResolvedValue([sampleCampaign]);
    mockPrisma.emailCampaign.count.mockResolvedValue(1);

    const request = createMockRequest("/api/campaigns");
    const response = await listCampaigns(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe("Black Friday Sale");
  });

  it("should filter by status", async () => {
    mockPrisma.emailCampaign.findMany.mockResolvedValue([]);
    mockPrisma.emailCampaign.count.mockResolvedValue(0);

    const request = createMockRequest("/api/campaigns", {
      searchParams: { status: "sent" },
    });
    await listCampaigns(request);

    const findManyCall = mockPrisma.emailCampaign.findMany.mock.calls[0][0];
    expect(findManyCall?.where).toMatchObject({
      tenantId: TENANT_ID,
      status: "sent",
    });
  });

  it("should filter by search", async () => {
    mockPrisma.emailCampaign.findMany.mockResolvedValue([]);
    mockPrisma.emailCampaign.count.mockResolvedValue(0);

    const request = createMockRequest("/api/campaigns", {
      searchParams: { search: "friday" },
    });
    await listCampaigns(request);

    const findManyCall = mockPrisma.emailCampaign.findMany.mock.calls[0][0];
    expect(findManyCall?.where).toMatchObject({
      tenantId: TENANT_ID,
      OR: expect.arrayContaining([
        expect.objectContaining({
          name: { contains: "friday", mode: "insensitive" },
        }),
      ]),
    });
  });

  it("should not filter when status is 'all'", async () => {
    mockPrisma.emailCampaign.findMany.mockResolvedValue([]);
    mockPrisma.emailCampaign.count.mockResolvedValue(0);

    const request = createMockRequest("/api/campaigns", {
      searchParams: { status: "all" },
    });
    await listCampaigns(request);

    const findManyCall = mockPrisma.emailCampaign.findMany.mock.calls[0][0];
    expect(findManyCall?.where).not.toHaveProperty("status");
  });
});

// =============================================================================
// POST /api/campaigns - Create campaign
// =============================================================================
describe("POST /api/campaigns", () => {
  it("should create a campaign", async () => {
    mockPrisma.emailCampaign.create.mockResolvedValue(sampleCampaign);

    const request = createMockRequest("/api/campaigns", {
      method: "POST",
      body: {
        name: "Black Friday Sale",
        subject: "50% Off Everything!",
        body: "<h1>Big Sale</h1>",
      },
    });
    const response = await createCampaign(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(201);
    expect(body.name).toBe("Black Friday Sale");
  });

  it("should set ownerId from authenticated user", async () => {
    mockPrisma.emailCampaign.create.mockResolvedValue(sampleCampaign);

    const request = createMockRequest("/api/campaigns", {
      method: "POST",
      body: { name: "Campaign", subject: "Test", body: "Content" },
    });
    await createCampaign(request);

    const createCall = mockPrisma.emailCampaign.create.mock.calls[0][0];
    expect(createCall?.data.ownerId).toBe("user-test-id");
    expect(createCall?.data.tenantId).toBe(TENANT_ID);
  });

  it("should return 400 when name is missing", async () => {
    const request = createMockRequest("/api/campaigns", {
      method: "POST",
      body: { subject: "Test", body: "Content" },
    });
    const response = await createCampaign(request);

    expect(response.status).toBe(400);
  });

  it("should return 400 when subject is missing", async () => {
    const request = createMockRequest("/api/campaigns", {
      method: "POST",
      body: { name: "Campaign", body: "Content" },
    });
    const response = await createCampaign(request);

    expect(response.status).toBe(400);
  });

  it("should return 400 when body is missing", async () => {
    const request = createMockRequest("/api/campaigns", {
      method: "POST",
      body: { name: "Campaign", subject: "Test" },
    });
    const response = await createCampaign(request);

    expect(response.status).toBe(400);
  });
});
