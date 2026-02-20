import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, getTenantId } from "@/lib/auth-helpers";
import { ApiError, handleApiError } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit-helpers";
import { listApprovalRequests } from "@/lib/content-approval-store";
import { getBlogPost } from "@/lib/content-blog-store";
import {
  createContentRemixSchema,
  createContentRemixVariant,
  listContentRemixVariants,
  remixSourceTypeSchema,
  remixTargetFormatSchema,
} from "@/lib/content-remix-store";

// GET /api/content/remix - List generated remix variants
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const sourceTypeQuery = request.nextUrl.searchParams.get("sourceType");
    const sourceId = request.nextUrl.searchParams.get("sourceId") || undefined;
    const targetFormatQuery = request.nextUrl.searchParams.get("targetFormat");

    const sourceType = sourceTypeQuery ? remixSourceTypeSchema.parse(sourceTypeQuery) : undefined;
    const targetFormat = targetFormatQuery
      ? remixTargetFormatSchema.parse(targetFormatQuery)
      : undefined;

    const data = await listContentRemixVariants(tenantId, {
      sourceType,
      sourceId,
      targetFormat,
    });

    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/content/remix - Generate a repurposed variant from approved source content
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const user = await getCurrentUser(request);
    const body = await request.json();
    const payload = createContentRemixSchema.parse(body);

    const approvedRequests = await listApprovalRequests(tenantId, {
      space: payload.sourceType,
      assetId: payload.sourceId,
      status: "approved",
    });

    if (approvedRequests.length === 0) {
      throw new ApiError(409, "Source content must be approved before remix generation");
    }

    let sourceTitle = "";
    let sourceExcerpt = "";
    let sourceBody = "";

    if (payload.sourceType === "blog_post") {
      const post = await getBlogPost(tenantId, payload.sourceId);
      if (!post) {
        throw new ApiError(404, "Source blog post not found");
      }
      sourceTitle = post.title;
      sourceExcerpt = post.excerpt || "";
      sourceBody = post.content;
    } else {
      const page = await prisma.landingPage.findFirst({
        where: {
          id: payload.sourceId,
          tenantId,
          deletedAt: null,
        },
        select: {
          name: true,
          description: true,
          contentHtml: true,
        },
      });

      if (!page) {
        throw new ApiError(404, "Source landing page not found");
      }

      sourceTitle = page.name;
      sourceExcerpt = page.description || "";
      sourceBody = page.contentHtml || page.description || page.name;
    }

    const variant = await createContentRemixVariant(tenantId, user.id, payload, {
      title: sourceTitle,
      excerpt: sourceExcerpt,
      body: sourceBody,
    });

    await logAuditEvent({
      request,
      action: "created",
      entity: "content_remix_variant",
      entityId: variant.id,
      entityName: variant.sourceTitle,
      changes: {
        sourceType: variant.sourceType,
        sourceId: variant.sourceId,
        targetFormat: variant.targetFormat,
        tone: variant.tone,
      },
    });

    return NextResponse.json({ variant }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
