import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";

import { GET as listLinks, POST as createLink } from "@/app/api/meetings/links/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTenantId.mockResolvedValue("tenant-test-id");
});

describe("GET /api/meetings/links", () => {
  it("should return paginated meeting links", async () => {
    mockPrisma.meetingLink.findMany.mockResolvedValue([
      { id: "ml-1", slug: "quick-call-abc" },
    ] as any);
    mockPrisma.meetingLink.count.mockResolvedValue(1);

    const request = createMockRequest("/api/meetings/links");
    const response = await listLinks(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.pagination.total).toBe(1);
  });

  it("should return 401 when not authenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));

    const request = createMockRequest("/api/meetings/links");
    const response = await listLinks(request);

    expect(response.status).toBe(401);
  });
});

describe("POST /api/meetings/links", () => {
  it("should create a meeting link", async () => {
    mockPrisma.meetingType.findFirst.mockResolvedValue({
      id: "mt-1",
      slug: "quick-call",
      tenantId: "tenant-test-id",
    } as any);
    mockPrisma.meetingLink.create.mockResolvedValue({
      id: "ml-1",
      slug: "quick-call-abc",
    } as any);

    const request = createMockRequest("/api/meetings/links", {
      method: "POST",
      body: { meetingTypeId: "mt-1" },
    });
    const response = await createLink(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(201);
    expect(body.slug).toContain("quick-call");
  });

  it("should return 404 when meeting type not found", async () => {
    mockPrisma.meetingType.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/meetings/links", {
      method: "POST",
      body: { meetingTypeId: "nonexistent" },
    });
    const response = await createLink(request);

    expect(response.status).toBe(404);
  });

  it("should return 400 when meetingTypeId is missing", async () => {
    const request = createMockRequest("/api/meetings/links", {
      method: "POST",
      body: {},
    });
    const response = await createLink(request);

    expect(response.status).toBe(400);
  });
});
