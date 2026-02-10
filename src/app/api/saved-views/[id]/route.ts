import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId, checkOwnership } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const updateSavedViewSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  filters: z.array(z.record(z.string(), z.unknown())).optional(),
  columns: z.array(z.string()).optional(),
  sortBy: z.string().max(100).nullable().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  isDefault: z.boolean().optional(),
  isShared: z.boolean().optional(),
});

// GET /api/saved-views/[id] - Get a single saved view
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await getTenantId(request);

    const view = await prisma.savedView.findFirst({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!view) {
      return NextResponse.json(
        { error: "Saved view not found" },
        { status: 404 }
      );
    }

    await checkOwnership(view.tenantId, request);

    return NextResponse.json(view);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/saved-views/[id] - Update a saved view
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await getTenantId(request);
    const body = await request.json();
    const data = updateSavedViewSchema.parse(body);

    const existing = await prisma.savedView.findFirst({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Saved view not found" },
        { status: 404 }
      );
    }

    await checkOwnership(existing.tenantId, request);

    // If setting as default, unset other defaults for this module
    if (data.isDefault) {
      await prisma.savedView.updateMany({
        where: {
          tenantId: existing.tenantId,
          module: existing.module,
          isDefault: true,
          id: { not: id },
        },
        data: { isDefault: false },
      });
    }

    const view = await prisma.savedView.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.filters !== undefined && {
          filters: data.filters as Prisma.InputJsonValue,
        }),
        ...(data.columns !== undefined && {
          columns: data.columns as Prisma.InputJsonValue,
        }),
        ...(data.sortBy !== undefined && { sortBy: data.sortBy }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
        ...(data.isShared !== undefined && { isShared: data.isShared }),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(view);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/saved-views/[id] - Delete a saved view (hard delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await getTenantId(request);

    const existing = await prisma.savedView.findFirst({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Saved view not found" },
        { status: 404 }
      );
    }

    await checkOwnership(existing.tenantId, request);

    await prisma.savedView.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
