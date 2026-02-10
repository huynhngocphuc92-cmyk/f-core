import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId, getCurrentUser, checkOwnership } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const sendMessageSchema = z.object({
  content: z.string().min(1).max(5000),
  senderType: z.enum(["visitor", "agent", "system"]).optional(),
  attachments: z.array(z.record(z.string(), z.unknown())).optional(),
});

// POST /api/chat/conversations/[id]/messages - Send a message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    await getTenantId(request);
    const user = await getCurrentUser(request);
    const body = await request.json();
    const data = sendMessageSchema.parse(body);

    const conversation = await prisma.chatConversation.findFirst({
      where: { id: conversationId },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    await checkOwnership(conversation.tenantId, request);

    // Create message and update conversation in a transaction
    const [message] = await prisma.$transaction([
      prisma.chatMessage.create({
        data: {
          conversationId,
          senderType: data.senderType || "agent",
          senderId: user.id,
          content: data.content.trim(),
          attachments: data.attachments as Prisma.InputJsonValue,
        },
      }),
      prisma.chatConversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: new Date(),
          messageCount: { increment: 1 },
          // Auto-assign if currently open
          ...(conversation.status === "open"
            ? { status: "assigned", assigneeId: user.id }
            : {}),
        },
      }),
    ]);

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
