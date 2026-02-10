import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";

import { GET as listAuditLogs } from "@/app/api/audit-logs/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);

const TENANT_ID = "tenant-test-id";

const sampleLog = {
  id: "log-1",
  tenantId: TENANT_ID,
  userId: "user-test-id",
  user: { id: "user-test-id", name: "Test User", email: "test@example.com" },
  action: "create",
  entity: "contact",
  entityId: "contact-1",
  entityName: "John Doe",
  changes: {},
  ipAddress: "127.0.0.1",
  userAgent: "Mozilla/5.0",
  createdAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
});

describe("GET /api/audit-logs", () => {
  it("should return paginated audit logs", async () => {
    mockPrisma.auditLog.findMany.mockResolvedValue([sampleLog]);
    mockPrisma.auditLog.count.mockResolvedValue(1);

    const request = createMockRequest("/api/audit-logs");
    const response = await listAuditLogs(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].action).toBe("create");
  });

  it("should filter by entity", async () => {
    mockPrisma.auditLog.findMany.mockResolvedValue([]);
    mockPrisma.auditLog.count.mockResolvedValue(0);

    const request = createMockRequest("/api/audit-logs", {
      searchParams: { entity: "contact" },
    });
    await listAuditLogs(request);

    const findManyCall = mockPrisma.auditLog.findMany.mock.calls[0][0];
    expect(findManyCall?.where).toMatchObject({
      tenantId: TENANT_ID,
      entity: "contact",
    });
  });

  it("should filter by action", async () => {
    mockPrisma.auditLog.findMany.mockResolvedValue([]);
    mockPrisma.auditLog.count.mockResolvedValue(0);

    const request = createMockRequest("/api/audit-logs", {
      searchParams: { action: "delete" },
    });
    await listAuditLogs(request);

    const findManyCall = mockPrisma.auditLog.findMany.mock.calls[0][0];
    expect(findManyCall?.where).toMatchObject({
      tenantId: TENANT_ID,
      action: "delete",
    });
  });

  it("should filter by search", async () => {
    mockPrisma.auditLog.findMany.mockResolvedValue([]);
    mockPrisma.auditLog.count.mockResolvedValue(0);

    const request = createMockRequest("/api/audit-logs", {
      searchParams: { search: "john" },
    });
    await listAuditLogs(request);

    const findManyCall = mockPrisma.auditLog.findMany.mock.calls[0][0];
    expect(findManyCall?.where).toMatchObject({
      tenantId: TENANT_ID,
      OR: expect.arrayContaining([
        expect.objectContaining({
          entityName: { contains: "john", mode: "insensitive" },
        }),
      ]),
    });
  });

  it("should not filter when entity is 'all'", async () => {
    mockPrisma.auditLog.findMany.mockResolvedValue([]);
    mockPrisma.auditLog.count.mockResolvedValue(0);

    const request = createMockRequest("/api/audit-logs", {
      searchParams: { entity: "all" },
    });
    await listAuditLogs(request);

    const findManyCall = mockPrisma.auditLog.findMany.mock.calls[0][0];
    expect(findManyCall?.where).not.toHaveProperty("entity");
  });

  it("should return 401 when not authenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));

    const request = createMockRequest("/api/audit-logs");
    const response = await listAuditLogs(request);

    expect(response.status).toBe(401);
  });
});
