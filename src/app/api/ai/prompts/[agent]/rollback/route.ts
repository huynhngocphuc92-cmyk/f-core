import { NextRequest, NextResponse } from "next/server";
import { checkPermission, getUserData } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import {
  aiAgentEnum,
  rollbackPromptVersion,
  rollbackPromptVersionSchema,
} from "@/lib/ai/prompt-governance";
import { logAuditEvent } from "@/lib/audit-helpers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ agent: string }> }
) {
  try {
    const user = await getUserData(request);
    await checkPermission("settings.manage", request);
    await checkPermission("ai.use", request);
    const { agent } = await params;
    const parsedAgent = aiAgentEnum.parse(agent);
    const body = await request.json();
    const payload = rollbackPromptVersionSchema.parse(body);

    const activeVersion = await rollbackPromptVersion(user.tenantId, {
      agent: parsedAgent,
      versionId: payload.versionId,
    });

    await logAuditEvent({
      request,
      action: "rolled_back",
      entity: "ai_prompt_version",
      entityId: activeVersion.id,
      entityName: `${activeVersion.agent}:${activeVersion.label}`,
      metadata: {
        agent: activeVersion.agent,
        versionId: activeVersion.version,
      },
    });

    return NextResponse.json({ activeVersion });
  } catch (error) {
    return handleApiError(error);
  }
}
