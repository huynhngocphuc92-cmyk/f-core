import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";
import { ApiError, handleApiError } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit-helpers";
import {
  buildSalesDocumentSummary,
  createSalesDocumentEventSchema,
  getSalesDocumentEventLabel,
  getSalesDocumentEventTypeFromMetadata,
} from "@/lib/sales-document-events";

// GET /api/sales/documents/events - Document engagement events for sales timeline
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const quoteId = request.nextUrl.searchParams.get("quoteId") || undefined;
    const dealId = request.nextUrl.searchParams.get("dealId") || undefined;
    const limit = Math.min(
      Math.max(Number(request.nextUrl.searchParams.get("limit") || "50"), 1),
      200
    );

    const activities = await prisma.activity.findMany({
      where: {
        tenantId,
        type: "note",
        ...(quoteId || dealId
          ? {
              metadata: {
                path: [quoteId ? "quoteId" : "dealId"],
                equals: quoteId || dealId,
              },
            }
          : {
              metadata: {
                path: ["salesDocumentEvent"],
                equals: true,
              },
            }),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        subject: true,
        metadata: true,
        createdAt: true,
        dealId: true,
        contactId: true,
      },
    });

    const filtered = activities.filter((item) => {
      const metadata = (item.metadata || {}) as Record<string, unknown>;
      return metadata.salesDocumentEvent === true;
    });

    return NextResponse.json({
      data: filtered.map((item) => {
        const metadata = (item.metadata || {}) as Record<string, unknown>;
        return {
          id: item.id,
          subject: item.subject,
          createdAt: item.createdAt,
          dealId: item.dealId,
          contactId: item.contactId,
          eventType: getSalesDocumentEventTypeFromMetadata(metadata),
          quoteId: typeof metadata.quoteId === "string" ? metadata.quoteId : null,
          quoteTitle: typeof metadata.quoteTitle === "string" ? metadata.quoteTitle : null,
          recipientEmail:
            typeof metadata.recipientEmail === "string" ? metadata.recipientEmail : null,
          source: typeof metadata.source === "string" ? metadata.source : null,
        };
      }),
      summary: buildSalesDocumentSummary(filtered),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/sales/documents/events - Record view/download/signed event
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const body = await request.json();
    const payload = createSalesDocumentEventSchema.parse(body);

    const quote = await prisma.quote.findFirst({
      where: {
        id: payload.quoteId,
        tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        dealId: true,
        contactId: true,
        companyId: true,
      },
    });

    if (!quote) {
      throw new ApiError(404, "Quote not found");
    }

    const occurredAt = payload.occurredAt ? new Date(payload.occurredAt) : new Date();

    const event = await prisma.activity.create({
      data: {
        tenantId,
        type: "note",
        subject: getSalesDocumentEventLabel(payload.eventType),
        body: `${payload.eventType} event captured for quote ${quote.title}`,
        dealId: quote.dealId,
        contactId: quote.contactId,
        companyId: quote.companyId,
        metadata: {
          salesDocumentEvent: true,
          eventType: payload.eventType,
          quoteId: quote.id,
          quoteTitle: quote.title,
          recipientEmail: payload.recipientEmail || null,
          source: payload.source,
          occurredAt: occurredAt.toISOString(),
        },
      },
      select: {
        id: true,
        subject: true,
        createdAt: true,
        metadata: true,
      },
    });

    await logAuditEvent({
      request,
      action: "created",
      entity: "sales_document_event",
      entityId: event.id,
      entityName: quote.title,
      changes: {
        quoteId: quote.id,
        eventType: payload.eventType,
        source: payload.source,
      },
    });

    return NextResponse.json(
      {
        event,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
