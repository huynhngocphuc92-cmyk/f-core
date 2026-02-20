import { randomUUID } from "crypto";
import { z } from "zod";
import prisma from "@/lib/prisma";

export const contentSpaceSchema = z.enum(["blog_post", "landing_page"]);

export const approvalPolicySchema = z.object({
  space: contentSpaceSchema,
  enabled: z.boolean(),
  requiredApprovals: z.number().int().min(1).max(3).default(1),
});

export const createApprovalRequestSchema = z.object({
  space: contentSpaceSchema,
  assetId: z.string().min(1),
  assetTitle: z.string().min(1).max(220),
  assetUpdatedAt: z.string().datetime(),
  requestedBy: z.string().min(1),
  note: z.string().max(1000).optional(),
});

export const decisionApprovalRequestSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  note: z.string().max(1000).optional(),
});

export type ContentSpace = z.infer<typeof contentSpaceSchema>;

export type ApprovalPolicy = {
  tenantId: string;
  space: ContentSpace;
  enabled: boolean;
  requiredApprovals: number;
  updatedAt: string;
};

export type ApprovalRequest = {
  id: string;
  tenantId: string;
  space: ContentSpace;
  assetId: string;
  assetTitle: string;
  assetUpdatedAt: string;
  status: "pending" | "approved" | "rejected";
  requestedBy: string;
  reviewerId: string | null;
  decisionNote: string | null;
  requestNote: string | null;
  requestedAt: string;
  decidedAt: string | null;
  updatedAt: string;
};

function nowIso() {
  return new Date().toISOString();
}

function defaultPolicy(tenantId: string, space: ContentSpace): ApprovalPolicy {
  return {
    tenantId,
    space,
    enabled: false,
    requiredApprovals: 1,
    updatedAt: nowIso(),
  };
}

function normalizePolicy(record: {
  tenantId: string;
  space: string;
  enabled: boolean;
  requiredApprovals: number;
  updatedAt: Date;
}): ApprovalPolicy {
  return {
    tenantId: record.tenantId,
    space: contentSpaceSchema.parse(record.space),
    enabled: record.enabled,
    requiredApprovals: record.requiredApprovals,
    updatedAt: record.updatedAt.toISOString(),
  };
}

function normalizeRequest(record: {
  id: string;
  tenantId: string;
  space: string;
  assetId: string;
  assetTitle: string;
  assetUpdatedAt: Date;
  status: string;
  requestedBy: string;
  reviewerId: string | null;
  decisionNote: string | null;
  requestNote: string | null;
  requestedAt: Date;
  decidedAt: Date | null;
  updatedAt: Date;
}): ApprovalRequest {
  return {
    id: record.id,
    tenantId: record.tenantId,
    space: contentSpaceSchema.parse(record.space),
    assetId: record.assetId,
    assetTitle: record.assetTitle,
    assetUpdatedAt: record.assetUpdatedAt.toISOString(),
    status: record.status === "approved" ? "approved" : record.status === "rejected" ? "rejected" : "pending",
    requestedBy: record.requestedBy,
    reviewerId: record.reviewerId,
    decisionNote: record.decisionNote,
    requestNote: record.requestNote,
    requestedAt: record.requestedAt.toISOString(),
    decidedAt: record.decidedAt?.toISOString() || null,
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function listApprovalPolicies(tenantId: string): Promise<ApprovalPolicy[]> {
  const rows = await prisma.contentApprovalPolicy.findMany({
    where: { tenantId },
  });
  const bySpace = new Map(rows.map((row) => [contentSpaceSchema.parse(row.space), normalizePolicy(row)]));
  return contentSpaceSchema.options.map((space) => bySpace.get(space) || defaultPolicy(tenantId, space));
}

export async function getApprovalPolicy(tenantId: string, space: ContentSpace): Promise<ApprovalPolicy> {
  const row = await prisma.contentApprovalPolicy.findFirst({
    where: {
      tenantId,
      space,
    },
  });
  return row ? normalizePolicy(row) : defaultPolicy(tenantId, space);
}

export async function upsertApprovalPolicy(
  tenantId: string,
  payload: z.infer<typeof approvalPolicySchema>
): Promise<ApprovalPolicy> {
  const existing = await prisma.contentApprovalPolicy.findFirst({
    where: {
      tenantId,
      space: payload.space,
    },
  });

  const policy = existing
    ? await prisma.contentApprovalPolicy.update({
        where: { id: existing.id },
        data: {
          enabled: payload.enabled,
          requiredApprovals: payload.requiredApprovals,
        },
      })
    : await prisma.contentApprovalPolicy.create({
        data: {
          tenantId,
          space: payload.space,
          enabled: payload.enabled,
          requiredApprovals: payload.requiredApprovals,
        },
      });

  return normalizePolicy(policy);
}

export async function listApprovalRequests(
  tenantId: string,
  filters?: {
    space?: ContentSpace;
    status?: ApprovalRequest["status"];
    assetId?: string;
  }
): Promise<ApprovalRequest[]> {
  const rows = await prisma.contentApprovalRequest.findMany({
    where: {
      tenantId,
      space: filters?.space,
      status: filters?.status,
      assetId: filters?.assetId,
    },
    orderBy: { updatedAt: "desc" },
  });

  return rows.map(normalizeRequest);
}

export async function createApprovalRequest(
  tenantId: string,
  payload: z.infer<typeof createApprovalRequestSchema>
): Promise<ApprovalRequest> {
  const now = nowIso();
  const existing = await prisma.contentApprovalRequest.findFirst({
    where: {
      tenantId,
      space: payload.space,
      assetId: payload.assetId,
      status: "pending",
    },
  });

  if (existing) {
    const updated = await prisma.contentApprovalRequest.update({
      where: { id: existing.id },
      data: {
        assetTitle: payload.assetTitle,
        assetUpdatedAt: new Date(payload.assetUpdatedAt),
        requestedBy: payload.requestedBy,
        requestNote: payload.note || null,
        requestedAt: new Date(now),
        updatedAt: new Date(now),
        reviewerId: null,
        decisionNote: null,
        decidedAt: null,
        status: "pending",
      },
    });
    return normalizeRequest(updated);
  }

  const created = await prisma.contentApprovalRequest.create({
    data: {
      id: randomUUID(),
      tenantId,
      space: payload.space,
      assetId: payload.assetId,
      assetTitle: payload.assetTitle,
      assetUpdatedAt: new Date(payload.assetUpdatedAt),
      status: "pending",
      requestedBy: payload.requestedBy,
      reviewerId: null,
      decisionNote: null,
      requestNote: payload.note || null,
      requestedAt: new Date(now),
      decidedAt: null,
      updatedAt: new Date(now),
    },
  });
  return normalizeRequest(created);
}

export async function decideApprovalRequest(
  tenantId: string,
  requestId: string,
  reviewerId: string,
  payload: z.infer<typeof decisionApprovalRequestSchema>
): Promise<ApprovalRequest> {
  const request = await prisma.contentApprovalRequest.findFirst({
    where: {
      tenantId,
      id: requestId,
    },
  });

  if (!request) {
    throw new Error("Approval request not found");
  }
  if (request.status !== "pending") {
    throw new Error("Only pending approval requests can be decided");
  }
  if (request.requestedBy === reviewerId) {
    throw new Error("Requester cannot approve their own content");
  }

  const now = nowIso();
  const updated = await prisma.contentApprovalRequest.update({
    where: { id: request.id },
    data: {
      status: payload.decision,
      reviewerId,
      decisionNote: payload.note || null,
      decidedAt: new Date(now),
      updatedAt: new Date(now),
    },
  });
  return normalizeRequest(updated);
}

export async function getApprovalEligibility(
  tenantId: string,
  space: ContentSpace,
  assetId: string,
  _assetUpdatedAt: string
) {
  const policy = await getApprovalPolicy(tenantId, space);
  if (!policy.enabled) {
    return {
      canPublish: true,
      reason: "Approval policy disabled",
      policy,
      request: null as ApprovalRequest | null,
    };
  }

  const requests = await listApprovalRequests(tenantId, { space, assetId });
  const approved = requests.find((item) => item.status === "approved");

  if (approved) {
    return {
      canPublish: true,
      reason: "Approved",
      policy,
      request: approved,
    };
  }

  const pending = requests.find((item) => item.status === "pending");
  return {
    canPublish: false,
    reason: pending ? "Approval request is still pending" : "Approval required before publish",
    policy,
    request: pending || null,
  };
}

export async function resetContentApprovalStoreForTests() {
  if (process.env.NODE_ENV !== "test") return;
  await prisma.contentApprovalRequest.deleteMany();
  await prisma.contentApprovalPolicy.deleteMany();
}
