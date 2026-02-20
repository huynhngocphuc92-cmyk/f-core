import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkPermission, getUserData } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import {
  buildServiceAgentInsights,
  serviceAgentRequestSchema,
} from "@/lib/ai/service-agent";

async function computeServiceAgentResponse(
  tenantId: string,
  input: {
    query?: string;
    maxRecommendations?: number;
  }
) {
  const tickets = await prisma.ticket.findMany({
    where: {
      tenantId,
      deletedAt: null,
    },
    select: {
      id: true,
      subject: true,
      description: true,
      status: true,
      priority: true,
      source: true,
      category: true,
      createdAt: true,
      updatedAt: true,
      dueDate: true,
      firstResponseAt: true,
      assignee: { select: { id: true, name: true } },
      contact: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  return buildServiceAgentInsights({
    query: input.query,
    maxRecommendations: input.maxRecommendations,
    tickets: tickets.map((ticket) => ({
      id: ticket.id,
      subject: ticket.subject,
      description: ticket.description,
      status: ticket.status as "open" | "in_progress" | "waiting" | "resolved" | "closed",
      priority: ticket.priority as "low" | "medium" | "high" | "urgent",
      source: ticket.source,
      category: ticket.category,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      dueDate: ticket.dueDate,
      firstResponseAt: ticket.firstResponseAt,
      assignee: ticket.assignee,
      contact: ticket.contact,
    })),
  });
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserData(request);
    await checkPermission("ai.use", request);
    const payload = serviceAgentRequestSchema.parse({
      query: request.nextUrl.searchParams.get("query") || undefined,
      maxRecommendations: request.nextUrl.searchParams.get("maxRecommendations")
        ? Number(request.nextUrl.searchParams.get("maxRecommendations"))
        : undefined,
    });

    const data = await computeServiceAgentResponse(user.tenantId, payload);

    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserData(request);
    await checkPermission("ai.use", request);
    const body = await request.json();
    const payload = serviceAgentRequestSchema.parse(body);

    const data = await computeServiceAgentResponse(user.tenantId, payload);

    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
