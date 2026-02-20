import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ApiError, handleApiError } from "@/lib/api-helpers";
import { getPortalContextFromRequest } from "@/lib/service-portal-auth";
import { getSlaPolicy, DEFAULT_SLA_POLICY } from "@/lib/sla-policy-store";
import { withTicketSla } from "@/lib/sla-helpers";

// GET /api/service/portal/tickets/[id] - Contact-scoped ticket detail + replies
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const portal = await getPortalContextFromRequest(request);

    const ticket = await prisma.ticket.findFirst({
      where: {
        id,
        tenantId: portal.tenantId,
        contactId: portal.contactId,
        deletedAt: null,
      },
      include: {
        assignee: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
      },
    });

    if (!ticket) {
      throw new ApiError(404, "Ticket not found");
    }

    const notes = await prisma.activity.findMany({
      where: {
        tenantId: portal.tenantId,
        contactId: portal.contactId,
        type: "note",
      },
      select: {
        id: true,
        subject: true,
        body: true,
        metadata: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
      take: 200,
    });

    const replies = notes.filter((item) => {
      const metadata = (item.metadata || {}) as Record<string, unknown>;
      return metadata.portalTicketId === id;
    });

    const policy = (await getSlaPolicy(ticket.tenantId)) || DEFAULT_SLA_POLICY;

    return NextResponse.json({
      ticket: withTicketSla(ticket, new Date(), policy),
      replies,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
