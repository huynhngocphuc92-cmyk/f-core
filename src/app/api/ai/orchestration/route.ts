import { NextRequest, NextResponse } from "next/server";
import { checkPermission, getUserData } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { getCrmTools } from "@/lib/ai/tools";
import {
  getOrchestrationMemory,
  orchestrateRequestSchema,
  runOrchestration,
} from "@/lib/ai/orchestrator";

export async function GET(request: NextRequest) {
  try {
    const userData = await getUserData(request);
    await checkPermission("ai.use", request);
    const conversationId = request.nextUrl.searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json({
        error: "conversationId is required",
      }, { status: 400 });
    }

    return NextResponse.json({
      memory: await getOrchestrationMemory(userData.tenantId, conversationId),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userData = await getUserData(request);
    await checkPermission("ai.use", request);
    const body = await request.json();
    const payload = orchestrateRequestSchema.parse(body);

    const tools = getCrmTools(userData.tenantId, userData.id) as Record<string, unknown>;

    const result = await runOrchestration(payload, tools, {
      tenantId: userData.tenantId,
    });

    return NextResponse.json({
      data: result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
