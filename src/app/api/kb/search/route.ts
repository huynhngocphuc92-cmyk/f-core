import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// ============================================
// GET /api/kb/search - Search articles
// ============================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = "demo-tenant";

    const q = searchParams.get("q") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20") || 20)
    );

    if (!q.trim()) {
      return NextResponse.json(
        { error: "Search query 'q' is required" },
        { status: 400 }
      );
    }

    const skip = (page - 1) * limit;

    // Search across title, subtitle, excerpt, and tags
    const where: Prisma.KBArticleWhereInput = {
      tenantId,
      deletedAt: null,
      status: "published",
      OR: [
        { title: { contains: q, mode: "insensitive" as const } },
        { subtitle: { contains: q, mode: "insensitive" as const } },
        { excerpt: { contains: q, mode: "insensitive" as const } },
        { tags: { hasSome: [q] } },
      ],
    };

    const [articles, total] = await Promise.all([
      prisma.kBArticle.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          subtitle: true,
          excerpt: true,
          tags: true,
          status: true,
          publishedAt: true,
          viewCount: true,
          helpfulCount: true,
          notHelpfulCount: true,
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: [{ viewCount: "desc" }, { publishedAt: "desc" }],
        skip,
        take: limit,
      }),
      prisma.kBArticle.count({ where }),
    ]);

    // Highlight matching text in excerpt (HTML-escape first to prevent XSS)
    const highlightedArticles = articles.map((article) => {
      let highlightedExcerpt = article.excerpt || "";

      if (highlightedExcerpt && q) {
        // HTML-escape the excerpt before adding <mark> tags
        highlightedExcerpt = escapeHtml(highlightedExcerpt);
        const regex = new RegExp(`(${escapeRegExp(q)})`, "gi");
        highlightedExcerpt = highlightedExcerpt.replace(
          regex,
          "<mark>$1</mark>"
        );
      }

      return {
        ...article,
        highlightedExcerpt,
      };
    });

    return NextResponse.json({
      data: highlightedArticles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      query: q,
    });
  } catch (error) {
    console.error("Error searching KB articles:", error);
    return NextResponse.json(
      { error: "Failed to search articles" },
      { status: 500 }
    );
  }
}

// ============================================
// Helper: Escape regex special characters
// ============================================

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
