import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";

import { GET as listActivities, POST as createActivity } from "@/app/api/activities/route";

const mockPrisma = vi.mocked(prisma);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/activities", () => {
  it("should return activities", async () => {
    mockPrisma.activity.findMany.mockResolvedValue([
      { id: "act-1", type: "note", subject: "Called client" },
    ] as any);

    const request = createMockRequest("/api/activities");
    const response = await listActivities(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
  });

  it("should filter by contactId", async () => {
    mockPrisma.activity.findMany.mockResolvedValue([]);

    const request = createMockRequest("/api/activities", {
      searchParams: { contactId: "c-1" },
    });
    await listActivities(request);

    const where = mockPrisma.activity.findMany.mock.calls[0][0]?.where as any;
    expect(where.contactId).toBe("c-1");
  });

  it("should filter by type", async () => {
    mockPrisma.activity.findMany.mockResolvedValue([]);

    const request = createMockRequest("/api/activities", {
      searchParams: { type: "call" },
    });
    await listActivities(request);

    const where = mockPrisma.activity.findMany.mock.calls[0][0]?.where as any;
    expect(where.type).toBe("call");
  });

  it("should respect limit parameter", async () => {
    mockPrisma.activity.findMany.mockResolvedValue([]);

    const request = createMockRequest("/api/activities", {
      searchParams: { limit: "10" },
    });
    await listActivities(request);

    const take = mockPrisma.activity.findMany.mock.calls[0][0]?.take;
    expect(take).toBe(10);
  });
});

describe("POST /api/activities", () => {
  it("should create an activity", async () => {
    mockPrisma.activity.create.mockResolvedValue({
      id: "act-1",
      type: "note",
      subject: "Test note",
    } as any);

    const request = createMockRequest("/api/activities", {
      method: "POST",
      body: { type: "note", subject: "Test note" },
    });
    const response = await createActivity(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(201);
    expect(body.type).toBe("note");
  });

  it("should return 400 when type is missing", async () => {
    const request = createMockRequest("/api/activities", {
      method: "POST",
      body: { subject: "No type" },
    });
    const response = await createActivity(request);

    expect(response.status).toBe(400);
  });

  it("should use demo-tenant when tenantId not provided", async () => {
    mockPrisma.activity.create.mockResolvedValue({ id: "act-1" } as any);

    const request = createMockRequest("/api/activities", {
      method: "POST",
      body: { type: "note" },
    });
    await createActivity(request);

    const data = mockPrisma.activity.create.mock.calls[0][0]?.data as any;
    expect(data.tenantId).toBe("demo-tenant");
  });
});
