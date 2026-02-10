import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";
import {
  validatePagination,
  buildWhereClause,
  paginatedResponse,
  handleApiError,
} from "@/lib/api-helpers";

// GET /api/chat/conversations - List chat conversations
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const { page, limit, skip } = validatePagination(
      request.nextUrl.searchParams
    );

    const search = request.nextUrl.searchParams.get("search");
    const status = request.nextUrl.searchParams.get("status");

    const additionalWhere = {
      ...(status && status !== "all" ? { status } : {}),
      ...(search
        ? {
            OR: [
              {
                visitorName: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
              {
                visitorEmail: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    };

    const where = buildWhereClause(tenantId, additionalWhere);

    const [conversations, total] = await Promise.all([
      prisma.chatConversation.findMany({
        where,
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
        orderBy: { lastMessageAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.chatConversation.count({ where }),
    ]);

    return paginatedResponse(conversations, total, page, limit);
  } catch (error) {
    return handleApiError(error);
  }
}
