import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";
import { GET as getServiceSla } from "@/app/api/service/sla/route";
import { resetSlaPolicyStoreForTests, setSlaPolicy } from "@/lib/sla-policy-store";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);

const TENANT_ID = "tenant-test-id";

beforeEach(async () => {
  vi.clearAllMocks();
  await resetSlaPolicyStoreForTests();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
});

describe("GET /api/service/sla", () => {
  it("returns SLA summary with breach and at-risk counts", async () => {
    mockPrisma.ticket.findMany.mockResolvedValue([
      {
        id: "t-1",
        subject: "Urgent ticket",
        status: "open",
        priority: "urgent",
        createdAt: new Date("2026-02-14T00:00:00.000Z"),
        dueDate: new Date("2026-02-14T04:00:00.000Z"),
        firstResponseAt: null,
        assignee: null,
      },
      {
        id: "t-2",
        subject: "New medium ticket",
        status: "open",
        priority: "medium",
        createdAt: new Date(),
        dueDate: null,
        firstResponseAt: null,
        assignee: null,
      },
    ] as any);

    const response = await getServiceSla(createMockRequest("/api/service/sla"));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.summary.openTickets).toBe(2);
    expect(body.policies.urgent).toEqual({
      firstResponseMinutes: 15,
      resolutionHours: 4,
    });
    expect(body.tickets.length).toBeGreaterThan(0);
    expect(body.tickets[0].sla).toBeDefined();
  });

  it("applies limit query param", async () => {
    mockPrisma.ticket.findMany.mockResolvedValue(
      Array.from({ length: 5 }).map((_, index) => ({
        id: `t-${index}`,
        subject: `Ticket ${index}`,
        status: "open",
        priority: "medium",
        createdAt: new Date(),
        dueDate: null,
        firstResponseAt: null,
        assignee: null,
      })) as any
    );

    const response = await getServiceSla(
      createMockRequest("/api/service/sla", {
        searchParams: { limit: "2" },
      })
    );
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.tickets).toHaveLength(2);
  });

  it("uses tenant custom policy for SLA calculations", async () => {
    await setSlaPolicy(TENANT_ID, {
      low: { firstResponseMinutes: 30, resolutionHours: 2 },
      medium: { firstResponseMinutes: 20, resolutionHours: 2 },
      high: { firstResponseMinutes: 10, resolutionHours: 1 },
      urgent: { firstResponseMinutes: 5, resolutionHours: 1 },
    });

    mockPrisma.ticket.findMany.mockResolvedValue([
      {
        id: "t-1",
        subject: "Policy test ticket",
        status: "open",
        priority: "urgent",
        createdAt: new Date("2026-02-14T00:00:00.000Z"),
        dueDate: null,
        firstResponseAt: null,
        assignee: null,
      },
    ] as any);

    const response = await getServiceSla(createMockRequest("/api/service/sla"));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.policies.urgent.resolutionHours).toBe(1);
    expect(body.tickets[0].sla.targets.resolutionHours).toBe(1);
  });

  it("returns 401 when not authenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));

    const response = await getServiceSla(createMockRequest("/api/service/sla"));
    expect(response.status).toBe(401);
  });
});
