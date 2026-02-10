import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";
import {
  validatePagination,
  buildWhereClause,
  paginatedResponse,
  handleApiError,
} from "@/lib/api-helpers";

// GET /api/audit-logs - List audit logs
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const { page, limit, skip } = validatePagination(
      request.nextUrl.searchParams
    );

    const search = request.nextUrl.searchParams.get("search");
    const entity = request.nextUrl.searchParams.get("entity");
    const action = request.nextUrl.searchParams.get("action");

    const additionalWhere = {
      ...(entity && entity !== "all" ? { entity } : {}),
      ...(action && action !== "all" ? { action } : {}),
      ...(search
        ? {
            OR: [
              {
                entityName: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
              {
                action: { contains: search, mode: "insensitive" as const },
              },
              {
                entity: { contains: search, mode: "insensitive" as const },
              },
            ],
          }
        : {}),
    };

    const where = buildWhereClause(tenantId, additionalWhere);

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return paginatedResponse(logs, total, page, limit);
  } catch (error) {
    return handleApiError(error);
  }
}
