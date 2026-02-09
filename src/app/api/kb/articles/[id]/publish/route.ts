import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// ============================================
// POST /api/kb/articles/[id]/publish - Publish article
// ============================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = "demo-tenant";

    // Verify article exists and belongs to tenant
    const existing = await prisma.kBArticle.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: {
        id: true,
        title: true,
        contentHtml: true,
        status: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      );
    }

    // Check if already published
    if (existing.status === "published") {
      return NextResponse.json(
        { error: "Article is already published" },
        { status: 400 }
      );
    }

    // Validate required fields for publishing
    if (!existing.title || !existing.contentHtml) {
      return NextResponse.json(
        {
          error: "Article must have a title and content (contentHtml) to be published",
        },
        { status: 400 }
      );
    }

    const article = await prisma.kBArticle.update({
      where: { id },
      data: {
        status: "published",
        publishedAt: new Date(),
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            feedback: true,
          },
        },
      },
    });

    return NextResponse.json(article);
  } catch (error) {
    console.error("Error publishing KB article:", error);
    return NextResponse.json(
      { error: "Failed to publish article" },
      { status: 500 }
    );
  }
}
