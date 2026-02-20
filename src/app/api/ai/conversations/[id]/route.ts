import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkPermission, getUserData } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";

// GET /api/ai/conversations/[id] - Get conversation with messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userData = await getUserData(request);
    await checkPermission("ai.use", request);
    const { id } = await params;

    const conversation = await prisma.aIConversation.findFirst({
      where: {
        id,
        tenantId: userData.tenantId,
        userId: userData.id,
        deletedAt: null,
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            role: true,
            content: true,
            toolCalls: true,
            toolResults: true,
            createdAt: true,
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(conversation);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/ai/conversations/[id] - Soft delete conversation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userData = await getUserData(request);
    await checkPermission("ai.use", request);
    const { id } = await params;

    const conversation = await prisma.aIConversation.findFirst({
      where: {
        id,
        tenantId: userData.tenantId,
        userId: userData.id,
        deletedAt: null,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }

    await prisma.aIConversation.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
