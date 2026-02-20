import { NextRequest, NextResponse } from "next/server";
import { getTenantId } from "@/lib/auth-helpers";
import { ApiError, handleApiError } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit-helpers";
import {
  createExperiment,
  createExperimentSchema,
  listExperiments,
  summarizeExperiments,
} from "@/lib/marketing-experiments-store";

// GET /api/marketing/experiments - List A/B experiments with summary metrics
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const experiments = await listExperiments(tenantId);

    return NextResponse.json({
      data: experiments,
      summary: summarizeExperiments(experiments),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/marketing/experiments - Create A/B experiment
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const body = await request.json();
    const payload = createExperimentSchema.parse(body);
    let experiment;
    try {
      experiment = await createExperiment(tenantId, payload);
    } catch (error) {
      if (error instanceof Error && error.message.includes("traffic split")) {
        throw new ApiError(400, error.message);
      }
      if (error instanceof Error && error.message.includes("Variant keys must be unique")) {
        throw new ApiError(400, error.message);
      }
      throw error;
    }

    await logAuditEvent({
      request,
      action: "created",
      entity: "marketing_experiment",
      entityId: experiment.id,
      entityName: experiment.name,
      changes: {
        type: experiment.type,
        status: experiment.status,
        goal: experiment.goal,
        variants: experiment.variants.map((variant) => ({
          key: variant.key,
          trafficPct: variant.trafficPct,
        })),
      },
    });

    return NextResponse.json({ experiment }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
