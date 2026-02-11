import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";

import { GET as searchArticles } from "@/app/api/kb/search/route";

const mockPrisma = vi.mocked(prisma);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/kb/search", () => {
  it("should return search results with highlighted excerpts", async () => {
    mockPrisma.kBArticle.findMany.mockResolvedValue([
      {
        id: "art-1",
        title: "Getting Started",
        slug: "getting-started",
        subtitle: null,
        excerpt: "A guide to getting started",
        tags: [],
        status: "published",
        publishedAt: new Date(),
        viewCount: 10,
        helpfulCount: 5,
        notHelpfulCount: 1,
        category: { id: "cat-1", name: "Guides", slug: "guides" },
      },
    ] as any);
    mockPrisma.kBArticle.count.mockResolvedValue(1);

    const request = createMockRequest("/api/kb/search", {
      searchParams: { q: "guide" },
    });
    const response = await searchArticles(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].highlightedExcerpt).toContain("<mark>");
    expect(body.query).toBe("guide");
    expect(body.pagination.total).toBe(1);
  });

  it("should return 400 when query is missing", async () => {
    const request = createMockRequest("/api/kb/search");
    const response = await searchArticles(request);

    expect(response.status).toBe(400);
  });

  it("should return 400 for empty query string", async () => {
    const request = createMockRequest("/api/kb/search", {
      searchParams: { q: "   " },
    });
    const response = await searchArticles(request);

    expect(response.status).toBe(400);
  });

  it("should only search published articles", async () => {
    mockPrisma.kBArticle.findMany.mockResolvedValue([]);
    mockPrisma.kBArticle.count.mockResolvedValue(0);

    const request = createMockRequest("/api/kb/search", {
      searchParams: { q: "test" },
    });
    await searchArticles(request);

    const where = mockPrisma.kBArticle.findMany.mock.calls[0][0]?.where as any;
    expect(where.status).toBe("published");
    expect(where.deletedAt).toBeNull();
  });
});
