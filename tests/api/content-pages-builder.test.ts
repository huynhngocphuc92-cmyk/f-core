import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getCurrentUser, getTenantId } from "@/lib/auth-helpers";
import { GET as listTemplatesApi } from "@/app/api/content/pages/templates/route";
import { GET as listBlocksApi, POST as createBlockApi } from "@/app/api/content/pages/blocks/route";
import { POST as composePageApi } from "@/app/api/content/pages/compose/route";
import { resetContentPageBuilderStoreForTests } from "@/lib/content-page-builder";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);
const mockGetCurrentUser = vi.mocked(getCurrentUser);
const TENANT_ID = "tenant-test-id";

beforeEach(async () => {
  vi.clearAllMocks();
  await resetContentPageBuilderStoreForTests();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
  mockGetCurrentUser.mockResolvedValue({
    id: "user-test-id",
    email: "test@example.com",
    name: "Test User",
  } as any);

  mockPrisma.landingPage.findFirst.mockResolvedValue({
    id: "page-1",
    name: "Page 1",
    contentJson: {},
  } as any);
  mockPrisma.landingPage.update.mockResolvedValue({
    id: "page-1",
    name: "Page 1",
    templateId: "product_launch",
    contentJson: {},
    contentHtml: "<section></section>",
    updatedAt: new Date(),
  } as any);
});

describe("content page builder APIs", () => {
  it("lists templates and creates blocks", async () => {
    const templates = await listTemplatesApi(createMockRequest("/api/content/pages/templates"));
    const templatesBody = await getResponseBody(templates);
    expect(templates.status).toBe(200);
    expect(templatesBody.data.length).toBeGreaterThan(0);

    const created = await createBlockApi(
      createMockRequest("/api/content/pages/blocks", {
        method: "POST",
        body: {
          name: "Hero block",
          sectionType: "hero",
          headline: "Headline",
          body: "Body",
        },
      })
    );
    const createdBody = await getResponseBody(created);

    expect(created.status).toBe(201);
    expect(createdBody.block.sectionType).toBe("hero");

    const listed = await listBlocksApi(createMockRequest("/api/content/pages/blocks"));
    const listedBody = await getResponseBody(listed);
    expect(listed.status).toBe(200);
    expect(listedBody.data).toHaveLength(1);
  });

  it("composes structured sections into landing page", async () => {
    await createBlockApi(
      createMockRequest("/api/content/pages/blocks", {
        method: "POST",
        body: {
          name: "Hero",
          sectionType: "hero",
          headline: "Hero",
          body: "Body",
        },
      })
    );
    await createBlockApi(
      createMockRequest("/api/content/pages/blocks", {
        method: "POST",
        body: {
          name: "Benefits",
          sectionType: "benefits",
          headline: "Benefits",
          body: "Body",
        },
      })
    );
    await createBlockApi(
      createMockRequest("/api/content/pages/blocks", {
        method: "POST",
        body: {
          name: "CTA",
          sectionType: "cta",
          headline: "CTA",
          body: "Body",
        },
      })
    );

    const listed = await listBlocksApi(createMockRequest("/api/content/pages/blocks"));
    const listedBody = await getResponseBody(listed);
    const blockIds = listedBody.data.map((item: any) => item.id);

    const response = await composePageApi(
      createMockRequest("/api/content/pages/compose", {
        method: "POST",
        body: {
          landingPageId: "page-1",
          templateKey: "product_launch",
          blockIds,
        },
      })
    );

    const body = await getResponseBody(response);
    expect(response.status).toBe(200);
    expect(body.sections.length).toBeGreaterThanOrEqual(3);
    expect(mockPrisma.landingPage.update).toHaveBeenCalled();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));

    const response = await listTemplatesApi(createMockRequest("/api/content/pages/templates"));
    expect(response.status).toBe(401);
  });
});
