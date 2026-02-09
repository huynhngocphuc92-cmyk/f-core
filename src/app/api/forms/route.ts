import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { createFormSchema } from "@/lib/validations/form";

// ============================================
// Helpers
// ============================================

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const SORT_BY_WHITELIST = [
  "createdAt",
  "updatedAt",
  "name",
  "status",
  "viewCount",
] as const;

type SortByField = (typeof SORT_BY_WHITELIST)[number];

// ============================================
// GET /api/forms - List forms
// ============================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const tenantId = "demo-tenant";
    const status = searchParams.get("status");
    const search = searchParams.get("search") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const sortByParam = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    // Whitelist sortBy to prevent injection
    const sortBy: SortByField = SORT_BY_WHITELIST.includes(sortByParam as SortByField)
      ? (sortByParam as SortByField)
      : "createdAt";

    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      deletedAt: null,
      ...(status && { status }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    const [forms, total] = await Promise.all([
      prisma.form.findMany({
        where,
        include: {
          _count: {
            select: {
              submissions: true,
              fields: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.form.count({ where }),
    ]);

    return NextResponse.json({
      data: forms,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching forms:", error);
    return NextResponse.json(
      { error: "Failed to fetch forms" },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/forms - Create form
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = createFormSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { name, description, settings, theme } = validation.data;
    const tenantId = body.tenantId || "demo-tenant";

    // Generate slug from name
    const baseSlug = slugify(name);
    let slug = baseSlug;

    // Ensure unique slug within tenant
    const existingSlug = await prisma.form.findUnique({
      where: { tenantId_slug: { tenantId, slug } },
      select: { id: true },
    });

    if (existingSlug) {
      slug = `${baseSlug}-${Date.now()}`;
    }

    const form = await prisma.form.create({
      data: {
        tenantId,
        name,
        slug,
        description: description || null,
        settings: (settings || {}) as Prisma.InputJsonValue,
        theme: (theme || {}) as Prisma.InputJsonValue,
      },
      include: {
        _count: {
          select: {
            submissions: true,
            fields: true,
          },
        },
      },
    });

    return NextResponse.json(form, { status: 201 });
  } catch (error) {
    console.error("Error creating form:", error);
    return NextResponse.json(
      { error: "Failed to create form" },
      { status: 500 }
    );
  }
}
