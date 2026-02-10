import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId, getCurrentUser } from "@/lib/auth-helpers";
import {
  validatePagination,
  buildWhereClause,
  paginatedResponse,
  handleApiError,
} from "@/lib/api-helpers";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const createLandingPageSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  contentHtml: z.string().optional(),
  contentJson: z.record(z.string(), z.unknown()).optional(),
  templateId: z.string().optional(),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(500).optional(),
  formId: z.string().optional(),
});

// GET /api/landing-pages - List landing pages
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const { page, limit, skip } = validatePagination(
      request.nextUrl.searchParams
    );

    const search = request.nextUrl.searchParams.get("search");
    const status = request.nextUrl.searchParams.get("status");

    const additionalWhere = {
      deletedAt: null,
      ...(status && status !== "all" ? { status } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { slug: { contains: search, mode: "insensitive" as const } },
              {
                metaTitle: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    };

    const where = buildWhereClause(tenantId, additionalWhere);

    const [pages, total] = await Promise.all([
      prisma.landingPage.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.landingPage.count({ where }),
    ]);

    return paginatedResponse(pages, total, page, limit);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/landing-pages - Create a landing page
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const user = await getCurrentUser(request);
    const body = await request.json();
    const data = createLandingPageSchema.parse(body);

    const slug =
      data.slug ||
      data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    const page = await prisma.landingPage.create({
      data: {
        tenantId,
        name: data.name,
        slug,
        description: data.description,
        contentHtml: data.contentHtml,
        contentJson: data.contentJson as Prisma.InputJsonValue,
        templateId: data.templateId,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        formId: data.formId,
        status: "draft",
        ownerId: user.id,
      },
      include: {
        owner: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(page, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
