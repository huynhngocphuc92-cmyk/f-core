import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId, checkOwnership, checkPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit-helpers";
import { z } from "zod";

const updatePropertySchema = z.object({
  label: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  options: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  isRequired: z.boolean().optional(),
  groupName: z.string().max(100).optional(),
  defaultValue: z.string().max(500).nullable().optional(),
});

// GET /api/properties/[id] - Get a single property definition
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await checkPermission("settings.read", request);
    const { id } = await params;
    await getTenantId(request);

    const property = await prisma.propertyDefinition.findUnique({
      where: { id },
    });

    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    await checkOwnership(property.tenantId, request);

    return NextResponse.json(property);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/properties/[id] - Update a property definition
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await checkPermission("settings.manage", request);
    const { id } = await params;
    await getTenantId(request);
    const body = await request.json();
    const data = updatePropertySchema.parse(body);

    const existing = await prisma.propertyDefinition.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    await checkOwnership(existing.tenantId, request);

    const property = await prisma.propertyDefinition.update({
      where: { id },
      data: {
        ...(data.label !== undefined && { label: data.label }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.options !== undefined && { options: data.options }),
        ...(data.isRequired !== undefined && { isRequired: data.isRequired }),
        ...(data.groupName !== undefined && { groupName: data.groupName }),
        ...(data.defaultValue !== undefined && {
          defaultValue: data.defaultValue,
        }),
      },
    });

    await logAuditEvent({
      request,
      action: "updated",
      entity: "property_definition",
      entityId: property.id,
      entityName: property.label,
      changes: {
        updatedFields: Object.keys(data),
      },
    });

    return NextResponse.json(property);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/properties/[id] - Delete a property definition
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await checkPermission("settings.manage", request);
    const { id } = await params;
    await getTenantId(request);

    const existing = await prisma.propertyDefinition.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    await checkOwnership(existing.tenantId, request);

    if (existing.isSystem) {
      return NextResponse.json(
        { error: "Cannot delete system properties" },
        { status: 400 }
      );
    }

    await prisma.propertyDefinition.delete({ where: { id } });

    await logAuditEvent({
      request,
      action: "deleted",
      entity: "property_definition",
      entityId: existing.id,
      entityName: existing.label,
      metadata: {
        objectType: existing.objectType,
        fieldType: existing.fieldType,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
