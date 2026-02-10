import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId, checkOwnership } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { z } from "zod";

const updateConversationSchema = z.object({
  status: z.enum(["open", "assigned", "resolved", "closed"]).optional(),
  assigneeId: z.string().nullable().optional(),
  rating: z.number().int().min(1).max(5).nullable().optional(),
});

// GET /api/chat/conversations/[id] - Get a single conversation with messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await getTenantId(request);

    const conversation = await prisma.chatConversation.findFirst({
      where: { id },
      include: {
        widget: { select: { id: true, name: true, color: true } },
        assignee: { select: { id: true, name: true, email: true } },
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    await checkOwnership(conversation.tenantId, request);

    return NextResponse.json(conversation);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/chat/conversations/[id] - Update conversation status/assignee/rating
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await getTenantId(request);
    const body = await request.json();
    const data = updateConversationSchema.parse(body);

    const existing = await prisma.chatConversation.findFirst({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    await checkOwnership(existing.tenantId, request);

    const conversation = await prisma.chatConversation.update({
      where: { id },
      data: {
        ...(data.status !== undefined && { status: data.status }),
        ...(data.assigneeId !== undefined && { assigneeId: data.assigneeId }),
        ...(data.rating !== undefined && { rating: data.rating }),
      },
      include: {
        widget: { select: { id: true, name: true, color: true } },
        assignee: { select: { id: true, name: true, email: true } },
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(conversation);
  } catch (error) {
    return handleApiError(error);
  }
}
