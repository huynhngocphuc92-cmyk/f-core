import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { updateFieldsSchema } from "@/lib/validations/form";

// ============================================
// PUT /api/forms/[id]/fields - Batch update fields
// ============================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const tenantId = body.tenantId || "demo-tenant";

    const validation = updateFieldsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      );
    }

    // Verify form exists and belongs to tenant
    const form = await prisma.form.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: { id: true },
    });

    if (!form) {
      return NextResponse.json(
        { error: "Form not found" },
        { status: 404 }
      );
    }

    const { fields } = validation.data;

    // Atomic transaction: delete all existing fields, then create new ones
    const result = await prisma.$transaction(async (tx) => {
      // Delete all existing fields for this form
      await tx.formField.deleteMany({
        where: { formId: id },
      });

      // Create new fields
      if (fields.length > 0) {
        await tx.formField.createMany({
          data: fields.map((field, index) => ({
            formId: id,
            name: field.name,
            label: field.label,
            type: field.type,
            placeholder: field.placeholder || null,
            helpText: field.helpText || null,
            defaultValue: field.defaultValue || null,
            required: field.required ?? false,
            hidden: field.hidden ?? false,
            width: field.width ?? "full",
            orderIndex: field.orderIndex ?? index,
            options: (field.options as Prisma.InputJsonValue) ?? Prisma.JsonNull,
            validationRules: (field.validationRules as Prisma.InputJsonValue) ?? Prisma.JsonNull,
            conditionalLogic: (field.conditionalLogic as Prisma.InputJsonValue) ?? Prisma.JsonNull,
          })),
        });
      }

      // Return updated form with fields
      return tx.form.findUnique({
        where: { id },
        include: {
          fields: {
            orderBy: { orderIndex: "asc" },
          },
        },
      });
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating form fields:", error);
    return NextResponse.json(
      { error: "Failed to update form fields" },
      { status: 500 }
    );
  }
}
