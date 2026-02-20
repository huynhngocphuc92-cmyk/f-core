import { beforeEach, describe, expect, it, vi } from "vitest";
import prisma from "@/lib/prisma";
import { checkPermission, getUserData } from "@/lib/auth-helpers";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import { GET, POST } from "@/app/api/ai/agents/knowledge/route";

const mockPrisma = vi.mocked(prisma);
const mockGetUserData = vi.mocked(getUserData);
const mockCheckPermission = vi.mocked(checkPermission);

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUserData.mockResolvedValue({
    id: "user-1",
    email: "demo@example.com",
    name: "Demo User",
    tenantId: "tenant-test-id",
    role: "admin",
  } as never);

  mockPrisma.kBArticle.findMany.mockResolvedValue([
    {
      id: "kb-1",
      title: "SLA policy setup",
      slug: "sla-policy-setup",
      excerpt: "How to configure first response and resolution SLAs.",
      contentHtml: "Set low, medium, high, urgent targets and run SLA alerts.",
      tags: ["sla", "service"],
      viewCount: 200,
      helpfulCount: 30,
      publishedAt: new Date("2026-02-12T00:00:00.000Z"),
      category: { name: "Service Hub", slug: "service-hub" },
    },
  ] as never);
});

describe("ai knowledge agent API", () => {
  it("returns grounded answer on GET", async () => {
    const response = await GET(
      createMockRequest("/api/ai/agents/knowledge", {
        searchParams: {
          query: "how to set sla",
          maxCitations: "3",
        },
      })
    );

    const body = await getResponseBody(response);
    expect(response.status).toBe(200);
    expect(body.data.citations.length).toBeGreaterThan(0);
    expect(body.data.safety.hasSufficientContext).toBe(true);
  });

  it("supports POST request body", async () => {
    const response = await POST(
      createMockRequest("/api/ai/agents/knowledge", {
        method: "POST",
        body: {
          query: "routing queue settings",
          maxCitations: 2,
        },
      })
    );

    const body = await getResponseBody(response);
    expect(response.status).toBe(200);
    expect(body.data.citations.length).toBeLessThanOrEqual(2);
  });

  it("returns 400 for invalid query", async () => {
    const response = await GET(
      createMockRequest("/api/ai/agents/knowledge", {
        searchParams: { query: "a" },
      })
    );
    expect(response.status).toBe(400);
  });

  it("returns 403 when missing ai.use permission", async () => {
    mockCheckPermission.mockRejectedValue(
      new Error("Forbidden: Missing permission ai.use")
    );

    const response = await GET(createMockRequest("/api/ai/agents/knowledge"));
    expect(response.status).toBe(403);
  });
});
