import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// ============================================
// POST /api/forms/[id]/duplicate - Duplicate form
// ============================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = "demo-tenant";

    // Find the original form with fields
    const original = await prisma.form.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        fields: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!original) {
      return NextResponse.json(
        { error: "Form not found" },
        { status: 404 }
      );
    }

    const timestamp = Date.now();
    const newName = `Copy of ${original.name}`;
    const newSlug = `${original.slug}-copy-${timestamp}`;

    // Create duplicated form with all fields in a transaction
    const duplicated = await prisma.$transaction(async (tx) => {
      // Create the form copy
      const newForm = await tx.form.create({
        data: {
          tenantId,
          name: newName,
          slug: newSlug,
          description: original.description,
          status: "draft",
          settings: (original.settings as Prisma.InputJsonValue) ?? {},
          theme: (original.theme as Prisma.InputJsonValue) ?? {},
        },
      });

      // Copy all fields
      if (original.fields.length > 0) {
        await tx.formField.createMany({
          data: original.fields.map((field) => ({
            formId: newForm.id,
            name: field.name,
            label: field.label,
            type: field.type,
            placeholder: field.placeholder,
            helpText: field.helpText,
            defaultValue: field.defaultValue,
            required: field.required,
            hidden: field.hidden,
            width: field.width,
            orderIndex: field.orderIndex,
            options: field.options === null ? Prisma.JsonNull : (field.options as Prisma.InputJsonValue),
            validationRules: field.validationRules === null ? Prisma.JsonNull : (field.validationRules as Prisma.InputJsonValue),
            conditionalLogic: field.conditionalLogic === null ? Prisma.JsonNull : (field.conditionalLogic as Prisma.InputJsonValue),
          })),
        });
      }

      // Return the new form with fields
      return tx.form.findUnique({
        where: { id: newForm.id },
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
    });

    return NextResponse.json(duplicated, { status: 201 });
  } catch (error) {
    console.error("Error duplicating form:", error);
    return NextResponse.json(
      { error: "Failed to duplicate form" },
      { status: 500 }
    );
  }
}
