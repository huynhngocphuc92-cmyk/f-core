import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getTenantId } from "@/lib/auth-helpers";
import { ApiError, handleApiError } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit-helpers";
import {
  createApprovalRequest,
  decideApprovalRequest,
  getApprovalEligibility,
  getApprovalPolicy,
  listApprovalRequests,
} from "@/lib/content-approval-store";
import { getBlogPost, updateBlogPost, updateBlogPostSchema } from "@/lib/content-blog-store";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// PATCH /api/content/blog/posts/[id] - Edit and transition blog post workflow state
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const tenantId = await getTenantId(request);
    const user = await getCurrentUser(request);
    const { id } = await context.params;
    const body = await request.json();
    const payload = updateBlogPostSchema.parse(body);

    const existingPost = await getBlogPost(tenantId, id);
    if (!existingPost) {
      throw new ApiError(404, "Blog post not found");
    }

    if (payload.action === "publish_now" || payload.action === "schedule") {
      const eligibility = await getApprovalEligibility(tenantId, "blog_post", id, existingPost.updatedAt);
      if (!eligibility.canPublish) {
        throw new ApiError(409, eligibility.reason);
      }
    }

    let post;
    try {
      post = await updateBlogPost(tenantId, id, user.id, payload);
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        throw new ApiError(404, error.message);
      }
      if (error instanceof Error) {
        throw new ApiError(409, error.message);
      }
      throw error;
    }

    const approvalPolicy = await getApprovalPolicy(tenantId, "blog_post");

    if (payload.action === "submit_review" && approvalPolicy.enabled) {
      await createApprovalRequest(tenantId, {
        space: "blog_post",
        assetId: post.id,
        assetTitle: post.title,
        assetUpdatedAt: post.updatedAt,
        requestedBy: user.id,
      });
    }

    if (payload.action === "approve" && approvalPolicy.enabled) {
      const pending = (await listApprovalRequests(tenantId, {
        space: "blog_post",
        assetId: post.id,
        status: "pending",
      }))[0];
      if (!pending) {
        throw new ApiError(409, "No pending approval request found for this post");
      }
      await decideApprovalRequest(tenantId, pending.id, user.id, { decision: "approved" });
    }

    await logAuditEvent({
      request,
      action: "updated",
      entity: "content_blog_post",
      entityId: post.id,
      entityName: post.title,
      changes: {
        action: payload.action || "edit",
        status: post.status,
        scheduledAt: post.scheduledAt,
      },
    });

    return NextResponse.json({ post });
  } catch (error) {
    return handleApiError(error);
  }
}
