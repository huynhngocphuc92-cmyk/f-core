import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getTenantId } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit-helpers";
import {
  createReusableBlock,
  createReusableBlockSchema,
  listReusableBlocks,
  pageSectionTypeSchema,
} from "@/lib/content-page-builder";

// GET /api/content/pages/blocks - List reusable content blocks
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const sectionTypeQuery = request.nextUrl.searchParams.get("sectionType");
    const sectionType = sectionTypeQuery ? pageSectionTypeSchema.parse(sectionTypeQuery) : undefined;

    return NextResponse.json({
      data: await listReusableBlocks(tenantId, { sectionType }),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/content/pages/blocks - Create reusable block
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const user = await getCurrentUser(request);
    const body = await request.json();
    const payload = createReusableBlockSchema.parse(body);

    const block = await createReusableBlock(tenantId, user.id, payload);

    await logAuditEvent({
      request,
      action: "created",
      entity: "content_reusable_block",
      entityId: block.id,
      entityName: block.name,
      changes: {
        sectionType: block.sectionType,
      },
    });

    return NextResponse.json({ block }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
