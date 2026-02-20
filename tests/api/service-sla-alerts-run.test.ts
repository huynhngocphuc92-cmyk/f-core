import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";
import { resetSlaPolicyStoreForTests } from "@/lib/sla-policy-store";
import { POST as runSlaAlerts } from "@/app/api/service/sla/alerts/run/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);
const TENANT_ID = "tenant-test-id";

beforeEach(async () => {
  vi.clearAllMocks();
  await resetSlaPolicyStoreForTests();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
});

describe("POST /api/service/sla/alerts/run", () => {
  it("creates alerts for breached tickets", async () => {
    mockPrisma.ticket.findMany.mockResolvedValue([
      {
        id: "ticket-1",
        subject: "Critical issue",
        status: "open",
        priority: "urgent",
        createdAt: new Date("2026-02-14T00:00:00.000Z"),
        dueDate: new Date("2026-02-14T04:00:00.000Z"),
        firstResponseAt: null,
        assignee: { id: "agent-1", name: "Agent One" },
      },
    ] as any);
    mockPrisma.user.findMany.mockResolvedValue([
      { id: "admin-1" },
    ] as any);
    mockPrisma.notification.findFirst.mockResolvedValue(null);
    mockPrisma.notification.create.mockResolvedValue({ id: "notif-1" } as any);

    const response = await runSlaAlerts(
      createMockRequest("/api/service/sla/alerts/run", { method: "POST" })
    );
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.targetTicketCount).toBe(1);
    expect(body.notificationsCreated).toBe(2);
    expect(mockPrisma.notification.create).toHaveBeenCalledTimes(2);
  });

  it("does not duplicate alerts within cooldown window", async () => {
    mockPrisma.ticket.findMany.mockResolvedValue([
      {
        id: "ticket-2",
        subject: "At risk issue",
        status: "open",
        priority: "high",
        createdAt: new Date(),
        dueDate: new Date(Date.now() + 30 * 60 * 1000),
        firstResponseAt: new Date(),
        assignee: { id: "agent-2", name: "Agent Two" },
      },
    ] as any);
    mockPrisma.user.findMany.mockResolvedValue([{ id: "admin-2" }] as any);
    mockPrisma.notification.findFirst.mockResolvedValue({
      id: "existing-notification",
    } as any);

    const response = await runSlaAlerts(
      createMockRequest("/api/service/sla/alerts/run", { method: "POST" })
    );
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.notificationsCreated).toBe(0);
    expect(mockPrisma.notification.create).not.toHaveBeenCalled();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));

    const response = await runSlaAlerts(
      createMockRequest("/api/service/sla/alerts/run", { method: "POST" })
    );

    expect(response.status).toBe(401);
  });
});
