import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";

export const quoteApprovalStatusSchema = z.enum([
  "not_requested",
  "pending",
  "approved",
  "rejected",
]);

export const quoteApprovalDecisionSchema = z.enum(["approved", "rejected"]);

export const quoteESignStatusSchema = z.enum([
  "not_sent",
  "sent",
  "viewed",
  "signed",
  "declined",
]);

export const quoteESignEventSchema = z.enum(["sent", "viewed", "signed", "declined"]);

export const quoteActivityActorTypeSchema = z.enum(["buyer", "internal", "system"]);

export const requestQuoteApprovalSchema = z.object({
  note: z.string().max(4000).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const decideQuoteApprovalSchema = z.object({
  decision: quoteApprovalDecisionSchema,
  note: z.string().max(4000).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const recordQuoteESignEventSchema = z.object({
  event: quoteESignEventSchema,
  actorType: quoteActivityActorTypeSchema.optional(),
  actorName: z.string().max(200).optional().nullable(),
  actorEmail: z.string().email().max(320).optional().nullable(),
  note: z.string().max(2000).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  occurredAt: z.string().datetime().optional(),
});

type QuoteCpqActor = {
  id: string | null;
  name: string | null;
  email: string | null;
};

type QuoteBase = {
  id: string;
  tenantId: string;
  status: string;
  approvalStatus: string;
  eSignStatus: string;
  deletedAt: Date | null;
};

function asJson(input: Record<string, unknown> | undefined): Prisma.InputJsonValue {
  return (input || {}) as Prisma.InputJsonValue;
}

async function getQuote(tenantId: string, quoteId: string) {
  return prisma.quote.findFirst({
    where: {
      id: quoteId,
      tenantId,
      deletedAt: null,
    },
    select: {
      id: true,
      tenantId: true,
      status: true,
      approvalStatus: true,
      eSignStatus: true,
      deletedAt: true,
    },
  });
}

function ensureQuote(quote: QuoteBase | null): QuoteBase {
  if (!quote) {
    throw new Error("Quote not found");
  }
  return quote;
}

export async function requestQuoteApproval(
  tenantId: string,
  quoteId: string,
  input: z.infer<typeof requestQuoteApprovalSchema>,
  actor: QuoteCpqActor
) {
  const quote = ensureQuote(await getQuote(tenantId, quoteId));

  if (quote.approvalStatus === "pending") {
    throw new Error("Quote approval already pending");
  }

  const now = new Date();

  const [request, updatedQuote] = await prisma.$transaction([
    prisma.quoteApprovalRequest.create({
      data: {
        tenantId,
        quoteId,
        requestedBy: actor.id,
        requestedAt: now,
        status: "pending",
        note: input.note || null,
        metadata: asJson(input.metadata),
      },
    }),
    prisma.quote.update({
      where: { id: quoteId },
      data: {
        approvalStatus: "pending",
        approvalRequestedAt: now,
        approvalDecidedAt: null,
        approvalDecidedBy: null,
      },
      select: {
        id: true,
        approvalStatus: true,
        approvalRequestedAt: true,
      },
    }),
  ]);

  await prisma.quoteBuyerActivity.create({
    data: {
      tenantId,
      quoteId,
      type: "approval_requested",
      actorType: "internal",
      actorName: actor.name,
      actorEmail: actor.email,
      occurredAt: now,
      metadata: asJson({
        approvalRequestId: request.id,
        note: input.note || null,
      }),
    },
  });

  return {
    quote: {
      id: updatedQuote.id,
      approvalStatus: quoteApprovalStatusSchema.parse(updatedQuote.approvalStatus),
      approvalRequestedAt: updatedQuote.approvalRequestedAt?.toISOString() || null,
    },
    request: {
      id: request.id,
      status: request.status,
      requestedAt: request.requestedAt.toISOString(),
      note: request.note,
    },
  };
}

export async function decideQuoteApproval(
  tenantId: string,
  quoteId: string,
  input: z.infer<typeof decideQuoteApprovalSchema>,
  actor: QuoteCpqActor
) {
  ensureQuote(await getQuote(tenantId, quoteId));

  const pendingRequest = await prisma.quoteApprovalRequest.findFirst({
    where: {
      tenantId,
      quoteId,
      status: "pending",
    },
    orderBy: {
      requestedAt: "desc",
    },
  });

  if (!pendingRequest) {
    throw new Error("No pending quote approval request found");
  }

  const now = new Date();

  const [request, quote] = await prisma.$transaction([
    prisma.quoteApprovalRequest.update({
      where: { id: pendingRequest.id },
      data: {
        status: input.decision,
        decisionBy: actor.id,
        decisionAt: now,
        note: input.note || pendingRequest.note,
        metadata: asJson(input.metadata),
      },
    }),
    prisma.quote.update({
      where: { id: quoteId },
      data: {
        approvalStatus: input.decision,
        approvalDecidedAt: now,
        approvalDecidedBy: actor.id,
        ...(input.decision === "rejected" ? { status: "draft" } : {}),
      },
      select: {
        id: true,
        status: true,
        approvalStatus: true,
        approvalDecidedAt: true,
      },
    }),
  ]);

  await prisma.quoteBuyerActivity.create({
    data: {
      tenantId,
      quoteId,
      type: input.decision === "approved" ? "approval_approved" : "approval_rejected",
      actorType: "internal",
      actorName: actor.name,
      actorEmail: actor.email,
      occurredAt: now,
      metadata: asJson({
        approvalRequestId: request.id,
        decision: input.decision,
        note: input.note || null,
      }),
    },
  });

  return {
    quote: {
      id: quote.id,
      status: quote.status,
      approvalStatus: quoteApprovalStatusSchema.parse(quote.approvalStatus),
      approvalDecidedAt: quote.approvalDecidedAt?.toISOString() || null,
    },
    request: {
      id: request.id,
      status: request.status,
      decisionAt: request.decisionAt?.toISOString() || null,
      note: request.note,
    },
  };
}

export async function recordQuoteESignEvent(
  tenantId: string,
  quoteId: string,
  input: z.infer<typeof recordQuoteESignEventSchema>
) {
  ensureQuote(await getQuote(tenantId, quoteId));

  const occurredAt = input.occurredAt ? new Date(input.occurredAt) : new Date();

  const quotePatch: Prisma.QuoteUpdateInput = {
    eSignStatus: input.event,
    buyerLastActivityAt: occurredAt,
  };

  if (input.event === "sent") {
    quotePatch.eSignSentAt = occurredAt;
  }
  if (input.event === "signed") {
    quotePatch.eSignCompletedAt = occurredAt;
    quotePatch.status = "approved";
    quotePatch.approvedAt = occurredAt;
  }
  if (input.event === "declined") {
    quotePatch.status = "rejected";
  }

  const [activity, quote] = await prisma.$transaction([
    prisma.quoteBuyerActivity.create({
      data: {
        tenantId,
        quoteId,
        type: `esign_${input.event}`,
        actorType: input.actorType || "buyer",
        actorName: input.actorName || null,
        actorEmail: input.actorEmail || null,
        occurredAt,
        metadata: asJson({
          note: input.note || null,
          ...(input.metadata || {}),
        }),
      },
      select: {
        id: true,
        type: true,
        actorType: true,
        actorName: true,
        actorEmail: true,
        occurredAt: true,
      },
    }),
    prisma.quote.update({
      where: { id: quoteId },
      data: quotePatch,
      select: {
        id: true,
        status: true,
        eSignStatus: true,
        eSignSentAt: true,
        eSignCompletedAt: true,
        buyerLastActivityAt: true,
      },
    }),
  ]);

  return {
    quote: {
      id: quote.id,
      status: quote.status,
      eSignStatus: quoteESignStatusSchema.parse(quote.eSignStatus),
      eSignSentAt: quote.eSignSentAt?.toISOString() || null,
      eSignCompletedAt: quote.eSignCompletedAt?.toISOString() || null,
      buyerLastActivityAt: quote.buyerLastActivityAt?.toISOString() || null,
    },
    activity: {
      id: activity.id,
      type: activity.type,
      actorType: activity.actorType,
      actorName: activity.actorName,
      actorEmail: activity.actorEmail,
      occurredAt: activity.occurredAt.toISOString(),
    },
  };
}

export async function listQuoteTimeline(tenantId: string, quoteId: string, take = 100) {
  ensureQuote(await getQuote(tenantId, quoteId));

  const [approvals, activities] = await Promise.all([
    prisma.quoteApprovalRequest.findMany({
      where: {
        tenantId,
        quoteId,
      },
      orderBy: {
        requestedAt: "desc",
      },
      take,
      select: {
        id: true,
        status: true,
        requestedBy: true,
        requestedAt: true,
        decisionBy: true,
        decisionAt: true,
        note: true,
      },
    }),
    prisma.quoteBuyerActivity.findMany({
      where: {
        tenantId,
        quoteId,
      },
      orderBy: {
        occurredAt: "desc",
      },
      take,
      select: {
        id: true,
        type: true,
        actorType: true,
        actorName: true,
        actorEmail: true,
        occurredAt: true,
        metadata: true,
      },
    }),
  ]);

  return {
    approvals: approvals.map((item) => ({
      id: item.id,
      status: item.status,
      requestedBy: item.requestedBy,
      requestedAt: item.requestedAt.toISOString(),
      decisionBy: item.decisionBy,
      decisionAt: item.decisionAt?.toISOString() || null,
      note: item.note,
    })),
    activities: activities.map((item) => ({
      id: item.id,
      type: item.type,
      actorType: item.actorType,
      actorName: item.actorName,
      actorEmail: item.actorEmail,
      occurredAt: item.occurredAt.toISOString(),
      metadata: item.metadata,
    })),
  };
}

export async function resetQuoteCpqStoreForTests() {
  if (process.env.NODE_ENV !== "test") {
    return;
  }

  await prisma.quoteBuyerActivity.deleteMany();
  await prisma.quoteApprovalRequest.deleteMany();
}
