import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";
import {
  GET as getRoutingRules,
  PUT as putRoutingRules,
} from "@/app/api/service/inbox/routing-rules/route";
import { resetServiceRoutingStoreForTests } from "@/lib/service-routing-store";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);
const TENANT_ID = "tenant-test-id";

beforeEach(async () => {
  vi.clearAllMocks();
  await resetServiceRoutingStoreForTests();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
});

describe("service routing rules API", () => {
  it("returns default policy and assignable users", async () => {
    mockPrisma.user.findMany.mockResolvedValue([
      {
        id: "user-1",
        name: "Agent One",
        email: "agent1@example.com",
        role: "member",
      },
    ] as any);

    const response = await getRoutingRules(createMockRequest("/api/service/inbox/routing-rules"));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.policy.priorityRules.urgent.teamId).toBe("general");
    expect(body.users).toHaveLength(1);
  });

  it("updates routing policy", async () => {
    const response = await putRoutingRules(
      createMockRequest("/api/service/inbox/routing-rules", {
        method: "PUT",
        body: {
          policy: {
            teams: [
              { id: "general", name: "General", assigneeIds: ["user-1"] },
              { id: "priority", name: "Priority", assigneeIds: ["user-2"] },
            ],
            businessHours: {
              timezone: "UTC",
              weekdays: [1, 2, 3, 4, 5],
              startHour: 9,
              endHour: 18,
            },
            priorityRules: {
              low: { teamId: "general" },
              medium: { teamId: "general" },
              high: { teamId: "priority" },
              urgent: { teamId: "priority" },
            },
            channelRules: {
              email: { teamId: null },
              phone: { teamId: null },
              web: { teamId: null },
              chat: { teamId: null },
            },
            offHoursTeamId: "general",
            fallbackAssigneeId: "user-1",
          },
        },
      })
    );

    const body = await getResponseBody(response);
    expect(response.status).toBe(200);
    expect(body.policy.priorityRules.high.teamId).toBe("priority");
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "updated",
          entity: "service_routing_policy",
          entityId: TENANT_ID,
        }),
      })
    );
  });

  it("returns 400 for invalid policy", async () => {
    const response = await putRoutingRules(
      createMockRequest("/api/service/inbox/routing-rules", {
        method: "PUT",
        body: {
          policy: {
            teams: [],
            businessHours: {
              timezone: "UTC",
              weekdays: [1],
              startHour: 22,
              endHour: 9,
            },
            priorityRules: {
              low: { teamId: null },
              medium: { teamId: null },
              high: { teamId: null },
              urgent: { teamId: null },
            },
            channelRules: {
              email: { teamId: null },
              phone: { teamId: null },
              web: { teamId: null },
              chat: { teamId: null },
            },
          },
        },
      })
    );

    expect(response.status).toBe(400);
  });
});
