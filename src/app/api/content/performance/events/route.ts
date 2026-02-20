import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, getTenantId } from "@/lib/auth-helpers";
import { ApiError, handleApiError } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit-helpers";
import { getBlogPost } from "@/lib/content-blog-store";
import {
  createContentPerformanceEvent,
  createContentPerformanceEventSchema,
} from "@/lib/content-performance";

// POST /api/content/performance/events - Track content performance event
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const user = await getCurrentUser(request);
    const body = await request.json();
    const payload = createContentPerformanceEventSchema.parse(body);

    if (payload.sourceType === "blog_post") {
      const post = await getBlogPost(tenantId, payload.sourceId);
      if (!post) {
        throw new ApiError(404, "Source blog post not found");
      }
    } else {
      const page = await prisma.landingPage.findFirst({
        where: {
          id: payload.sourceId,
          tenantId,
          deletedAt: null,
        },
        select: { id: true },
      });
      if (!page) {
        throw new ApiError(404, "Source landing page not found");
      }
    }

    const event = await createContentPerformanceEvent(tenantId, payload);

    await logAuditEvent({
      request,
      action: "created",
      entity: "content_performance_event",
      entityId: event.id,
      entityName: `${event.sourceType}:${event.sourceId}`,
      changes: {
        sourceType: event.sourceType,
        sourceId: event.sourceId,
        channel: event.channel,
        eventType: event.eventType,
        createdBy: user.id,
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
