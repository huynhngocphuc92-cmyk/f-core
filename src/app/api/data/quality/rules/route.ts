import { NextRequest, NextResponse } from "next/server";
import { getTenantId } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit-helpers";
import { listQualityRules, upsertQualityRule, upsertQualityRulesSchema } from "@/lib/data-quality-store";

// GET /api/data/quality/rules - List quality rules by object type
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    return NextResponse.json({ data: await listQualityRules(tenantId) });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/data/quality/rules - Upsert quality rule
export async function PUT(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const body = await request.json();
    const payload = upsertQualityRulesSchema.parse(body);

    const rule = await upsertQualityRule(tenantId, payload);

    await logAuditEvent({
      request,
      action: "updated",
      entity: "data_quality_rule",
      entityId: rule.objectType,
      entityName: rule.objectType,
      changes: {
        requireEmail: rule.requireEmail,
        requirePhone: rule.requirePhone,
        requireDomain: rule.requireDomain,
        minNameLength: rule.minNameLength,
        autoMergeExactKey: rule.autoMergeExactKey,
      },
    });

    return NextResponse.json({ rule });
  } catch (error) {
    return handleApiError(error);
  }
}
