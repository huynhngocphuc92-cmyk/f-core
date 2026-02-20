import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockParams, createMockRequest, getResponseBody } from "../helpers/mock-request";
import { checkPermission, getUserData } from "@/lib/auth-helpers";
import { GET, POST } from "@/app/api/ai/prompts/route";
import { POST as rollback } from "@/app/api/ai/prompts/[agent]/rollback/route";
import {
  listPromptVersions,
  resetPromptGovernanceStoreForTests,
} from "@/lib/ai/prompt-governance";

const mockGetUserData = vi.mocked(getUserData);
const mockCheckPermission = vi.mocked(checkPermission);
const TENANT_ID = "tenant-ai-prompts";

beforeEach(async () => {
  vi.clearAllMocks();
  await resetPromptGovernanceStoreForTests();
  mockGetUserData.mockResolvedValue({
    id: "user-1",
    email: "demo@example.com",
    name: "Demo User",
    tenantId: TENANT_ID,
    role: "admin",
  } as never);
});

describe("ai prompts API", () => {
  it("lists prompt versions", async () => {
    const response = await GET(createMockRequest("/api/ai/prompts?agent=chat", {
      searchParams: { agent: "chat" },
    }));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data.agent).toBe("chat");
    expect(body.data.versions.length).toBeGreaterThan(0);
  });

  it("creates a prompt version", async () => {
    const response = await POST(
      createMockRequest("/api/ai/prompts", {
        method: "POST",
        body: {
          agent: "knowledge",
          label: "citations-v2",
          prompt: "Always cite at least one matching article and flag missing evidence clearly.",
          activate: true,
        },
      })
    );
    const body = await getResponseBody(response);

    expect(response.status).toBe(201);
    expect(body.version.agent).toBe("knowledge");
    expect(body.version.isActive).toBe(true);
  });

  it("rolls back to selected version", async () => {
    await POST(
      createMockRequest("/api/ai/prompts", {
        method: "POST",
        body: {
          agent: "sales",
          label: "sales-v2",
          prompt: "Prioritize high-risk deals first and provide explicit owner actions.",
          activate: true,
        },
      })
    );

    const versions = await listPromptVersions(TENANT_ID, "sales");
    const target = versions[versions.length - 1];

    const response = await rollback(
      createMockRequest("/api/ai/prompts/sales/rollback", {
        method: "POST",
        body: { versionId: target.id },
      }),
      createMockParams({ agent: "sales" })
    );
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.activeVersion.id).toBe(target.id);
  });

  it("returns 400 for invalid prompt payload", async () => {
    const response = await POST(
      createMockRequest("/api/ai/prompts", {
        method: "POST",
        body: {
          agent: "sales",
          prompt: "short",
        },
      })
    );

    expect(response.status).toBe(400);
  });

  it("returns 403 when missing settings.manage permission", async () => {
    mockCheckPermission.mockRejectedValue(
      new Error("Forbidden: Missing permission settings.manage")
    );

    const response = await POST(
      createMockRequest("/api/ai/prompts", {
        method: "POST",
        body: {
          agent: "knowledge",
          label: "blocked-change",
          prompt: "This should not be accepted without permission.",
        },
      })
    );

    expect(response.status).toBe(403);
  });
});
