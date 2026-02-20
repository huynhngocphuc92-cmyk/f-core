import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId, getCurrentUser, checkPermission } from "@/lib/auth-helpers";
import {
  validatePagination,
  buildWhereClause,
  paginatedResponse,
  handleApiError,
} from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit-helpers";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { randomBytes } from "crypto";

const createWebhookSchema = z.object({
  name: z.string().min(1).max(200),
  url: z.string().url().max(500),
  events: z.array(z.string()).min(1),
  secret: z.string().max(200).optional(),
});

// GET /api/webhooks - List webhooks
export async function GET(request: NextRequest) {
  try {
    await checkPermission("settings.read", request);
    const tenantId = await getTenantId(request);
    const { page, limit, skip } = validatePagination(
      request.nextUrl.searchParams
    );

    const where = buildWhereClause(tenantId);

    const [webhooks, total] = await Promise.all([
      prisma.webhook.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.webhook.count({ where }),
    ]);

    return paginatedResponse(webhooks, total, page, limit);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/webhooks - Create a webhook
export async function POST(request: NextRequest) {
  try {
    await checkPermission("settings.manage", request);
    const tenantId = await getTenantId(request);
    const user = await getCurrentUser(request);
    const body = await request.json();
    const data = createWebhookSchema.parse(body);

    const webhook = await prisma.webhook.create({
      data: {
        tenantId,
        userId: user.id,
        name: data.name,
        url: data.url,
        events: data.events as Prisma.InputJsonValue,
        secret: data.secret || randomBytes(32).toString("hex"),
        isActive: true,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    await logAuditEvent({
      request,
      action: "created",
      entity: "webhook",
      entityId: webhook.id,
      entityName: webhook.name,
      changes: {
        events: webhook.events,
        isActive: webhook.isActive,
      },
    });

    return NextResponse.json(webhook, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
