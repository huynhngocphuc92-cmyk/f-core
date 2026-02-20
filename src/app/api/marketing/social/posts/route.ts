import { NextRequest, NextResponse } from "next/server";
import { getTenantId } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit-helpers";
import {
  createSocialPost,
  createSocialPostSchema,
  listSocialPosts,
  summarizeSocialPosts,
} from "@/lib/social-publishing-store";

// GET /api/marketing/social/posts - List social posts with status/channel summary
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const posts = await listSocialPosts(tenantId);

    return NextResponse.json({
      data: posts,
      summary: summarizeSocialPosts(posts),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/marketing/social/posts - Create draft/scheduled social post
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const body = await request.json();
    const payload = createSocialPostSchema.parse(body);

    const post = await createSocialPost(tenantId, payload);

    await logAuditEvent({
      request,
      action: "created",
      entity: "social_post",
      entityId: post.id,
      entityName: post.title,
      changes: {
        status: post.status,
        channels: post.channels,
        scheduledAt: post.scheduledAt,
      },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
