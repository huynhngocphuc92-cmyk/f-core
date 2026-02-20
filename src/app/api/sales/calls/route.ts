import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit-helpers";
import {
  createSalesCallSchema,
  detectCallRiskSignals,
  extractTranscriptHighlights,
  summarizeSalesCalls,
} from "@/lib/sales-call-intelligence";

// GET /api/sales/calls - List recorded sales calls with transcript intelligence
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const dealId = request.nextUrl.searchParams.get("dealId") || undefined;
    const limit = Math.min(
      Math.max(Number(request.nextUrl.searchParams.get("limit") || "50"), 1),
      200
    );

    const calls = await prisma.activity.findMany({
      where: {
        tenantId,
        type: "call",
        ...(dealId ? { dealId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        subject: true,
        body: true,
        callDuration: true,
        dealId: true,
        contactId: true,
        companyId: true,
        metadata: true,
        createdAt: true,
      },
    });

    const filtered = calls.filter((call) => {
      const metadata =
        call.metadata && typeof call.metadata === "object" && !Array.isArray(call.metadata)
          ? (call.metadata as Record<string, unknown>)
          : {};
      return metadata.salesCallIntelligence === true;
    });

    return NextResponse.json({
      data: filtered.map((call) => {
        const metadata =
          call.metadata && typeof call.metadata === "object" && !Array.isArray(call.metadata)
            ? (call.metadata as Record<string, unknown>)
            : {};

        return {
          id: call.id,
          subject: call.subject,
          createdAt: call.createdAt,
          dealId: call.dealId,
          contactId: call.contactId,
          companyId: call.companyId,
          callDuration: call.callDuration,
          recordingUrl: typeof metadata.recordingUrl === "string" ? metadata.recordingUrl : null,
          transcriptPreview:
            typeof metadata.transcript === "string"
              ? String(metadata.transcript).slice(0, 240)
              : null,
          highlights: Array.isArray(metadata.highlights) ? metadata.highlights : [],
          riskSignals: Array.isArray(metadata.riskSignals) ? metadata.riskSignals : [],
          sentimentScore:
            typeof metadata.sentimentScore === "number" ? metadata.sentimentScore : null,
        };
      }),
      summary: summarizeSalesCalls(filtered),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/sales/calls - Record call transcript + insights to timeline activity
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const body = await request.json();
    const payload = createSalesCallSchema.parse(body);

    const highlights = extractTranscriptHighlights(payload.transcript, 5);
    const riskSignals = detectCallRiskSignals(payload.transcript);

    const call = await prisma.activity.create({
      data: {
        tenantId,
        type: "call",
        subject: payload.subject,
        body: highlights[0] || payload.transcript.slice(0, 200),
        dealId: payload.dealId,
        contactId: payload.contactId,
        companyId: payload.companyId,
        callDuration: payload.durationSeconds,
        metadata: {
          salesCallIntelligence: true,
          recordingUrl: payload.recordingUrl,
          transcript: payload.transcript,
          highlights,
          riskSignals,
          sentimentScore: payload.sentimentScore ?? null,
          actionItems: payload.actionItems || [],
          occurredAt: payload.occurredAt || new Date().toISOString(),
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
      entity: "sales_call_transcript",
      entityId: call.id,
      entityName: payload.subject,
      changes: {
        dealId: payload.dealId || null,
        durationSeconds: payload.durationSeconds,
        riskSignalCount: riskSignals.length,
      },
    });

    return NextResponse.json({ call }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
