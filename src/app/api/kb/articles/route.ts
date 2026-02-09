import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { createArticleSchema, slugify } from "@/lib/validations/kb";

// ============================================
// Helpers
// ============================================

const SORT_BY_WHITELIST = [
  "createdAt",
  "updatedAt",
  "title",
  "viewCount",
  "publishedAt",
] as const;

type SortByField = (typeof SORT_BY_WHITELIST)[number];

// ============================================
// GET /api/kb/articles - List articles
// ============================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = "demo-tenant";

    const status = searchParams.get("status");
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search") || "";
    const tagsParam = searchParams.get("tags");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20") || 20)
    );
    const sortByParam = searchParams.get("sortBy") || "createdAt";
    const sortOrder =
      searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    // Whitelist sortBy to prevent injection
    const sortBy: SortByField = SORT_BY_WHITELIST.includes(
      sortByParam as SortByField
    )
      ? (sortByParam as SortByField)
      : "createdAt";

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.KBArticleWhereInput = {
      tenantId,
      deletedAt: null,
      ...(status && { status }),
      ...(categoryId && { categoryId }),
    };

    // Search across title, excerpt
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" as const } },
        { excerpt: { contains: search, mode: "insensitive" as const } },
      ];
    }

    // Filter by tags
    if (tagsParam) {
      const tags = tagsParam.split(",").map((t) => t.trim());
      where.tags = { hasSome: tags };
    }

    const [articles, total] = await Promise.all([
      prisma.kBArticle.findMany({
        where,
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
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.kBArticle.count({ where }),
    ]);

    return NextResponse.json({
      data: articles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching KB articles:", error);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/kb/articles - Create article
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tenantId = "demo-tenant";

    const validation = createArticleSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
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

    // Generate slug from title
    const baseSlug = slugify(title);
    let slug = baseSlug;

    // Ensure unique slug within tenant
    const existingSlug = await prisma.kBArticle.findUnique({
      where: { tenantId_slug: { tenantId, slug } },
      select: { id: true },
    });

    if (existingSlug) {
      slug = `${baseSlug}-${Date.now()}`;
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

    const article = await prisma.kBArticle.create({
      data: {
        tenantId,
        title,
        slug,
        subtitle: subtitle || null,
        excerpt: excerpt || null,
        contentJson: contentJson
          ? (contentJson as Prisma.InputJsonValue)
          : undefined,
        contentHtml: contentHtml || null,
        categoryId: categoryId || null,
        tags: tags || [],
        status: "draft", // Always create as draft; use /publish to publish
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
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

    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    console.error("Error creating KB article:", error);
    return NextResponse.json(
      { error: "Failed to create article" },
      { status: 500 }
    );
  }
}
