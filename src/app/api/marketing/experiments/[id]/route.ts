import { NextRequest, NextResponse } from "next/server";
import { getTenantId } from "@/lib/auth-helpers";
import { ApiError, handleApiError } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit-helpers";
import {
  updateExperimentSchema,
  updateExperimentStatus,
} from "@/lib/marketing-experiments-store";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// PATCH /api/marketing/experiments/[id] - Start, pause, complete an A/B experiment
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const tenantId = await getTenantId(request);
    const { id } = await context.params;
    const body = await request.json();
    const payload = updateExperimentSchema.parse(body);

    let experiment;
    try {
      experiment = await updateExperimentStatus(tenantId, id, payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update experiment";
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
        action: payload.action,
        status: experiment.status,
        winnerVariantKey: experiment.winnerVariantKey,
      },
    });

    return NextResponse.json({ experiment });
  } catch (error) {
    return handleApiError(error);
  }
}
