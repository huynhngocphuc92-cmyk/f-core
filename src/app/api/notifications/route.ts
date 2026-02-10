import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId, getCurrentUser } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const createNotificationSchema = z.object({
  userId: z.string().optional(),
  type: z.string().min(1).max(100),
  title: z.string().min(1).max(500),
  message: z.string().max(2000).optional(),
  link: z.string().max(500).optional(),
  icon: z.string().max(100).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// GET /api/notifications - List notifications for current user
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const user = await getCurrentUser(request);

    const limit = parseInt(
      request.nextUrl.searchParams.get("limit") || "20",
      10
    );
    const isRead = request.nextUrl.searchParams.get("isRead");

    const notifications = await prisma.notification.findMany({
      where: {
        tenantId,
        userId: user.id,
        ...(isRead !== null
          ? { isRead: isRead === "true" }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 100),
    });

    const unreadCount = await prisma.notification.count({
      where: { tenantId, userId: user.id, isRead: false },
    });

    return NextResponse.json({ data: notifications, unreadCount });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/notifications - Create a notification
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const user = await getCurrentUser(request);
    const body = await request.json();
    const data = createNotificationSchema.parse(body);

    const notification = await prisma.notification.create({
      data: {
        tenantId,
        userId: data.userId || user.id,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link,
        icon: data.icon,
        metadata: (data.metadata || {}) as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
