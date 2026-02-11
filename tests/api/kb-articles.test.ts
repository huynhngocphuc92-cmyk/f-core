import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, createMockParams, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";

import { GET as listArticles, POST as createArticle } from "@/app/api/kb/articles/route";
import {
  GET as getArticle,
  PATCH as updateArticle,
  DELETE as deleteArticle,
} from "@/app/api/kb/articles/[id]/route";

const mockPrisma = vi.mocked(prisma);

const sampleArticle = {
  id: "art-1",
  tenantId: "demo-tenant",
  title: "Getting Started",
  slug: "getting-started",
  status: "draft",
  excerpt: "A guide",
  contentHtml: "<p>Content</p>",
  category: { id: "cat-1", name: "Guides", slug: "guides" },
  _count: { feedback: 0 },
  tags: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

// =============================================================================
// GET /api/kb/articles
// =============================================================================
describe("GET /api/kb/articles", () => {
  it("should return paginated articles", async () => {
    mockPrisma.kBArticle.findMany.mockResolvedValue([sampleArticle] as any);
    mockPrisma.kBArticle.count.mockResolvedValue(1);

    const request = createMockRequest("/api/kb/articles");
    const response = await listArticles(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.pagination.total).toBe(1);
  });

  it("should filter by status", async () => {
    mockPrisma.kBArticle.findMany.mockResolvedValue([]);
    mockPrisma.kBArticle.count.mockResolvedValue(0);

    const request = createMockRequest("/api/kb/articles", {
      searchParams: { status: "published" },
    });
    await listArticles(request);

    const where = mockPrisma.kBArticle.findMany.mock.calls[0][0]?.where as any;
    expect(where.status).toBe("published");
  });

  it("should filter by categoryId", async () => {
    mockPrisma.kBArticle.findMany.mockResolvedValue([]);
    mockPrisma.kBArticle.count.mockResolvedValue(0);

    const request = createMockRequest("/api/kb/articles", {
      searchParams: { categoryId: "cat-1" },
    });
    await listArticles(request);

    const where = mockPrisma.kBArticle.findMany.mock.calls[0][0]?.where as any;
    expect(where.categoryId).toBe("cat-1");
  });

  it("should support search", async () => {
    mockPrisma.kBArticle.findMany.mockResolvedValue([]);
    mockPrisma.kBArticle.count.mockResolvedValue(0);

    const request = createMockRequest("/api/kb/articles", {
      searchParams: { search: "guide" },
    });
    await listArticles(request);

    const where = mockPrisma.kBArticle.findMany.mock.calls[0][0]?.where as any;
    expect(where.OR).toBeDefined();
  });

  it("should filter by tags", async () => {
    mockPrisma.kBArticle.findMany.mockResolvedValue([]);
    mockPrisma.kBArticle.count.mockResolvedValue(0);

    const request = createMockRequest("/api/kb/articles", {
      searchParams: { tags: "faq,tutorial" },
    });
    await listArticles(request);

    const where = mockPrisma.kBArticle.findMany.mock.calls[0][0]?.where as any;
    expect(where.tags).toEqual({ hasSome: ["faq", "tutorial"] });
  });
});

// =============================================================================
// POST /api/kb/articles
// =============================================================================
describe("POST /api/kb/articles", () => {
  it("should create an article", async () => {
    mockPrisma.kBArticle.findUnique.mockResolvedValue(null);
    mockPrisma.kBArticle.create.mockResolvedValue(sampleArticle as any);

    const request = createMockRequest("/api/kb/articles", {
      method: "POST",
      body: { title: "Getting Started" },
    });
    const response = await createArticle(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(201);
    expect(body.title).toBe("Getting Started");
  });

  it("should generate unique slug when duplicate exists", async () => {
    mockPrisma.kBArticle.findUnique.mockResolvedValue({ id: "existing" } as any);
    mockPrisma.kBArticle.create.mockResolvedValue(sampleArticle as any);

    const request = createMockRequest("/api/kb/articles", {
      method: "POST",
      body: { title: "Getting Started" },
    });
    const response = await createArticle(request);

    expect(response.status).toBe(201);
  });

  it("should return 400 for missing title", async () => {
    const request = createMockRequest("/api/kb/articles", {
      method: "POST",
      body: {},
    });
    const response = await createArticle(request);

    expect(response.status).toBe(400);
  });

  it("should return 400 when categoryId not found", async () => {
    mockPrisma.kBArticle.findUnique.mockResolvedValue(null);
    mockPrisma.kBCategory.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/kb/articles", {
      method: "POST",
      body: {
        title: "Test",
        categoryId: "550e8400-e29b-41d4-a716-446655440000",
      },
    });
    const response = await createArticle(request);

    expect(response.status).toBe(400);
  });
});

// =============================================================================
// GET /api/kb/articles/[id]
// =============================================================================
describe("GET /api/kb/articles/[id]", () => {
  it("should return an article with feedback summary", async () => {
    mockPrisma.kBArticle.findFirst.mockResolvedValue(sampleArticle as any);
    mockPrisma.kBArticleFeedback.count
      .mockResolvedValueOnce(10) // helpful
      .mockResolvedValueOnce(3); // notHelpful

    const request = createMockRequest("/api/kb/articles/art-1");
    const response = await getArticle(request, createMockParams({ id: "art-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.feedbackSummary.helpful).toBe(10);
    expect(body.feedbackSummary.notHelpful).toBe(3);
    expect(body.feedbackSummary.total).toBe(13);
  });

  it("should return 404 when not found", async () => {
    mockPrisma.kBArticle.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/kb/articles/missing");
    const response = await getArticle(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });
});

// =============================================================================
// PATCH /api/kb/articles/[id]
// =============================================================================
describe("PATCH /api/kb/articles/[id]", () => {
  it("should update an article", async () => {
    mockPrisma.kBArticle.findFirst.mockResolvedValue({ id: "art-1", status: "draft" } as any);
    mockPrisma.kBArticle.update.mockResolvedValue({ ...sampleArticle, title: "Updated" } as any);

    const request = createMockRequest("/api/kb/articles/art-1", {
      method: "PATCH",
      body: { title: "Updated" },
    });
    const response = await updateArticle(request, createMockParams({ id: "art-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.title).toBe("Updated");
  });

  it("should return 400 when trying to publish via PATCH", async () => {
    mockPrisma.kBArticle.findFirst.mockResolvedValue({ id: "art-1", status: "draft" } as any);

    const request = createMockRequest("/api/kb/articles/art-1", {
      method: "PATCH",
      body: { status: "published" },
    });
    const response = await updateArticle(request, createMockParams({ id: "art-1" }));

    expect(response.status).toBe(400);
  });

  it("should allow PATCH when already published", async () => {
    mockPrisma.kBArticle.findFirst.mockResolvedValue({ id: "art-1", status: "published" } as any);
    mockPrisma.kBArticle.update.mockResolvedValue(sampleArticle as any);

    const request = createMockRequest("/api/kb/articles/art-1", {
      method: "PATCH",
      body: { status: "published", title: "Updated" },
    });
    const response = await updateArticle(request, createMockParams({ id: "art-1" }));

    expect(response.status).toBe(200);
  });

  it("should return 404 when not found", async () => {
    mockPrisma.kBArticle.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/kb/articles/missing", {
      method: "PATCH",
      body: { title: "Updated" },
    });
    const response = await updateArticle(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });
});

// =============================================================================
// DELETE /api/kb/articles/[id]
// =============================================================================
describe("DELETE /api/kb/articles/[id]", () => {
  it("should soft delete an article", async () => {
    mockPrisma.kBArticle.findFirst.mockResolvedValue({ id: "art-1" } as any);
    mockPrisma.kBArticle.update.mockResolvedValue(sampleArticle as any);

    const request = createMockRequest("/api/kb/articles/art-1", { method: "DELETE" });
    const response = await deleteArticle(request, createMockParams({ id: "art-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);

    const updateCall = mockPrisma.kBArticle.update.mock.calls[0][0];
    expect(updateCall?.data).toMatchObject({ deletedAt: expect.any(Date) });
  });

  it("should return 404 when not found", async () => {
    mockPrisma.kBArticle.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/kb/articles/missing", { method: "DELETE" });
    const response = await deleteArticle(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });
});
