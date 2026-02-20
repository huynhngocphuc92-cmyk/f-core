import { NextRequest, NextResponse } from "next/server";
import { getTenantId } from "@/lib/auth-helpers";
import { ApiError, handleApiError } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit-helpers";
import {
  experimentEventSchema,
  recordExperimentEvent,
} from "@/lib/marketing-experiments-store";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// POST /api/marketing/experiments/[id]/events - Record exposure/conversion event
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const tenantId = await getTenantId(request);
    const { id } = await context.params;
    const body = await request.json();
    const payload = experimentEventSchema.parse(body);

    let experiment;
    try {
      experiment = await recordExperimentEvent(tenantId, id, payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to record experiment event";
      if (message === "Experiment not found") {
        throw new ApiError(404, message);
      }
      throw new ApiError(409, message);
    }

    await logAuditEvent({
      request,
      action: "updated",
      entity: "marketing_experiment",
      entityId: experiment.id,
      entityName: experiment.name,
      changes: {
        eventType: payload.eventType,
        variantKey: payload.variantKey,
      },
    });

    return NextResponse.json({ experiment });
  } catch (error) {
    return handleApiError(error);
  }
}
