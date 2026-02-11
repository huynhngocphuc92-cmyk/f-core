import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, createMockParams, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";

import {
  GET as getFeedback,
  POST as submitFeedback,
} from "@/app/api/kb/articles/[id]/feedback/route";

const mockPrisma = vi.mocked(prisma);

beforeEach(() => {
  vi.clearAllMocks();
});

// =============================================================================
// GET /api/kb/articles/[id]/feedback
// =============================================================================
describe("GET /api/kb/articles/[id]/feedback", () => {
  it("should return feedback stats", async () => {
    mockPrisma.kBArticle.findFirst.mockResolvedValue({
      id: "art-1",
      helpfulCount: 10,
      notHelpfulCount: 3,
    } as any);
    mockPrisma.kBArticleFeedback.findMany.mockResolvedValue([]);

    const request = createMockRequest("/api/kb/articles/art-1/feedback");
    const response = await getFeedback(request, createMockParams({ id: "art-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.helpful).toBe(10);
    expect(body.notHelpful).toBe(3);
    expect(body.total).toBe(13);
  });

  it("should return 404 when article not found", async () => {
    mockPrisma.kBArticle.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/kb/articles/missing/feedback");
    const response = await getFeedback(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });
});

// =============================================================================
// POST /api/kb/articles/[id]/feedback
// =============================================================================
describe("POST /api/kb/articles/[id]/feedback", () => {
  it("should create new feedback", async () => {
    mockPrisma.kBArticle.findFirst.mockResolvedValue({ id: "art-1" } as any);
    mockPrisma.$transaction.mockResolvedValue([{}, {}] as any);

    const request = createMockRequest("/api/kb/articles/art-1/feedback", {
      method: "POST",
      body: { isHelpful: true },
    });
    const response = await submitFeedback(request, createMockParams({ id: "art-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.action).toBe("created");
  });

  it("should update existing feedback when visitorId matches", async () => {
    mockPrisma.kBArticle.findFirst.mockResolvedValue({ id: "art-1" } as any);
    mockPrisma.kBArticleFeedback.findUnique.mockResolvedValue({
      id: "fb-1",
      isHelpful: true,
    } as any);
    mockPrisma.$transaction.mockResolvedValue([{}, {}] as any);

    const request = createMockRequest("/api/kb/articles/art-1/feedback", {
      method: "POST",
      body: { isHelpful: false, visitorId: "visitor-1" },
    });
    const response = await submitFeedback(request, createMockParams({ id: "art-1" }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.action).toBe("updated");
  });

  it("should return 404 when article not found", async () => {
    mockPrisma.kBArticle.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/kb/articles/missing/feedback", {
      method: "POST",
      body: { isHelpful: true },
    });
    const response = await submitFeedback(request, createMockParams({ id: "missing" }));

    expect(response.status).toBe(404);
  });

  it("should return 400 for invalid input", async () => {
    const request = createMockRequest("/api/kb/articles/art-1/feedback", {
      method: "POST",
      body: {},
    });
    const response = await submitFeedback(request, createMockParams({ id: "art-1" }));

    expect(response.status).toBe(400);
  });
});
