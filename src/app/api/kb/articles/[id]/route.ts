import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { updateArticleSchema } from "@/lib/validations/kb";

// ============================================
// GET /api/kb/articles/[id] - Get article
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = "demo-tenant";

    const article = await prisma.kBArticle.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
          },
        },
        _count: {
          select: {
            feedback: true,
          },
        },
      },
    });

    if (!article) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      );
    }

    // Get feedback summary (with tenant check for defense-in-depth)
    const [helpfulCount, notHelpfulCount] = await Promise.all([
      prisma.kBArticleFeedback.count({
        where: { articleId: id, tenantId, isHelpful: true },
      }),
      prisma.kBArticleFeedback.count({
        where: { articleId: id, tenantId, isHelpful: false },
      }),
    ]);

    return NextResponse.json({
      ...article,
      feedbackSummary: {
        helpful: helpfulCount,
        notHelpful: notHelpfulCount,
        total: helpfulCount + notHelpfulCount,
      },
    });
  } catch (error) {
    console.error("Error fetching KB article:", error);
    return NextResponse.json(
      { error: "Failed to fetch article" },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/kb/articles/[id] - Update article
// ============================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const tenantId = "demo-tenant";

    const validation = updateArticleSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      );
    }

    // Verify article exists and belongs to tenant
    const existing = await prisma.kBArticle.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: { id: true, status: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      );
    }

    const {
      title,
      subtitle,
      excerpt,
      contentJson,
      contentHtml,
      categoryId,
      tags,
      status,
      metaTitle,
      metaDescription,
    } = validation.data;

    // Cannot set status to "published" via PATCH - must use /publish endpoint
    if (status === "published" && existing.status !== "published") {
      return NextResponse.json(
        { error: "Use the /publish endpoint to publish an article" },
        { status: 400 }
      );
    }

    // Validate categoryId exists if provided
    if (categoryId) {
      const categoryExists = await prisma.kBCategory.findFirst({
        where: { id: categoryId, tenantId, deletedAt: null },
        select: { id: true },
      });

      if (!categoryExists) {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (subtitle !== undefined) updateData.subtitle = subtitle;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (contentJson !== undefined)
      updateData.contentJson = contentJson as Prisma.InputJsonValue;
    if (contentHtml !== undefined) updateData.contentHtml = contentHtml;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (tags !== undefined) updateData.tags = tags;
    if (status !== undefined) updateData.status = status;
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle;
    if (metaDescription !== undefined)
      updateData.metaDescription = metaDescription;

    const article = await prisma.kBArticle.update({
      where: { id },
      data: updateData,
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
    console.error("Error updating KB article:", error);
    return NextResponse.json(
      { error: "Failed to update article" },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/kb/articles/[id] - Soft delete
// ============================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = "demo-tenant";

    // Verify article exists and belongs to tenant
    const existing = await prisma.kBArticle.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      );
    }

    await prisma.kBArticle.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting KB article:", error);
    return NextResponse.json(
      { error: "Failed to delete article" },
      { status: 500 }
    );
  }
}
