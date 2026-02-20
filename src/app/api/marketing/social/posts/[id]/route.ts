import { NextRequest, NextResponse } from "next/server";
import { getTenantId } from "@/lib/auth-helpers";
import { ApiError, handleApiError } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit-helpers";
import { updateSocialPost, updateSocialPostSchema } from "@/lib/social-publishing-store";

// PATCH /api/marketing/social/posts/[id] - Update social post lifecycle state
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getTenantId(request);
    const { id } = await params;
    const body = await request.json();
    const payload = updateSocialPostSchema.parse(body);

    let post;

    try {
      post = await updateSocialPost(tenantId, id, payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update social post";
      if (message === "Social post not found") {
        throw new ApiError(404, message);
      }
      throw new ApiError(409, message);
    }

    await logAuditEvent({
      request,
      action: "updated",
      entity: "social_post",
      entityId: post.id,
      entityName: post.title,
      changes: {
        action: payload.action,
        status: post.status,
        scheduledAt: post.scheduledAt,
        publishedAt: post.publishedAt,
      },
    });

    return NextResponse.json({ post });
  } catch (error) {
    return handleApiError(error);
  }
}
