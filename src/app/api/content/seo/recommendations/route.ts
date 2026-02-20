import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";
import { ApiError, handleApiError } from "@/lib/api-helpers";
import { buildSeoRecommendation } from "@/lib/content-seo";
import { getBlogPost } from "@/lib/content-blog-store";

// GET /api/content/seo/recommendations?sourceType=landing_page|blog_post&sourceId=...&keyword=...
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const sourceType = request.nextUrl.searchParams.get("sourceType");
    const sourceId = request.nextUrl.searchParams.get("sourceId");
    const keyword = request.nextUrl.searchParams.get("keyword");

    if (!sourceType || !sourceId) {
      throw new ApiError(400, "sourceType and sourceId are required");
    }

    if (sourceType === "landing_page") {
      const page = await prisma.landingPage.findFirst({
        where: {
          id: sourceId,
          tenantId,
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          contentHtml: true,
          metaTitle: true,
          metaDescription: true,
          description: true,
        },
      });

      if (!page) {
        throw new ApiError(404, "Landing page not found");
      }

      const report = buildSeoRecommendation({
        title: page.name || "",
        slug: page.slug || "",
        content: page.contentHtml || page.description || "",
        metaTitle: page.metaTitle || page.name || "",
        metaDescription: page.metaDescription || page.description || "",
        keyword,
      });

      return NextResponse.json({
        source: {
          type: "landing_page",
          id: page.id,
          title: page.name,
          slug: page.slug,
        },
        keyword: keyword || null,
        ...report,
      });
    }

    if (sourceType === "blog_post") {
      const post = await getBlogPost(tenantId, sourceId);
      if (!post) {
        throw new ApiError(404, "Blog post not found");
      }

      const report = buildSeoRecommendation({
        title: post.title,
        slug: post.slug,
        content: post.content,
        metaTitle: post.title,
        metaDescription: post.excerpt || "",
        keyword,
      });

      return NextResponse.json({
        source: {
          type: "blog_post",
          id: post.id,
          title: post.title,
          slug: post.slug,
        },
        keyword: keyword || null,
        ...report,
      });
    }

    throw new ApiError(400, "Invalid sourceType");
  } catch (error) {
    return handleApiError(error);
  }
}
