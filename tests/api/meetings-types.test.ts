import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";

import { GET as listTypes, POST as createType } from "@/app/api/meetings/types/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTenantId.mockResolvedValue("tenant-test-id");
});

describe("GET /api/meetings/types", () => {
  it("should return paginated meeting types", async () => {
    mockPrisma.meetingType.findMany.mockResolvedValue([
      { id: "mt-1", name: "Quick Call", duration: 15 },
    ] as any);
    mockPrisma.meetingType.count.mockResolvedValue(1);

    const request = createMockRequest("/api/meetings/types");
    const response = await listTypes(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.pagination.total).toBe(1);
  });

  it("should return 401 when not authenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));

    const request = createMockRequest("/api/meetings/types");
    const response = await listTypes(request);

    expect(response.status).toBe(401);
  });
});

describe("POST /api/meetings/types", () => {
  it("should create a meeting type", async () => {
    mockPrisma.meetingType.findFirst.mockResolvedValue(null);
    mockPrisma.meetingType.create.mockResolvedValue({
      id: "mt-1",
      name: "Quick Call",
      slug: "quick-call",
      duration: 15,
    } as any);

    const request = createMockRequest("/api/meetings/types", {
      method: "POST",
      body: { name: "Quick Call", duration: 15 },
    });
    const response = await createType(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(201);
    expect(body.name).toBe("Quick Call");
  });

  it("should return 400 for invalid duration", async () => {
    const request = createMockRequest("/api/meetings/types", {
      method: "POST",
      body: { name: "Call", duration: 2 },
    });
    const response = await createType(request);

    expect(response.status).toBe(400);
  });

  it("should return 400 when name is missing", async () => {
    const request = createMockRequest("/api/meetings/types", {
      method: "POST",
      body: { duration: 30 },
    });
    const response = await createType(request);

    expect(response.status).toBe(400);
  });
});
