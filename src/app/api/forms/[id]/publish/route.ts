import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { LAYOUT_FIELD_TYPES } from "@/lib/validations/form";

// ============================================
// POST /api/forms/[id]/publish - Publish form
// ============================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = "demo-tenant";

    // Verify form exists, belongs to tenant, and is not deleted
    const form = await prisma.form.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        fields: {
          select: { id: true, type: true },
        },
      },
    });

    if (!form) {
      return NextResponse.json(
        { error: "Form not found" },
        { status: 404 }
      );
    }

    if (form.status === "published") {
      return NextResponse.json(
        { error: "Form is already published" },
        { status: 400 }
      );
    }

    // Must have at least 1 non-layout field
    const inputFields = form.fields.filter(
      (f) => !LAYOUT_FIELD_TYPES.includes(f.type as (typeof LAYOUT_FIELD_TYPES)[number])
    );

    if (inputFields.length === 0) {
      return NextResponse.json(
        {
          error:
            "Form must have at least one input field (non-layout) before publishing",
        },
        { status: 400 }
      );
    }

    const updatedForm = await prisma.form.update({
      where: { id },
      data: {
        status: "published",
        publishedAt: new Date(),
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

    return NextResponse.json(updatedForm);
  } catch (error) {
    console.error("Error publishing form:", error);
    return NextResponse.json(
      { error: "Failed to publish form" },
      { status: 500 }
    );
  }
}
