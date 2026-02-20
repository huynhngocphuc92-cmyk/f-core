import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockParams, createMockRequest, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";
import { GET as getPlaybooks, POST as startPlaybook } from "@/app/api/sales/playbooks/route";
import { PATCH as updatePlaybookStep } from "@/app/api/sales/playbooks/[runId]/steps/[stepId]/route";
import { resetSalesPlaybookStoreForTests } from "@/lib/sales-playbook-store";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);
const TENANT_ID = "tenant-test-id";

beforeEach(async () => {
  vi.clearAllMocks();
  await resetSalesPlaybookStoreForTests();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
});

describe("sales playbooks API", () => {
  it("returns deal options, templates, and recommendation", async () => {
    mockPrisma.deal.findMany.mockResolvedValue([
      {
        id: "deal-1",
        name: "Enterprise ACME",
        amount: 24000,
        closeDate: new Date("2026-03-20T00:00:00.000Z"),
        stage: { name: "Contract Sent" },
      },
    ] as any);

    const response = await getPlaybooks(
      createMockRequest("/api/sales/playbooks", {
        searchParams: { dealId: "deal-1" },
      })
    );
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.deals).toHaveLength(1);
    expect(body.templates.length).toBeGreaterThan(0);
    expect(body.recommendation?.templateId).toBeTruthy();
  });

  it("starts a playbook run", async () => {
    mockPrisma.deal.findFirst.mockResolvedValue({
      id: "deal-1",
      name: "Enterprise ACME",
    } as any);

    const response = await startPlaybook(
      createMockRequest("/api/sales/playbooks", {
        method: "POST",
        body: {
          dealId: "deal-1",
          templateId: "discovery-qualification",
        },
      })
    );
    const body = await getResponseBody(response);

    expect(response.status).toBe(201);
    expect(body.run.dealId).toBe("deal-1");
    expect(body.run.templateId).toBe("discovery-qualification");
    expect(body.run.totalSteps).toBeGreaterThan(0);
  });

  it("updates a run step", async () => {
    mockPrisma.deal.findFirst.mockResolvedValue({
      id: "deal-1",
      name: "Enterprise ACME",
    } as any);

    const started = await startPlaybook(
      createMockRequest("/api/sales/playbooks", {
        method: "POST",
        body: {
          dealId: "deal-1",
          templateId: "proposal-negotiation",
        },
      })
    );
    const startedBody = await getResponseBody(started);

    const runId = startedBody.run.id;
    const stepId = startedBody.run.steps[0].id;

    const response = await updatePlaybookStep(
      createMockRequest(`/api/sales/playbooks/${runId}/steps/${stepId}`, {
        method: "PATCH",
        body: { completed: true },
      }),
      createMockParams({ runId, stepId })
    );

    const body = await getResponseBody(response);
    expect(response.status).toBe(200);
    expect(body.run.steps[0].completed).toBe(true);
  });

  it("returns 401 when not authenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));

    const response = await getPlaybooks(createMockRequest("/api/sales/playbooks"));
    expect(response.status).toBe(401);
  });
});
