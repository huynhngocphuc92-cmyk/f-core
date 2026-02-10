import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";
import {
  validatePagination,
  buildWhereClause,
  paginatedResponse,
  handleApiError,
} from "@/lib/api-helpers";
import { z } from "zod";

const createPropertySchema = z.object({
  name: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z][a-z0-9_]*$/, "Name must be snake_case"),
  label: z.string().min(1).max(200),
  objectType: z.enum(["contact", "company", "deal"]),
  fieldType: z.enum([
    "text",
    "number",
    "date",
    "datetime",
    "select",
    "multiselect",
    "checkbox",
    "email",
    "phone",
    "url",
  ]),
  description: z.string().max(500).optional(),
  options: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  isRequired: z.boolean().optional(),
  groupName: z.string().max(100).optional(),
  defaultValue: z.string().max(500).optional(),
});

// GET /api/properties - List property definitions
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const { page, limit, skip } = validatePagination(
      request.nextUrl.searchParams
    );

    const objectType = request.nextUrl.searchParams.get("objectType");

    const additionalWhere = {
      ...(objectType ? { objectType } : {}),
    };

    const where = buildWhereClause(tenantId, additionalWhere);

    const [properties, total] = await Promise.all([
      prisma.propertyDefinition.findMany({
        where,
        orderBy: [
          { objectType: "asc" },
          { groupName: "asc" },
          { orderIndex: "asc" },
        ],
        skip,
        take: limit,
      }),
      prisma.propertyDefinition.count({ where }),
    ]);

    return paginatedResponse(properties, total, page, limit);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/properties - Create a property definition
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const body = await request.json();
    const data = createPropertySchema.parse(body);

    // Check uniqueness
    const existing = await prisma.propertyDefinition.findUnique({
      where: {
        tenantId_objectType_name: {
          tenantId,
          objectType: data.objectType,
          name: data.name,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: `Property "${data.name}" already exists for ${data.objectType}`,
        },
        { status: 409 }
      );
    }

    // Auto-calculate orderIndex
    const maxOrder = await prisma.propertyDefinition.findFirst({
      where: {
        tenantId,
        objectType: data.objectType,
        groupName: data.groupName || "Custom Properties",
      },
      orderBy: { orderIndex: "desc" },
      select: { orderIndex: true },
    });

    const property = await prisma.propertyDefinition.create({
      data: {
        tenantId,
        objectType: data.objectType,
        name: data.name,
        label: data.label,
        description: data.description,
        fieldType: data.fieldType,
        options: data.options,
        isRequired: data.isRequired ?? false,
        groupName: data.groupName || "Custom Properties",
        orderIndex: (maxOrder?.orderIndex ?? -1) + 1,
        defaultValue: data.defaultValue,
      },
    });

    return NextResponse.json(property, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
