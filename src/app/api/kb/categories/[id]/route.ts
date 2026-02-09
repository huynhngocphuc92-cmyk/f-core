import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { updateCategorySchema } from "@/lib/validations/kb";

// ============================================
// GET /api/kb/categories/[id] - Get category
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = "demo-tenant";

    const category = await prisma.kBCategory.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      include: {
        children: {
          where: { deletedAt: null },
          include: {
            _count: {
              select: {
                articles: {
                  where: { deletedAt: null },
                },
              },
            },
          },
          orderBy: { orderIndex: "asc" },
        },
        articles: {
          where: { deletedAt: null },
          orderBy: { publishedAt: "desc" },
          select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            status: true,
            publishedAt: true,
            viewCount: true,
            helpfulCount: true,
            notHelpfulCount: true,
            tags: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        _count: {
          select: {
            articles: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error fetching KB category:", error);
    return NextResponse.json(
      { error: "Failed to fetch category" },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/kb/categories/[id] - Update category
// ============================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const tenantId = "demo-tenant";

    const validation = updateCategorySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      );
    }

    // Verify category exists and belongs to tenant
    const existing = await prisma.kBCategory.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    const { name, description, icon, parentId, orderIndex, isVisible } =
      validation.data;

    // Prevent setting self as parent
    if (parentId && parentId === id) {
      return NextResponse.json(
        { error: "Category cannot be its own parent" },
        { status: 400 }
      );
    }

    // Validate parentId exists if provided
    if (parentId) {
      const parentCategory = await prisma.kBCategory.findFirst({
        where: { id: parentId, tenantId, deletedAt: null },
        select: { id: true },
      });

      if (!parentCategory) {
        return NextResponse.json(
          { error: "Parent category not found" },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (icon !== undefined) updateData.icon = icon;
    if (parentId !== undefined) updateData.parentId = parentId;
    if (orderIndex !== undefined) updateData.orderIndex = orderIndex;
    if (isVisible !== undefined) updateData.isVisible = isVisible;

    const category = await prisma.kBCategory.update({
      where: { id },
      data: updateData,
      include: {
        children: {
          where: { deletedAt: null },
          orderBy: { orderIndex: "asc" },
        },
        _count: {
          select: {
            articles: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error updating KB category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/kb/categories/[id] - Soft delete
// ============================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = "demo-tenant";

    // Verify category exists and belongs to tenant
    const existing = await prisma.kBCategory.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Soft delete category and uncategorize children + articles
    await prisma.$transaction([
      // Set children's parentId to null
      prisma.kBCategory.updateMany({
        where: { parentId: id, tenantId, deletedAt: null },
        data: { parentId: null },
      }),
      // Set articles' categoryId to null
      prisma.kBArticle.updateMany({
        where: { categoryId: id, tenantId, deletedAt: null },
        data: { categoryId: null },
      }),
      // Soft delete the category
      prisma.kBCategory.update({
        where: { id },
        data: { deletedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting KB category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
