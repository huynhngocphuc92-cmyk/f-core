import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { z } from "zod";

const bulkActionSchema = z.object({
  action: z.enum(["delete", "update"]),
  ids: z.array(z.string()).min(1).max(500),
  data: z
    .object({
      field: z.string(),
      value: z.string(),
    })
    .optional(),
});

const ALLOWED_FIELDS: Record<string, string[]> = {
  contacts: [
    "lifecycleStage",
    "leadStatus",
    "ownerId",
    "city",
    "state",
    "country",
    "jobTitle",
    "department",
  ],
  companies: [],
  deals: [
    "ownerId",
    "stageId",
    "pipelineId",
    "priority",
    "dealType",
    "currency",
  ],
  tickets: ["status", "priority", "assigneeId", "category", "source"],
};

const ENTITY_MAP = {
  contacts: "contact",
  companies: "company",
  deals: "deal",
  tickets: "ticket",
} as const;

// POST /api/bulk/[entity] - Bulk delete or update entities
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ entity: string }> }
) {
  try {
    const { entity } = await params;
    const tenantId = await getTenantId(request);
    const body = await request.json();
    const data = bulkActionSchema.parse(body);

    if (!(entity in ENTITY_MAP)) {
      return NextResponse.json(
        { error: `Invalid entity: ${entity}. Use: contacts, companies, deals, tickets` },
        { status: 400 }
      );
    }

    const modelName = ENTITY_MAP[entity as keyof typeof ENTITY_MAP];

    if (data.action === "delete") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (prisma as any)[modelName].updateMany({
        where: {
          id: { in: data.ids },
          tenantId,
          deletedAt: null,
        },
        data: { deletedAt: new Date() },
      });

      return NextResponse.json({
        success: true,
        count: result.count,
      });
    }

    if (data.action === "update") {
      if (!data.data) {
        return NextResponse.json(
          { error: "Update data is required for bulk update" },
          { status: 400 }
        );
      }

      const allowedFields = ALLOWED_FIELDS[entity] || [];
      if (!allowedFields.includes(data.data.field)) {
        return NextResponse.json(
          {
            error: `Field "${data.data.field}" is not allowed for bulk update on ${entity}`,
          },
          { status: 400 }
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (prisma as any)[modelName].updateMany({
        where: {
          id: { in: data.ids },
          tenantId,
          deletedAt: null,
        },
        data: { [data.data.field]: data.data.value || null },
      });

      return NextResponse.json({
        success: true,
        count: result.count,
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
