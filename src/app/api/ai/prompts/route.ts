import { NextRequest, NextResponse } from "next/server";
import { checkPermission, getUserData } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import {
  aiAgentEnum,
  createPromptVersion,
  createPromptVersionSchema,
  listAllPromptVersions,
  listPromptVersions,
} from "@/lib/ai/prompt-governance";
import { logAuditEvent } from "@/lib/audit-helpers";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserData(request);
    await checkPermission("settings.manage", request);
    await checkPermission("ai.use", request);
    const agentParam = request.nextUrl.searchParams.get("agent");

    if (agentParam) {
      const agent = aiAgentEnum.parse(agentParam);
      return NextResponse.json({
        data: {
          agent,
          versions: await listPromptVersions(user.tenantId, agent),
        },
      });
    }

    return NextResponse.json({
      data: await listAllPromptVersions(user.tenantId),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserData(request);
    await checkPermission("settings.manage", request);
    await checkPermission("ai.use", request);
    const body = await request.json();
    const payload = createPromptVersionSchema.parse(body);

    const version = await createPromptVersion(user.tenantId, payload, user.id);

    await logAuditEvent({
      request,
      action: "created",
      entity: "ai_prompt_version",
      entityId: version.id,
      entityName: `${version.agent}:${version.label}`,
      metadata: {
        agent: version.agent,
        versionId: version.version,
        isActive: version.isActive,
      },
    });

    return NextResponse.json({ version }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
