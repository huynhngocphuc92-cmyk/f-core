import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, createMockParams, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";

import { GET as listCategories, POST as createCategory } from "@/app/api/kb/categories/route";
import {
  GET as getCategory,
  PATCH as updateCategory,
  DELETE as deleteCategory,
} from "@/app/api/kb/categories/[id]/route";

const mockPrisma = vi.mocked(prisma);

const sampleCategory = {
  id: "cat-1",
  tenantId: "demo-tenant",
  name: "Guides",
  slug: "guides",
  description: null,
  icon: null,
  parentId: null,
  orderIndex: 0,
  children: [],
  _count: { articles: 5 },
};

beforeEach(() => {
  vi.clearAllMocks();
});

// =============================================================================
// GET /api/kb/categories
// =============================================================================
describe("GET /api/kb/categories", () => {
  it("should return categories", async () => {
    mockPrisma.kBCategory.findMany.mockResolvedValue([sampleCategory] as any);

    const request = createMockRequest("/api/kb/categories");
    const response = await listCategories(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
  });

  it("should filter root categories", async () => {
    mockPrisma.kBCategory.findMany.mockResolvedValue([]);

    const request = createMockRequest("/api/kb/categories", {
      searchParams: { parentId: "root" },
    });
    await listCategories(request);

    const where = mockPrisma.kBCategory.findMany.mock.calls[0][0]?.where as any;
    expect(where.parentId).toBeNull();
  });

  it("should filter by parentId", async () => {
    mockPrisma.kBCategory.findMany.mockResolvedValue([]);

    const request = createMockRequest("/api/kb/categories", {
      searchParams: { parentId: "cat-parent" },
    });
    await listCategories(request);

    const where = mockPrisma.kBCategory.findMany.mock.calls[0][0]?.where as any;
    expect(where.parentId).toBe("cat-parent");
  });
});

// =============================================================================
// POST /api/kb/categories
// =============================================================================
describe("POST /api/kb/categories", () => {
  it("should create a category", async () => {
    mockPrisma.kBCategory.findFirst.mockResolvedValue(null); // no duplicate slug
    mockPrisma.kBCategory.create.mockResolvedValue(sampleCategory as any);

    const request = createMockRequest("/api/kb/categories", {
      method: "POST",
      body: { name: "Guides" },
    });
    const response = await createCategory(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(201);
    expect(body.name).toBe("Guides");
  });

  it("should return 400 for missing name", async () => {
    const request = createMockRequest("/api/kb/categories", {
      method: "POST",
      body: {},
    });
    const response = await createCategory(request);

    expect(response.status).toBe(400);
  });

  it("should return 400 when parent category not found", async () => {
    mockPrisma.kBCategory.findFirst
      .mockResolvedValueOnce(null) // no duplicate slug
      .mockResolvedValueOnce(null); // parent not found

    const request = createMockRequest("/api/kb/categories", {
      method: "POST",
      body: {
        name: "Sub Category",
        parentId: "550e8400-e29b-41d4-a716-446655440000",
      },
    });
    const response = await createCategory(request);

    expect(response.status).toBe(400);
  });
});

// =============================================================================
// GET /api/kb/categories/[id]
// =============================================================================
describe("GET /api/kb/categories/[id]", () => {
  it("should return a category with articles", async () => {
    mockPrisma.kBCategory.findFirst.mockResolvedValue({
      ...sampleCategory,
      articles: [],
    } as any);

    const request = createMockRequest("/api/kb/categories/cat-1");
    const response = await getCategory(request, createMockParams({ id: "cat-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.name).toBe("Guides");
  });

  it("should return 404 when not found", async () => {
    mockPrisma.kBCategory.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/kb/categories/missing");
    const response = await getCategory(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });
});

// =============================================================================
// PATCH /api/kb/categories/[id]
// =============================================================================
describe("PATCH /api/kb/categories/[id]", () => {
  it("should update a category", async () => {
    mockPrisma.kBCategory.findFirst.mockResolvedValue({ id: "cat-1" } as any);
    mockPrisma.kBCategory.update.mockResolvedValue({ ...sampleCategory, name: "Updated" } as any);

    const request = createMockRequest("/api/kb/categories/cat-1", {
      method: "PATCH",
      body: { name: "Updated" },
    });
    const response = await updateCategory(request, createMockParams({ id: "cat-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.name).toBe("Updated");
  });

  it("should return 400 when setting self as parent", async () => {
    mockPrisma.kBCategory.findFirst.mockResolvedValue({ id: "cat-1" } as any);

    const request = createMockRequest("/api/kb/categories/cat-1", {
      method: "PATCH",
      body: { parentId: "cat-1" },
    });
    const response = await updateCategory(request, createMockParams({ id: "cat-1" }));

    expect(response.status).toBe(400);
  });

  it("should return 404 when not found", async () => {
    mockPrisma.kBCategory.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/kb/categories/missing", {
      method: "PATCH",
      body: { name: "Updated" },
    });
    const response = await updateCategory(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });
});

// =============================================================================
// DELETE /api/kb/categories/[id]
// =============================================================================
describe("DELETE /api/kb/categories/[id]", () => {
  it("should soft delete and uncategorize children", async () => {
    mockPrisma.kBCategory.findFirst.mockResolvedValue({ id: "cat-1" } as any);
    mockPrisma.$transaction.mockResolvedValue([{ count: 1 }, { count: 2 }, {}] as any);

    const request = createMockRequest("/api/kb/categories/cat-1", { method: "DELETE" });
    const response = await deleteCategory(request, createMockParams({ id: "cat-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockPrisma.$transaction).toHaveBeenCalled();
  });

  it("should return 404 when not found", async () => {
    mockPrisma.kBCategory.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/kb/categories/missing", { method: "DELETE" });
    const response = await deleteCategory(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });
});
