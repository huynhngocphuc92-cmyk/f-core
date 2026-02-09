import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { updateFormSchema } from "@/lib/validations/form";

// ============================================
// GET /api/forms/[id] - Get form by ID
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = "demo-tenant";

    const form = await prisma.form.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      include: {
        fields: {
          orderBy: { orderIndex: "asc" },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    });

    if (!form) {
      return NextResponse.json(
        { error: "Form not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(form);
  } catch (error) {
    console.error("Error fetching form:", error);
    return NextResponse.json(
      { error: "Failed to fetch form" },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/forms/[id] - Update form
// ============================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const tenantId = "demo-tenant";

    const validation = updateFormSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      );
    }

    // Verify form exists and belongs to tenant
    const existing = await prisma.form.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: { id: true, status: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Form not found" },
        { status: 404 }
      );
    }

    const { name, description, settings, theme, status } = validation.data;

    // Cannot set status to "published" via PATCH - must use /publish endpoint
    if (status === "published" && existing.status !== "published") {
      return NextResponse.json(
        { error: "Use the /publish endpoint to publish a form" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (settings !== undefined) updateData.settings = settings;
    if (theme !== undefined) updateData.theme = theme;
    if (status !== undefined) updateData.status = status;

    const form = await prisma.form.update({
      where: { id },
      data: updateData,
      include: {
        fields: {
          orderBy: { orderIndex: "asc" },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    });

    return NextResponse.json(form);
  } catch (error) {
    console.error("Error updating form:", error);
    return NextResponse.json(
      { error: "Failed to update form" },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/forms/[id] - Soft delete
// ============================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = "demo-tenant";

    // Verify form exists and belongs to tenant
    const existing = await prisma.form.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Form not found" },
        { status: 404 }
      );
    }

    await prisma.form.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting form:", error);
    return NextResponse.json(
      { error: "Failed to delete form" },
      { status: 500 }
    );
  }
}
