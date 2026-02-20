import { beforeEach, describe, expect, it, vi } from "vitest";
import prisma from "@/lib/prisma";
import { checkPermission, getCurrentUser, getTenantId } from "@/lib/auth-helpers";
import {
  createMockParams,
  createMockRequest,
  getResponseBody,
} from "../helpers/mock-request";
import { POST as requestApproval } from "@/app/api/quotes/[id]/approval/request/route";
import { POST as decideApproval } from "@/app/api/quotes/[id]/approval/decision/route";
import { POST as recordESignEvent } from "@/app/api/quotes/[id]/esign/events/route";
import { GET as getTimeline } from "@/app/api/quotes/[id]/timeline/route";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);
const mockGetCurrentUser = vi.mocked(getCurrentUser);
const mockCheckPermission = vi.mocked(checkPermission);

const TENANT_ID = "tenant-test-id";
const QUOTE_ID = "quote-1";

beforeEach(() => {
  vi.clearAllMocks();
  mockCheckPermission.mockResolvedValue(true);
  mockGetTenantId.mockResolvedValue(TENANT_ID);
  mockGetCurrentUser.mockResolvedValue({
    id: "user-1",
    email: "owner@example.com",
    name: "Owner",
  } as never);

  mockPrisma.quote.findFirst.mockResolvedValue({
    id: QUOTE_ID,
    tenantId: TENANT_ID,
    status: "draft",
    approvalStatus: "not_requested",
    eSignStatus: "not_sent",
    deletedAt: null,
  } as never);
});

describe("quote cpq APIs", () => {
  it("requests quote approval", async () => {
    mockPrisma.quoteApprovalRequest.create.mockResolvedValue({
      id: "approval-1",
      status: "pending",
      requestedAt: new Date("2026-02-16T10:00:00.000Z"),
      note: "Please review",
    } as never);

    mockPrisma.quote.update.mockResolvedValue({
      id: QUOTE_ID,
      approvalStatus: "pending",
      approvalRequestedAt: new Date("2026-02-16T10:00:00.000Z"),
    } as never);

    mockPrisma.quoteBuyerActivity.create.mockResolvedValue({ id: "activity-1" } as never);

    const response = await requestApproval(
      createMockRequest(`/api/quotes/${QUOTE_ID}/approval/request`, {
        method: "POST",
        body: { note: "Please review" },
      }),
      createMockParams({ id: QUOTE_ID })
    );

    const body = await getResponseBody(response);
    expect(response.status).toBe(201);
    expect(body.data.quote.approvalStatus).toBe("pending");
    expect(mockCheckPermission).toHaveBeenCalledWith("crm.write", expect.anything());
    expect(mockPrisma.quoteApprovalRequest.create).toHaveBeenCalled();
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "updated",
          entity: "quote",
          entityId: QUOTE_ID,
          metadata: expect.objectContaining({
            cpq: "approval_requested",
            approvalStatus: "pending",
          }),
        }),
      })
    );
  });

  it("approves pending quote approval request", async () => {
    mockPrisma.quote.findFirst.mockResolvedValue({
      id: QUOTE_ID,
      tenantId: TENANT_ID,
      status: "pending",
      approvalStatus: "pending",
      eSignStatus: "sent",
      deletedAt: null,
    } as never);

    mockPrisma.quoteApprovalRequest.findFirst.mockResolvedValue({
      id: "approval-1",
      tenantId: TENANT_ID,
      quoteId: QUOTE_ID,
      status: "pending",
      requestedAt: new Date("2026-02-16T10:00:00.000Z"),
      note: null,
    } as never);

    mockPrisma.quoteApprovalRequest.update.mockResolvedValue({
      id: "approval-1",
      status: "approved",
      decisionAt: new Date("2026-02-16T11:00:00.000Z"),
      note: "Looks good",
    } as never);

    mockPrisma.quote.update.mockResolvedValue({
      id: QUOTE_ID,
      status: "pending",
      approvalStatus: "approved",
      approvalDecidedAt: new Date("2026-02-16T11:00:00.000Z"),
    } as never);

    mockPrisma.quoteBuyerActivity.create.mockResolvedValue({ id: "activity-1" } as never);

    const response = await decideApproval(
      createMockRequest(`/api/quotes/${QUOTE_ID}/approval/decision`, {
        method: "POST",
        body: { decision: "approved", note: "Looks good" },
      }),
      createMockParams({ id: QUOTE_ID })
    );

    const body = await getResponseBody(response);
    expect(response.status).toBe(200);
    expect(body.data.quote.approvalStatus).toBe("approved");
    expect(mockCheckPermission).toHaveBeenCalledWith("crm.write", expect.anything());
    expect(mockPrisma.quoteApprovalRequest.update).toHaveBeenCalled();
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "updated",
          entity: "quote",
          entityId: QUOTE_ID,
          metadata: expect.objectContaining({
            cpq: "approval_decision",
            decision: "approved",
            approvalStatus: "approved",
          }),
        }),
      })
    );
  });

  it("records e-sign signed event", async () => {
    mockPrisma.quoteBuyerActivity.create.mockResolvedValue({
      id: "activity-1",
      type: "esign_signed",
      actorType: "buyer",
      actorName: "Signer",
      actorEmail: null,
      occurredAt: new Date("2026-02-16T12:00:00.000Z"),
    } as never);

    mockPrisma.quote.update.mockResolvedValue({
      id: QUOTE_ID,
      status: "approved",
      eSignStatus: "signed",
      eSignSentAt: new Date("2026-02-16T11:00:00.000Z"),
      eSignCompletedAt: new Date("2026-02-16T12:00:00.000Z"),
      buyerLastActivityAt: new Date("2026-02-16T12:00:00.000Z"),
    } as never);

    const response = await recordESignEvent(
      createMockRequest(`/api/quotes/${QUOTE_ID}/esign/events`, {
        method: "POST",
        body: {
          event: "signed",
          actorType: "buyer",
          actorName: "Signer",
        },
      }),
      createMockParams({ id: QUOTE_ID })
    );

    const body = await getResponseBody(response);
    expect(response.status).toBe(200);
    expect(body.data.quote.eSignStatus).toBe("signed");
    expect(body.data.quote.status).toBe("approved");
    expect(mockCheckPermission).toHaveBeenCalledWith("crm.write", expect.anything());
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "updated",
          entity: "quote",
          entityId: QUOTE_ID,
          metadata: expect.objectContaining({
            cpq: "esign_event",
            event: "signed",
            eSignStatus: "signed",
          }),
        }),
      })
    );
  });

  it("returns timeline data", async () => {
    mockPrisma.quoteApprovalRequest.findMany.mockResolvedValue([
      {
        id: "approval-1",
        status: "approved",
        requestedBy: "user-1",
        requestedAt: new Date("2026-02-16T10:00:00.000Z"),
        decisionBy: "user-2",
        decisionAt: new Date("2026-02-16T11:00:00.000Z"),
        note: "Approved",
      },
    ] as never);

    mockPrisma.quoteBuyerActivity.findMany.mockResolvedValue([
      {
        id: "activity-1",
        type: "esign_viewed",
        actorType: "buyer",
        actorName: "Signer",
        actorEmail: "signer@example.com",
        occurredAt: new Date("2026-02-16T11:30:00.000Z"),
        metadata: {},
      },
    ] as never);

    const response = await getTimeline(
      createMockRequest(`/api/quotes/${QUOTE_ID}/timeline`),
      createMockParams({ id: QUOTE_ID })
    );

    const body = await getResponseBody(response);
    expect(response.status).toBe(200);
    expect(body.data.approvals.length).toBe(1);
    expect(body.data.activities.length).toBe(1);
    expect(mockCheckPermission).toHaveBeenCalledWith("crm.read", expect.anything());
  });

  it("returns 401 when unauthenticated", async () => {
    mockCheckPermission.mockResolvedValue(true);
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));

    const response = await requestApproval(
      createMockRequest(`/api/quotes/${QUOTE_ID}/approval/request`, {
        method: "POST",
        body: { note: "test" },
      }),
      createMockParams({ id: QUOTE_ID })
    );

    expect(response.status).toBe(401);
  });

  it("returns 403 when missing crm.write permission for request approval", async () => {
    mockCheckPermission.mockRejectedValueOnce(
      new Error("Forbidden: Missing permission crm.write")
    );

    const response = await requestApproval(
      createMockRequest(`/api/quotes/${QUOTE_ID}/approval/request`, {
        method: "POST",
        body: { note: "test" },
      }),
      createMockParams({ id: QUOTE_ID })
    );

    const body = await getResponseBody(response);
    expect(response.status).toBe(403);
    expect(body.error).toMatch(/missing permission/i);
    expect(mockPrisma.quoteApprovalRequest.create).not.toHaveBeenCalled();
  });

  it("returns 403 when missing crm.write permission for approval decision", async () => {
    mockCheckPermission.mockRejectedValueOnce(
      new Error("Forbidden: Missing permission crm.write")
    );

    const response = await decideApproval(
      createMockRequest(`/api/quotes/${QUOTE_ID}/approval/decision`, {
        method: "POST",
        body: { decision: "approved" },
      }),
      createMockParams({ id: QUOTE_ID })
    );

    const body = await getResponseBody(response);
    expect(response.status).toBe(403);
    expect(body.error).toMatch(/missing permission/i);
    expect(mockPrisma.quoteApprovalRequest.update).not.toHaveBeenCalled();
  });

  it("returns 403 when missing crm.write permission for e-sign events", async () => {
    mockCheckPermission.mockRejectedValueOnce(
      new Error("Forbidden: Missing permission crm.write")
    );

    const response = await recordESignEvent(
      createMockRequest(`/api/quotes/${QUOTE_ID}/esign/events`, {
        method: "POST",
        body: {
          event: "sent",
          actorType: "internal",
          actorName: "Ops",
        },
      }),
      createMockParams({ id: QUOTE_ID })
    );

    const body = await getResponseBody(response);
    expect(response.status).toBe(403);
    expect(body.error).toMatch(/missing permission/i);
    expect(mockPrisma.quoteBuyerActivity.create).not.toHaveBeenCalled();
  });

  it("returns 403 when missing crm.read permission for timeline", async () => {
    mockCheckPermission.mockRejectedValueOnce(
      new Error("Forbidden: Missing permission crm.read")
    );

    const response = await getTimeline(
      createMockRequest(`/api/quotes/${QUOTE_ID}/timeline`),
      createMockParams({ id: QUOTE_ID })
    );

    const body = await getResponseBody(response);
    expect(response.status).toBe(403);
    expect(body.error).toMatch(/missing permission/i);
    expect(mockPrisma.quoteApprovalRequest.findMany).not.toHaveBeenCalled();
    expect(mockPrisma.quoteBuyerActivity.findMany).not.toHaveBeenCalled();
  });
});
