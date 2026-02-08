import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const VALID_FIELD_TYPES = [
  "text", "number", "date", "datetime", "select", "multiselect",
  "checkbox", "email", "phone", "url",
];

// GET /api/properties/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = "84d5dd22-9e29-425c-8ba0-1edfc255e236";

    const property = await prisma.propertyDefinition.findUnique({
      where: { id, tenantId },
    });

    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: property });
  } catch (error) {
    console.error("Error fetching property:", error);
    return NextResponse.json(
      { error: "Failed to fetch property" },
      { status: 500 }
    );
  }
}

// PATCH /api/properties/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const tenantId = "84d5dd22-9e29-425c-8ba0-1edfc255e236";

    const existing = await prisma.propertyDefinition.findUnique({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    // System properties: only description, orderIndex, defaultValue can be updated
    // Non-system properties: all fields except name/objectType can be updated
    if (body.label !== undefined) {
      if (typeof body.label !== "string" || body.label.trim().length === 0) {
        return NextResponse.json({ error: "label must be a non-empty string" }, { status: 400 });
      }
      if (existing.isSystem) {
        return NextResponse.json({ error: "System property labels cannot be modified" }, { status: 403 });
      }
      updateData.label = body.label.trim();
    }
    if (body.description !== undefined) {
      if (body.description !== null && typeof body.description !== "string") {
        return NextResponse.json({ error: "description must be a string or null" }, { status: 400 });
      }
      updateData.description = body.description;
    }
    if (body.groupName !== undefined) {
      if (body.groupName !== null && typeof body.groupName !== "string") {
        return NextResponse.json({ error: "groupName must be a string or null" }, { status: 400 });
      }
      updateData.groupName = body.groupName;
    }
    if (body.orderIndex !== undefined) {
      if (typeof body.orderIndex !== "number") {
        return NextResponse.json({ error: "orderIndex must be a number" }, { status: 400 });
      }
      updateData.orderIndex = body.orderIndex;
    }
    if (body.defaultValue !== undefined) {
      if (body.defaultValue !== null && typeof body.defaultValue !== "string") {
        return NextResponse.json({ error: "defaultValue must be a string or null" }, { status: 400 });
      }
      updateData.defaultValue = body.defaultValue;
    }

    // Non-system properties can update more fields
    if (!existing.isSystem) {
      if (body.isRequired !== undefined) updateData.isRequired = !!body.isRequired;
      if (body.isReadonly !== undefined) updateData.isReadonly = !!body.isReadonly;

      if (body.fieldType !== undefined && VALID_FIELD_TYPES.includes(body.fieldType)) {
        updateData.fieldType = body.fieldType;
      }
    }

    // Options can be updated for select/multiselect
    if (body.options !== undefined) {
      const fieldType = (updateData.fieldType as string) || existing.fieldType;
      if (["select", "multiselect"].includes(fieldType)) {
        updateData.options = body.options;
      }
    }

    const property = await prisma.propertyDefinition.update({
      where: { id, tenantId },
      data: updateData,
    });

    return NextResponse.json({ data: property });
  } catch (error) {
    console.error("Error updating property:", error);
    return NextResponse.json(
      { error: "Failed to update property" },
      { status: 500 }
    );
  }
}

// DELETE /api/properties/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = "84d5dd22-9e29-425c-8ba0-1edfc255e236";

    const existing = await prisma.propertyDefinition.findUnique({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    // System properties cannot be deleted
    if (existing.isSystem) {
      return NextResponse.json(
        { error: "System properties cannot be deleted" },
        { status: 403 }
      );
    }

    await prisma.propertyDefinition.delete({ where: { id, tenantId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting property:", error);
    return NextResponse.json(
      { error: "Failed to delete property" },
      { status: 500 }
    );
  }
}
