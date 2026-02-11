import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, createMockParams, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";

import { POST as publishArticle } from "@/app/api/kb/articles/[id]/publish/route";

const mockPrisma = vi.mocked(prisma);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/kb/articles/[id]/publish", () => {
  it("should publish a draft article", async () => {
    mockPrisma.kBArticle.findFirst.mockResolvedValue({
      id: "art-1",
      title: "Guide",
      contentHtml: "<p>Content</p>",
      status: "draft",
    } as any);
    mockPrisma.kBArticle.update.mockResolvedValue({
      id: "art-1",
      status: "published",
      publishedAt: new Date(),
    } as any);

    const request = createMockRequest("/api/kb/articles/art-1/publish", { method: "POST" });
    const response = await publishArticle(request, createMockParams({ id: "art-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.status).toBe("published");
  });

  it("should return 400 when already published", async () => {
    mockPrisma.kBArticle.findFirst.mockResolvedValue({
      id: "art-1",
      title: "Guide",
      contentHtml: "<p>Content</p>",
      status: "published",
    } as any);

    const request = createMockRequest("/api/kb/articles/art-1/publish", { method: "POST" });
    const response = await publishArticle(request, createMockParams({ id: "art-1" }));

    expect(response.status).toBe(400);
  });

  it("should return 400 when missing title or content", async () => {
    mockPrisma.kBArticle.findFirst.mockResolvedValue({
      id: "art-1",
      title: "Guide",
      contentHtml: null,
      status: "draft",
    } as any);

    const request = createMockRequest("/api/kb/articles/art-1/publish", { method: "POST" });
    const response = await publishArticle(request, createMockParams({ id: "art-1" }));

    expect(response.status).toBe(400);
  });

  it("should return 404 when not found", async () => {
    mockPrisma.kBArticle.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/kb/articles/missing/publish", { method: "POST" });
    const response = await publishArticle(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });
});
