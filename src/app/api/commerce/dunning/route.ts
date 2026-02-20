import { NextRequest, NextResponse } from "next/server";
import { getTenantId } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit-helpers";
import {
  createDunningCase,
  createDunningCaseSchema,
  getDunningConfig,
  listDunningCases,
  summarizeDunningCases,
  updateDunningConfig,
  updateDunningConfigSchema,
} from "@/lib/dunning-store";

// GET /api/commerce/dunning - Dunning config + failed payment queue
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const config = await getDunningConfig(tenantId);
    const cases = await listDunningCases(tenantId);

    return NextResponse.json({
      config,
      data: cases,
      summary: summarizeDunningCases(cases),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/commerce/dunning - Update dunning schedule and notification channels
export async function PUT(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const body = await request.json();
    const payload = updateDunningConfigSchema.parse(body);

    const config = await updateDunningConfig(tenantId, payload);

    await logAuditEvent({
      request,
      action: "updated",
      entity: "dunning_config",
      entityId: tenantId,
      entityName: "Dunning Config",
      changes: {
        retryDelaysHours: config.retryDelaysHours,
        maxRetries: config.maxRetries,
        cancelAfterMaxRetries: config.cancelAfterMaxRetries,
        notifyChannels: config.notifyChannels,
      },
    });

    return NextResponse.json({ config });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/commerce/dunning - Register failed payment for retry workflow
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const body = await request.json();
    const payload = createDunningCaseSchema.parse(body);

    const dunningCase = await createDunningCase(tenantId, payload);

    await logAuditEvent({
      request,
      action: "created",
      entity: "dunning_case",
      entityId: dunningCase.id,
      entityName: dunningCase.customerName,
      changes: {
        amount: dunningCase.amount,
        currency: dunningCase.currency,
        attemptCount: dunningCase.attemptCount,
        nextRetryAt: dunningCase.nextRetryAt,
      },
    });

    return NextResponse.json({ dunningCase }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
