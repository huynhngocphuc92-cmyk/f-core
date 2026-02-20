import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import { getTenantId } from "@/lib/auth-helpers";
import { GET, POST } from "@/app/api/data/sync/mappings/validate/route";

const mockGetTenantId = vi.mocked(getTenantId);

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTenantId.mockResolvedValue("tenant-test-id");
});

describe("data sync mapping validate API", () => {
  it("returns transform and validation catalog", async () => {
    const response = await GET(createMockRequest("/api/data/sync/mappings/validate"));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data.transformOperations).toContain("trim");
    expect(body.data.validationRules).toContain("required");
  });

  it("validates mapping rules and returns preview", async () => {
    const response = await POST(
      createMockRequest("/api/data/sync/mappings/validate", {
        method: "POST",
        body: {
          fieldMappings: [
            {
              sourceField: "email",
              targetField: "Email",
              transform: { operation: "trim" },
              validations: [{ type: "required" }, { type: "email" }],
            },
          ],
          sampleRecord: {
            email: "  demo@example.com  ",
          },
        },
      })
    );

    const body = await getResponseBody(response);
    expect(response.status).toBe(200);
    expect(body.data.isValid).toBe(true);
    expect(body.data.preview).toEqual({ Email: "demo@example.com" });
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));
    const response = await GET(createMockRequest("/api/data/sync/mappings/validate"));
    expect(response.status).toBe(401);
  });
});
