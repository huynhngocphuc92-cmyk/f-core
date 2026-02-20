import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import {
  buildContentPerformanceReport,
  contentPerformanceSourceTypeSchema,
  listContentPerformanceEvents,
  type ContentAssetSummary,
} from "@/lib/content-performance";
import { listBlogPosts } from "@/lib/content-blog-store";

function parseDays(raw: string | null) {
  const parsed = Number(raw || 30);
  if (!Number.isFinite(parsed)) return 30;
  return Math.min(180, Math.max(7, parsed));
}

// GET /api/content/performance?days=30&sourceType=blog_post|landing_page&channel=email
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const days = parseDays(request.nextUrl.searchParams.get("days"));
    const sourceTypeRaw = request.nextUrl.searchParams.get("sourceType");
    const sourceType = sourceTypeRaw ? contentPerformanceSourceTypeSchema.parse(sourceTypeRaw) : null;
    const channel = request.nextUrl.searchParams.get("channel");
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const blogPosts = (await listBlogPosts(tenantId)).map<ContentAssetSummary>((post) => ({
      sourceType: "blog_post",
      sourceId: post.id,
      title: post.title,
      status: post.status,
      updatedAt: post.updatedAt,
    }));

    const landingPagesRaw = await prisma.landingPage.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        status: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 200,
    });

    const landingPages = (landingPagesRaw || []).map<ContentAssetSummary>((page) => ({
      sourceType: "landing_page",
      sourceId: page.id,
      title: page.name,
      status: page.status,
      updatedAt: page.updatedAt.toISOString(),
    }));

    const assets = [...blogPosts, ...landingPages].filter((asset) => {
      if (sourceType && asset.sourceType !== sourceType) return false;
      if (asset.status === "archived") return false;
      return true;
    });

    const events = await listContentPerformanceEvents(tenantId, {
      sourceType: sourceType || undefined,
      channel: channel || undefined,
      since,
    });

    const report = buildContentPerformanceReport({ assets, events });

    return NextResponse.json({
      windowDays: days,
      generatedAt: new Date().toISOString(),
      filters: {
        sourceType,
        channel: channel || null,
      },
      ...report,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
