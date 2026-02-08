import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const VALID_OBJECT_TYPES = ["contact", "company", "deal"];
const VALID_FIELD_TYPES = [
  "text", "number", "date", "datetime", "select", "multiselect",
  "checkbox", "email", "phone", "url",
];

// GET /api/properties?objectType=contact
export async function GET(request: NextRequest) {
  try {
    const tenantId = "84d5dd22-9e29-425c-8ba0-1edfc255e236";
    const { searchParams } = new URL(request.url);
    const objectType = searchParams.get("objectType");
    const groupName = searchParams.get("groupName");

    if (!objectType || !VALID_OBJECT_TYPES.includes(objectType)) {
      return NextResponse.json(
        { error: "objectType is required and must be one of: contact, company, deal" },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = { tenantId, objectType };
    if (groupName) where.groupName = groupName;

    const properties = await prisma.propertyDefinition.findMany({
      where,
      orderBy: [{ groupName: "asc" }, { orderIndex: "asc" }],
    });

    // Group by groupName for convenience
    const groups: Record<string, typeof properties> = {};
    for (const prop of properties) {
      const group = prop.groupName || "Other";
      if (!groups[group]) groups[group] = [];
      groups[group].push(prop);
    }

    return NextResponse.json({
      data: properties,
      groups,
      meta: { total: properties.length, objectType },
    });
  } catch (error) {
    console.error("Error fetching properties:", error);
    return NextResponse.json(
      { error: "Failed to fetch properties" },
      { status: 500 }
    );
  }
}

// POST /api/properties
export async function POST(request: NextRequest) {
  try {
    const tenantId = "84d5dd22-9e29-425c-8ba0-1edfc255e236";
    const body = await request.json();

    // Validate required fields
    if (!body.objectType || !VALID_OBJECT_TYPES.includes(body.objectType)) {
      return NextResponse.json(
        { error: "objectType is required and must be one of: contact, company, deal" },
        { status: 400 }
      );
    }
    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }
    if (!body.label || typeof body.label !== "string") {
      return NextResponse.json(
        { error: "label is required" },
        { status: 400 }
      );
    }
    if (!body.fieldType || !VALID_FIELD_TYPES.includes(body.fieldType)) {
      return NextResponse.json(
        { error: `fieldType is required and must be one of: ${VALID_FIELD_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate options for select/multiselect
    if (["select", "multiselect"].includes(body.fieldType)) {
      if (!body.options || !Array.isArray(body.options) || body.options.length === 0) {
        return NextResponse.json(
          { error: "options are required for select/multiselect fields" },
          { status: 400 }
        );
      }
    }

    // Normalize name to snake_case
    const name = body.name
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");

    // Check for duplicate name
    const existing = await prisma.propertyDefinition.findUnique({
      where: {
        tenantId_objectType_name: { tenantId, objectType: body.objectType, name },
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: `Property "${name}" already exists for ${body.objectType}` },
        { status: 409 }
      );
    }

    // Get max orderIndex for the group
    const maxOrder = await prisma.propertyDefinition.findFirst({
      where: { tenantId, objectType: body.objectType, groupName: body.groupName || null },
      orderBy: { orderIndex: "desc" },
      select: { orderIndex: true },
    });

    const property = await prisma.propertyDefinition.create({
      data: {
        tenantId,
        objectType: body.objectType,
        name,
        label: body.label,
        description: body.description || null,
        fieldType: body.fieldType,
        options: body.options || null,
        isRequired: body.isRequired || false,
        isReadonly: body.isReadonly || false,
        isSystem: false, // User-created properties are never system
        groupName: body.groupName || null,
        orderIndex: (maxOrder?.orderIndex ?? -1) + 1,
        defaultValue: body.defaultValue || null,
      },
    });

    return NextResponse.json({ data: property }, { status: 201 });
  } catch (error) {
    // Handle Prisma unique constraint violation (race condition)
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "A property with this name already exists" },
        { status: 409 }
      );
    }
    console.error("Error creating property:", error);
    return NextResponse.json(
      { error: "Failed to create property" },
      { status: 500 }
    );
  }
}
