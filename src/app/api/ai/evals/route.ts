import { NextRequest, NextResponse } from "next/server";
import { checkPermission, getUserData } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { aiEvalThresholdSchema, runAIEvalHarness } from "@/lib/ai/eval-harness";
import { z } from "zod";

const evalRequestSchema = z.object({
  thresholds: aiEvalThresholdSchema.partial().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await getUserData(request);
    await checkPermission("ai.use", request);
    await checkPermission("reports.manage", request);
    const payload = evalRequestSchema.parse({
      thresholds: {
        minQuality: request.nextUrl.searchParams.get("minQuality")
          ? Number(request.nextUrl.searchParams.get("minQuality"))
          : undefined,
        maxLatencyMs: request.nextUrl.searchParams.get("maxLatencyMs")
          ? Number(request.nextUrl.searchParams.get("maxLatencyMs"))
          : undefined,
        maxCostUsd: request.nextUrl.searchParams.get("maxCostUsd")
          ? Number(request.nextUrl.searchParams.get("maxCostUsd"))
          : undefined,
      },
    });

    const data = runAIEvalHarness(payload);
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await getUserData(request);
    await checkPermission("ai.use", request);
    await checkPermission("reports.manage", request);
    const body = await request.json();
    const payload = evalRequestSchema.parse(body);
    const data = runAIEvalHarness(payload);
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
