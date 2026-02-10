import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId, checkOwnership } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const updateLandingPageSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z.string().max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  contentHtml: z.string().nullable().optional(),
  contentJson: z.record(z.string(), z.unknown()).nullable().optional(),
  templateId: z.string().nullable().optional(),
  metaTitle: z.string().max(200).nullable().optional(),
  metaDescription: z.string().max(500).nullable().optional(),
  formId: z.string().nullable().optional(),
});

// GET /api/landing-pages/[id] - Get a single landing page
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await getTenantId(request);

    const page = await prisma.landingPage.findFirst({
      where: { id, deletedAt: null },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    if (!page) {
      return NextResponse.json(
        { error: "Landing page not found" },
        { status: 404 }
      );
    }

    await checkOwnership(page.tenantId, request);

    return NextResponse.json(page);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/landing-pages/[id] - Update a landing page
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await getTenantId(request);
    const body = await request.json();
    const data = updateLandingPageSchema.parse(body);

    const existing = await prisma.landingPage.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Landing page not found" },
        { status: 404 }
      );
    }

    await checkOwnership(existing.tenantId, request);

    const page = await prisma.landingPage.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.status !== undefined && {
          status: data.status,
          ...(data.status === "published" && existing.status !== "published"
            ? { publishedAt: new Date() }
            : {}),
        }),
        ...(data.contentHtml !== undefined && {
          contentHtml: data.contentHtml,
        }),
        ...(data.contentJson !== undefined && {
          contentJson: data.contentJson as Prisma.InputJsonValue,
        }),
        ...(data.templateId !== undefined && { templateId: data.templateId }),
        ...(data.metaTitle !== undefined && { metaTitle: data.metaTitle }),
        ...(data.metaDescription !== undefined && {
          metaDescription: data.metaDescription,
        }),
        ...(data.formId !== undefined && { formId: data.formId }),
      },
      include: {
        owner: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(page);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/landing-pages/[id] - Soft delete a landing page
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await getTenantId(request);

    const existing = await prisma.landingPage.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Landing page not found" },
        { status: 404 }
      );
    }

    await checkOwnership(existing.tenantId, request);

    await prisma.landingPage.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
