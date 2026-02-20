import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { ApiError, handleApiError } from "@/lib/api-helpers";
import { getPortalContextFromRequest } from "@/lib/service-portal-auth";
import { hasSurveyResponseForTicket } from "@/lib/service-survey";

const surveyResponseSchema = z.object({
  ticketId: z.string().min(1),
  csatScore: z.number().int().min(1).max(5),
  npsScore: z.number().int().min(0).max(10).optional(),
  feedback: z.string().max(5000).optional(),
});

// POST /api/service/surveys/respond - Customer submits CSAT/NPS survey response
export async function POST(request: NextRequest) {
  try {
    const portal = await getPortalContextFromRequest(request);
    const body = await request.json();
    const data = surveyResponseSchema.parse(body);

    const ticket = await prisma.ticket.findFirst({
      where: {
        id: data.ticketId,
        tenantId: portal.tenantId,
        contactId: portal.contactId,
        deletedAt: null,
      },
      select: { id: true, status: true },
    });

    if (!ticket) {
      throw new ApiError(404, "Ticket not found");
    }

    const surveyActivities = await prisma.activity.findMany({
      where: {
        tenantId: portal.tenantId,
        contactId: portal.contactId,
        type: "note",
      },
      select: { metadata: true },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    if (hasSurveyResponseForTicket(surveyActivities, data.ticketId)) {
      throw new ApiError(409, "Survey already submitted for this ticket");
    }

    const response = await prisma.activity.create({
      data: {
        tenantId: portal.tenantId,
        type: "note",
        contactId: portal.contactId,
        subject: "CSAT/NPS survey response",
        body: data.feedback || null,
        metadata: {
          source: "service_survey",
          status: "responded",
          ticketId: data.ticketId,
          csatScore: data.csatScore,
          npsScore: data.npsScore ?? null,
          feedback: data.feedback ?? null,
          portalContactEmail: portal.email,
        },
      },
      select: {
        id: true,
        body: true,
        metadata: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ response }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
