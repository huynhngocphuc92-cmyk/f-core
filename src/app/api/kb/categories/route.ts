import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createCategorySchema, slugify } from "@/lib/validations/kb";

// ============================================
// GET /api/kb/categories - List categories (tree)
// ============================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = "demo-tenant";
    const parentId = searchParams.get("parentId") || undefined;

    // Build where clause
    const where: Record<string, unknown> = {
      tenantId,
      deletedAt: null,
    };

    // If parentId is explicitly "null" or not provided, get root categories
    // If parentId is a specific ID, get children of that parent
    if (parentId === "null" || parentId === "root") {
      where.parentId = null;
    } else if (parentId) {
      where.parentId = parentId;
    }

    const categories = await prisma.kBCategory.findMany({
      where,
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
        _count: {
          select: {
            articles: {
              where: { deletedAt: null },
            },
          },
        },
      },
      orderBy: { orderIndex: "asc" },
    });

    return NextResponse.json({ data: categories });
  } catch (error) {
    console.error("Error fetching KB categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/kb/categories - Create category
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tenantId = "demo-tenant";

    const validation = createCategorySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { name, description, icon, parentId, orderIndex } = validation.data;

    // Generate slug from name
    const baseSlug = slugify(name);
    let slug = baseSlug;

    // Ensure unique slug within tenant + parentId
    const existingSlug = await prisma.kBCategory.findFirst({
      where: {
        tenantId,
        parentId: parentId || null,
        slug,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (existingSlug) {
      slug = `${baseSlug}-${Date.now()}`;
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

    const category = await prisma.kBCategory.create({
      data: {
        tenantId,
        name,
        slug,
        description: description || null,
        icon: icon || null,
        parentId: parentId || null,
        orderIndex: orderIndex ?? 0,
      },
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

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating KB category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
