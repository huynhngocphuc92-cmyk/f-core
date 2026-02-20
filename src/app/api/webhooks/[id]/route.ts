import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId, checkOwnership, checkPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit-helpers";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const updateWebhookSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  url: z.string().url().max(500).optional(),
  events: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

// GET /api/webhooks/[id] - Get a single webhook
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await checkPermission("settings.read", request);
    const { id } = await params;
    await getTenantId(request);

    const webhook = await prisma.webhook.findFirst({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!webhook) {
      return NextResponse.json(
        { error: "Webhook not found" },
        { status: 404 }
      );
    }

    await checkOwnership(webhook.tenantId, request);

    return NextResponse.json(webhook);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/webhooks/[id] - Update a webhook
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await checkPermission("settings.manage", request);
    const { id } = await params;
    await getTenantId(request);
    const body = await request.json();
    const data = updateWebhookSchema.parse(body);

    const existing = await prisma.webhook.findFirst({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Webhook not found" },
        { status: 404 }
      );
    }

    await checkOwnership(existing.tenantId, request);

    const webhook = await prisma.webhook.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.url !== undefined && { url: data.url }),
        ...(data.events !== undefined && {
          events: data.events as Prisma.InputJsonValue,
        }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    await logAuditEvent({
      request,
      action: "updated",
      entity: "webhook",
      entityId: webhook.id,
      entityName: webhook.name,
      changes: {
        updatedFields: Object.keys(data),
      },
    });

    return NextResponse.json(webhook);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/webhooks/[id] - Delete a webhook (hard delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await checkPermission("settings.manage", request);
    const { id } = await params;
    await getTenantId(request);

    const existing = await prisma.webhook.findFirst({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Webhook not found" },
        { status: 404 }
      );
    }

    await checkOwnership(existing.tenantId, request);

    await prisma.webhook.delete({
      where: { id },
    });

    await logAuditEvent({
      request,
      action: "deleted",
      entity: "webhook",
      entityId: existing.id,
      entityName: existing.name,
      metadata: {
        eventCount: Array.isArray(existing.events) ? existing.events.length : 0,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
