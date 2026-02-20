import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import {
  buildSurveySummary,
  hasSurveyBeenSentForTicket,
  parseSurveyResponseEvent,
  parseSurveySentEvent,
} from "@/lib/service-survey";
import { issueCustomerPortalToken } from "@/lib/customer-portal-token";

// GET /api/service/surveys - CSAT/NPS summary + recent responses
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const days = Math.max(1, Math.min(180, Number(request.nextUrl.searchParams.get("days") || "30")));
    const limit = Math.max(1, Math.min(100, Number(request.nextUrl.searchParams.get("limit") || "20")));
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const activities = await prisma.activity.findMany({
      where: {
        tenantId,
        type: "note",
        createdAt: { gte: from },
      },
      select: {
        id: true,
        contactId: true,
        body: true,
        metadata: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 1000,
    });

    const sentEvents = activities.map(parseSurveySentEvent).filter((item) => item !== null);
    const responseEvents = activities
      .map(parseSurveyResponseEvent)
      .filter((item) => item !== null)
      .sort((a, b) => new Date(b.respondedAt).getTime() - new Date(a.respondedAt).getTime());

    const ticketIds = Array.from(new Set(responseEvents.map((item) => item.ticketId)));
    const tickets = ticketIds.length
      ? await prisma.ticket.findMany({
          where: { tenantId, id: { in: ticketIds } },
          select: { id: true, subject: true, status: true, priority: true },
        })
      : [];
    const ticketMap = new Map(tickets.map((ticket) => [ticket.id, ticket]));

    return NextResponse.json({
      summary: buildSurveySummary({ sentEvents, responseEvents }),
      recentResponses: responseEvents.slice(0, limit).map((item) => ({
        ...item,
        ticket: ticketMap.get(item.ticketId) || null,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/service/surveys - Dispatch survey invitations for resolved tickets
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const days = Math.max(1, Math.min(90, Number(request.nextUrl.searchParams.get("days") || "14")));
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const resolvedTickets = await prisma.ticket.findMany({
      where: {
        tenantId,
        deletedAt: null,
        status: "resolved",
        resolvedAt: { gte: from },
        contactId: { not: null },
      },
      include: {
        contact: { select: { id: true, email: true } },
      },
      orderBy: { resolvedAt: "desc" },
      take: 300,
    });

    const existingSurveyActivities = await prisma.activity.findMany({
      where: {
        tenantId,
        type: "note",
        createdAt: { gte: from },
      },
      select: { metadata: true },
      take: 2000,
    });

    const created: Array<{ ticketId: string; contactId: string; portalPath: string }> = [];

    for (const ticket of resolvedTickets) {
      if (!ticket.contactId || !ticket.contact?.email) continue;
      if (hasSurveyBeenSentForTicket(existingSurveyActivities, ticket.id)) continue;

      const { token } = issueCustomerPortalToken({
        tenantId,
        contactId: ticket.contactId,
        email: ticket.contact.email,
        expiresInMinutes: 60 * 24 * 7,
      });

      const portalPath = `/portal/tickets/${ticket.id}?token=${encodeURIComponent(token)}`;

      await prisma.activity.create({
        data: {
          tenantId,
          type: "note",
          contactId: ticket.contactId,
          subject: "CSAT/NPS survey sent",
          body: "Survey invitation triggered after ticket resolution.",
          metadata: {
            source: "service_survey",
            status: "sent",
            workflow: "ticket_resolved",
            ticketId: ticket.id,
            portalPath,
          },
        },
      });

      existingSurveyActivities.push({
        metadata: {
          source: "service_survey",
          status: "sent",
          ticketId: ticket.id,
        },
      });

      created.push({ ticketId: ticket.id, contactId: ticket.contactId, portalPath });
    }

    return NextResponse.json({
      summary: {
        scanned: resolvedTickets.length,
        created: created.length,
      },
      created,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
