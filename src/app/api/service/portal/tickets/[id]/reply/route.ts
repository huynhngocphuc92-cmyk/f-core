import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { ApiError, handleApiError } from "@/lib/api-helpers";
import { getPortalContextFromRequest } from "@/lib/service-portal-auth";

const replySchema = z.object({
  message: z.string().min(1).max(5000),
});

// POST /api/service/portal/tickets/[id]/reply - Contact reply to ticket
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const portal = await getPortalContextFromRequest(request);
    const body = await request.json();
    const data = replySchema.parse(body);

    const ticket = await prisma.ticket.findFirst({
      where: {
        id,
        tenantId: portal.tenantId,
        contactId: portal.contactId,
        deletedAt: null,
      },
      select: { id: true, status: true },
    });

    if (!ticket) {
      throw new ApiError(404, "Ticket not found");
    }

    const reply = await prisma.activity.create({
      data: {
        tenantId: portal.tenantId,
        type: "note",
        contactId: portal.contactId,
        subject: "Customer portal reply",
        body: data.message,
        metadata: {
          source: "customer_portal",
          portalTicketId: id,
          portalContactEmail: portal.email,
        },
      },
      select: {
        id: true,
        subject: true,
        body: true,
        metadata: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ reply }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
