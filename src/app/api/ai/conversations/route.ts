import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserData } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";

// GET /api/ai/conversations - List user's AI conversations
export async function GET(request: NextRequest) {
  try {
    const userData = await getUserData(request);

    const conversations = await prisma.aIConversation.findMany({
      where: {
        tenantId: userData.tenantId,
        userId: userData.id,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        contextType: true,
        contextId: true,
        model: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ data: conversations });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/ai/conversations - Create a new conversation
export async function POST(request: NextRequest) {
  try {
    const userData = await getUserData(request);
    const body = await request.json();

    const conversation = await prisma.aIConversation.create({
      data: {
        tenantId: userData.tenantId,
        userId: userData.id,
        title: body.title || null,
        contextType: body.contextType || null,
        contextId: body.contextId || null,
        model: body.model || process.env.AI_MODEL || "claude-sonnet-4-5",
      },
      select: {
        id: true,
        title: true,
        contextType: true,
        contextId: true,
        model: true,
        createdAt: true,
      },
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
