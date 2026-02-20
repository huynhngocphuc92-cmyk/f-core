import { beforeEach, describe, expect, it } from "vitest";
import {
  resolveTicketAssignment,
  resetServiceRoutingStoreForTests,
  setServiceRoutingPolicy,
  isInRoutingBusinessHours,
} from "@/lib/service-routing-store";

const TENANT_ID = "tenant-test-id";

beforeEach(async () => {
  await resetServiceRoutingStoreForTests();
});

describe("service routing store", () => {
  it("routes by priority team with round robin", async () => {
    await setServiceRoutingPolicy(TENANT_ID, {
      teams: [
        { id: "p1", name: "P1 Team", assigneeIds: ["u1", "u2"] },
      ],
      businessHours: { timezone: "UTC", weekdays: [1, 2, 3, 4, 5], startHour: 0, endHour: 24 },
      priorityRules: {
        low: { teamId: "p1" },
        medium: { teamId: "p1" },
        high: { teamId: "p1" },
        urgent: { teamId: "p1" },
      },
      channelRules: {
        email: { teamId: null },
        phone: { teamId: null },
        web: { teamId: null },
        chat: { teamId: null },
      },
      offHoursTeamId: null,
      fallbackAssigneeId: null,
    });

    const users = [{ id: "u1" }, { id: "u2" }];

    const first = await resolveTicketAssignment({
      tenantId: TENANT_ID,
      priority: "urgent",
      source: "web",
      users,
      createdAt: new Date("2026-02-13T10:00:00.000Z"),
    });

    const second = await resolveTicketAssignment({
      tenantId: TENANT_ID,
      priority: "urgent",
      source: "web",
      users,
      createdAt: new Date("2026-02-13T10:05:00.000Z"),
    });

    expect(first.assigneeId).toBe("u1");
    expect(second.assigneeId).toBe("u2");
    expect(first.reason).toBe("priority");
  });

  it("routes to off-hours team outside business hours", async () => {
    await setServiceRoutingPolicy(TENANT_ID, {
      teams: [
        { id: "day", name: "Day Team", assigneeIds: ["u1"] },
        { id: "night", name: "Night Team", assigneeIds: ["u9"] },
      ],
      businessHours: { timezone: "UTC", weekdays: [1, 2, 3, 4, 5], startHour: 9, endHour: 18 },
      priorityRules: {
        low: { teamId: "day" },
        medium: { teamId: "day" },
        high: { teamId: "day" },
        urgent: { teamId: "day" },
      },
      channelRules: {
        email: { teamId: null },
        phone: { teamId: null },
        web: { teamId: null },
        chat: { teamId: null },
      },
      offHoursTeamId: "night",
      fallbackAssigneeId: null,
    });

    const result = await resolveTicketAssignment({
      tenantId: TENANT_ID,
      priority: "high",
      source: "email",
      users: [{ id: "u1" }, { id: "u9" }],
      createdAt: new Date("2026-02-14T02:00:00.000Z"),
    });

    expect(result.assigneeId).toBe("u9");
    expect(result.reason).toBe("off_hours");
    expect(result.inBusinessHours).toBe(false);
  });

  it("uses fallback assignee when team has no users", async () => {
    await setServiceRoutingPolicy(TENANT_ID, {
      teams: [{ id: "empty", name: "Empty", assigneeIds: [] }],
      businessHours: { timezone: "UTC", weekdays: [1, 2, 3, 4, 5], startHour: 0, endHour: 24 },
      priorityRules: {
        low: { teamId: "empty" },
        medium: { teamId: "empty" },
        high: { teamId: "empty" },
        urgent: { teamId: "empty" },
      },
      channelRules: {
        email: { teamId: null },
        phone: { teamId: null },
        web: { teamId: null },
        chat: { teamId: null },
      },
      offHoursTeamId: null,
      fallbackAssigneeId: "u42",
    });

    const result = await resolveTicketAssignment({
      tenantId: TENANT_ID,
      priority: "low",
      users: [{ id: "u42" }],
    });

    expect(result.assigneeId).toBe("u42");
    expect(result.reason).toBe("fallback");
  });

  it("computes business-hours boundaries", () => {
    const policy = {
      teams: [{ id: "general", name: "General", assigneeIds: [] }],
      businessHours: { timezone: "UTC", weekdays: [1], startHour: 9, endHour: 18 },
      priorityRules: {
        low: { teamId: "general" },
        medium: { teamId: "general" },
        high: { teamId: "general" },
        urgent: { teamId: "general" },
      },
      channelRules: {
        email: { teamId: null },
        phone: { teamId: null },
        web: { teamId: null },
        chat: { teamId: null },
      },
      offHoursTeamId: null,
      fallbackAssigneeId: null,
    } as const;

    expect(isInRoutingBusinessHours(policy as any, new Date("2026-02-16T09:00:00.000Z"))).toBe(true);
    expect(isInRoutingBusinessHours(policy as any, new Date("2026-02-16T18:00:00.000Z"))).toBe(false);
  });
});
