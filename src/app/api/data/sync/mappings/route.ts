import { NextRequest, NextResponse } from "next/server";
import { getTenantId } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit-helpers";
import {
  listSyncMappings,
  syncIntegrationSchema,
  syncObjectTypeSchema,
  upsertSyncMapping,
  upsertSyncMappingSchema,
} from "@/lib/data-sync-store";

// GET /api/data/sync/mappings - List sync mappings
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const integrationQuery = request.nextUrl.searchParams.get("integration");
    const objectTypeQuery = request.nextUrl.searchParams.get("objectType");

    const integration = integrationQuery ? syncIntegrationSchema.parse(integrationQuery) : undefined;
    const objectType = objectTypeQuery ? syncObjectTypeSchema.parse(objectTypeQuery) : undefined;

    return NextResponse.json({
      data: await listSyncMappings(tenantId, {
        integration,
        objectType,
      }),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/data/sync/mappings - Upsert sync mapping
export async function PUT(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const body = await request.json();
    const payload = upsertSyncMappingSchema.parse(body);

    const mapping = await upsertSyncMapping(tenantId, payload);

    await logAuditEvent({
      request,
      action: "updated",
      entity: "data_sync_mapping",
      entityId: mapping.id,
      entityName: `${mapping.integration}:${mapping.objectType}`,
      changes: {
        direction: mapping.direction,
        conflictResolution: mapping.conflictResolution,
        enabled: mapping.enabled,
        fields: mapping.fieldMappings.length,
      },
    });

    return NextResponse.json({ mapping });
  } catch (error) {
    return handleApiError(error);
  }
}
