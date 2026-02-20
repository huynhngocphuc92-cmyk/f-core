import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockParams, createMockRequest, getResponseBody } from "../helpers/mock-request";
import { getTenantId } from "@/lib/auth-helpers";
import {
  GET as listExperimentsApi,
  POST as createExperimentApi,
} from "@/app/api/marketing/experiments/route";
import { PATCH as updateExperimentApi } from "@/app/api/marketing/experiments/[id]/route";
import { POST as recordExperimentEventApi } from "@/app/api/marketing/experiments/[id]/events/route";
import { resetMarketingExperimentsStoreForTests } from "@/lib/marketing-experiments-store";

const mockGetTenantId = vi.mocked(getTenantId);
const TENANT_ID = "tenant-test-id";

beforeEach(async () => {
  vi.clearAllMocks();
  await resetMarketingExperimentsStoreForTests();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
});

describe("marketing experiments API", () => {
  it("creates and lists experiments", async () => {
    const created = await createExperimentApi(
      createMockRequest("/api/marketing/experiments", {
        method: "POST",
        body: {
          name: "CTA test",
          type: "landing_page",
          targetId: "lp-1",
          goal: "submission",
          variants: [
            { key: "A", name: "Control", trafficPct: 50 },
            { key: "B", name: "Variant", trafficPct: 50 },
          ],
        },
      })
    );

    expect(created.status).toBe(201);

    const listed = await listExperimentsApi(createMockRequest("/api/marketing/experiments"));
    const body = await getResponseBody(listed);

    expect(listed.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.summary.total).toBe(1);
  });

  it("supports lifecycle and events", async () => {
    const created = await createExperimentApi(
      createMockRequest("/api/marketing/experiments", {
        method: "POST",
        body: {
          name: "Email test",
          type: "email_campaign",
          targetId: "camp-1",
          goal: "click",
          variants: [
            { key: "A", name: "Control", trafficPct: 50 },
            { key: "B", name: "Variant", trafficPct: 50 },
          ],
        },
      })
    );
    const createdBody = await getResponseBody(created);
    const id = createdBody.experiment.id;

    const started = await updateExperimentApi(
      createMockRequest(`/api/marketing/experiments/${id}`, {
        method: "PATCH",
        body: { action: "start" },
      }),
      createMockParams({ id })
    );
    expect(started.status).toBe(200);

    const event = await recordExperimentEventApi(
      createMockRequest(`/api/marketing/experiments/${id}/events`, {
        method: "POST",
        body: { eventType: "exposure", variantKey: "A" },
      }),
      createMockParams({ id })
    );
    expect(event.status).toBe(200);

    const completed = await updateExperimentApi(
      createMockRequest(`/api/marketing/experiments/${id}`, {
        method: "PATCH",
        body: { action: "complete" },
      }),
      createMockParams({ id })
    );
    const completedBody = await getResponseBody(completed);

    expect(completed.status).toBe(200);
    expect(completedBody.experiment.status).toBe("completed");
  });

  it("returns 400 when traffic split is invalid", async () => {
    const response = await createExperimentApi(
      createMockRequest("/api/marketing/experiments", {
        method: "POST",
        body: {
          name: "Invalid split",
          type: "landing_page",
          targetId: "lp-2",
          goal: "submission",
          variants: [
            { key: "A", name: "Control", trafficPct: 70 },
            { key: "B", name: "Variant", trafficPct: 20 },
          ],
        },
      })
    );

    expect(response.status).toBe(400);
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));

    const response = await listExperimentsApi(createMockRequest("/api/marketing/experiments"));
    expect(response.status).toBe(401);
  });
});
