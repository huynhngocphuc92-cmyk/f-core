"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

async function getTenantId(): Promise<string> {
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) throw new Error("No tenant found");
  return tenant.id;
}

async function getDefaultUserId(): Promise<string> {
  const user = await prisma.user.findFirst();
  if (!user) throw new Error("No user found");
  return user.id;
}

// ============================================
// CHAT CONVERSATIONS
// ============================================

export async function getConversations(filters?: {
  search?: string;
  status?: string;
}) {
  const tenantId = await getTenantId();

  return prisma.chatConversation.findMany({
    where: {
      tenantId,
      ...(filters?.status && filters.status !== "all"
        ? { status: filters.status }
        : {}),
      ...(filters?.search
        ? {
            OR: [
              { visitorName: { contains: filters.search, mode: "insensitive" as const } },
              { visitorEmail: { contains: filters.search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    include: {
      widget: { select: { id: true, name: true, color: true } },
      assignee: { select: { id: true, name: true, email: true } },
      contact: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
    orderBy: { lastMessageAt: "desc" },
    take: 100,
  });
}

export async function getConversationStats() {
  const tenantId = await getTenantId();

  const [total, open, assigned, resolved] = await Promise.all([
    prisma.chatConversation.count({ where: { tenantId } }),
    prisma.chatConversation.count({ where: { tenantId, status: "open" } }),
    prisma.chatConversation.count({ where: { tenantId, status: "assigned" } }),
    prisma.chatConversation.count({ where: { tenantId, status: "resolved" } }),
  ]);

  // Calculate average rating from conversations that have ratings
  const ratingResult = await prisma.chatConversation.aggregate({
    where: { tenantId, rating: { not: null } },
    _avg: { rating: true },
  });

  const avgRating = ratingResult._avg.rating
    ? Number(ratingResult._avg.rating.toFixed(1))
    : 0;

  return { total, open, assigned, resolved, avgRating };
}

export async function getConversation(id: string) {
  const tenantId = await getTenantId();

  return prisma.chatConversation.findFirst({
    where: { id, tenantId },
    include: {
      widget: { select: { id: true, name: true, color: true } },
      assignee: { select: { id: true, name: true, email: true } },
      contact: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function sendMessage(conversationId: string, content: string) {
  const tenantId = await getTenantId();
  const userId = await getDefaultUserId();

  // Verify the conversation belongs to this tenant
  const conversation = await prisma.chatConversation.findFirst({
    where: { id: conversationId, tenantId },
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  if (!content || content.trim().length === 0) {
    throw new Error("Message content is required");
  }

  // Create the message and update conversation in a transaction
  await prisma.$transaction([
    prisma.chatMessage.create({
      data: {
        conversationId,
        senderType: "agent",
        senderId: userId,
        content: content.trim(),
      },
    }),
    prisma.chatConversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        messageCount: { increment: 1 },
        // Auto-assign if currently open
        ...(conversation.status === "open"
          ? { status: "assigned", assigneeId: userId }
          : {}),
      },
    }),
  ]);

  revalidatePath(`/chat/${conversationId}`);
  revalidatePath("/chat");
}
