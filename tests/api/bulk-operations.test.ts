import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, createMockParams, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";

import { POST as bulkAction } from "@/app/api/bulk/[entity]/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTenantId.mockResolvedValue("tenant-test-id");
});

describe("POST /api/bulk/[entity]", () => {
  it("should bulk delete contacts (soft delete)", async () => {
    mockPrisma.contact.updateMany.mockResolvedValue({ count: 3 });

    const request = createMockRequest("/api/bulk/contacts", {
      method: "POST",
      body: { action: "delete", ids: ["c-1", "c-2", "c-3"] },
    });
    const response = await bulkAction(request, createMockParams({ entity: "contacts" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.count).toBe(3);
  });

  it("should bulk update contacts with allowed field", async () => {
    mockPrisma.contact.updateMany.mockResolvedValue({ count: 2 });

    const request = createMockRequest("/api/bulk/contacts", {
      method: "POST",
      body: {
        action: "update",
        ids: ["c-1", "c-2"],
        data: { field: "lifecycleStage", value: "customer" },
      },
    });
    const response = await bulkAction(request, createMockParams({ entity: "contacts" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.count).toBe(2);
  });

  it("should return 400 for disallowed field", async () => {
    const request = createMockRequest("/api/bulk/contacts", {
      method: "POST",
      body: {
        action: "update",
        ids: ["c-1"],
        data: { field: "email", value: "hack@example.com" },
      },
    });
    const response = await bulkAction(request, createMockParams({ entity: "contacts" }));

    expect(response.status).toBe(400);
  });

  it("should return 400 for invalid entity", async () => {
    const request = createMockRequest("/api/bulk/users", {
      method: "POST",
      body: { action: "delete", ids: ["u-1"] },
    });
    const response = await bulkAction(request, createMockParams({ entity: "users" }));

    expect(response.status).toBe(400);
  });

  it("should return 400 when update data is missing", async () => {
    const request = createMockRequest("/api/bulk/contacts", {
      method: "POST",
      body: { action: "update", ids: ["c-1"] },
    });
    const response = await bulkAction(request, createMockParams({ entity: "contacts" }));

    expect(response.status).toBe(400);
  });

  it("should bulk delete deals", async () => {
    mockPrisma.deal.updateMany.mockResolvedValue({ count: 1 });

    const request = createMockRequest("/api/bulk/deals", {
      method: "POST",
      body: { action: "delete", ids: ["d-1"] },
    });
    const response = await bulkAction(request, createMockParams({ entity: "deals" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it("should return 401 when not authenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));

    const request = createMockRequest("/api/bulk/contacts", {
      method: "POST",
      body: { action: "delete", ids: ["c-1"] },
    });
    const response = await bulkAction(request, createMockParams({ entity: "contacts" }));

    expect(response.status).toBe(401);
  });
});
