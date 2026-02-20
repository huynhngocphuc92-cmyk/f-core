import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getTenantId } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit-helpers";
import {
  createBlogPost,
  createBlogPostSchema,
  listBlogPosts,
  summarizeBlogPosts,
} from "@/lib/content-blog-store";

// GET /api/content/blog/posts - List blog posts with authoring workflow summary
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const status = request.nextUrl.searchParams.get("status");

    const allPosts = await listBlogPosts(tenantId);
    const posts = status && status !== "all" ? allPosts.filter((post) => post.status === status) : allPosts;

    return NextResponse.json({
      data: posts,
      summary: summarizeBlogPosts(allPosts),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/content/blog/posts - Create draft or scheduled blog post
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const user = await getCurrentUser(request);
    const body = await request.json();
    const payload = createBlogPostSchema.parse(body);

    const post = await createBlogPost(tenantId, user.id, payload);

    await logAuditEvent({
      request,
      action: "created",
      entity: "content_blog_post",
      entityId: post.id,
      entityName: post.title,
      changes: {
        status: post.status,
        scheduledAt: post.scheduledAt,
      },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
