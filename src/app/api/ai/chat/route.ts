import { streamText, UIMessage, convertToModelMessages, stepCountIs } from "ai";
import { NextRequest } from "next/server";
import { checkPermission, getUserData } from "@/lib/auth-helpers";
import { ApiError, handleApiError } from "@/lib/api-helpers";
import { getModel } from "@/lib/ai/provider";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { getCrmTools } from "@/lib/ai/tools";
import { runOrchestration } from "@/lib/ai/orchestrator";
import { getActivePromptVersion } from "@/lib/ai/prompt-governance";
import { assertAIRateLimit } from "@/lib/ai/rate-limit";
import { validateAIUserInput } from "@/lib/ai/security";
import { logAuditEvent } from "@/lib/audit-helpers";
import prisma from "@/lib/prisma";

function extractTextFromUIMessage(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

async function assertContextBelongsToTenant(input: {
  tenantId: string;
  contextType?: string | null;
  contextId?: string | null;
}) {
  if (!input.contextType || !input.contextId) return;

  if (!["contact", "company", "deal"].includes(input.contextType)) {
    throw new ApiError(400, "Invalid AI contextType");
  }

  if (input.contextType === "contact") {
    const contact = await prisma.contact.findFirst({
      where: { id: input.contextId, tenantId: input.tenantId, deletedAt: null },
      select: { id: true },
    });
    if (!contact) throw new ApiError(404, "AI context contact not found");
    return;
  }

  if (input.contextType === "company") {
    const company = await prisma.company.findFirst({
      where: { id: input.contextId, tenantId: input.tenantId, deletedAt: null },
      select: { id: true },
    });
    if (!company) throw new ApiError(404, "AI context company not found");
    return;
  }

  const deal = await prisma.deal.findFirst({
    where: { id: input.contextId, tenantId: input.tenantId, deletedAt: null },
    select: { id: true },
  });
  if (!deal) throw new ApiError(404, "AI context deal not found");
}

export async function POST(request: NextRequest) {
  try {
    const userData = await getUserData(request);
    await checkPermission("ai.use", request);
    assertAIRateLimit(userData.id);

    const { messages, conversationId, contextType, contextId } =
      await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new ApiError(400, "Messages are required");
    }

    let persistedConversation:
      | {
          id: string;
          title: string | null;
        }
      | null = null;
    if (conversationId) {
      persistedConversation = await prisma.aIConversation.findFirst({
        where: {
          id: conversationId,
          tenantId: userData.tenantId,
          userId: userData.id,
          deletedAt: null,
        },
        select: {
          id: true,
          title: true,
        },
      });

      if (!persistedConversation) {
        throw new ApiError(403, "Conversation is not accessible");
      }
    }

    await assertContextBelongsToTenant({
      tenantId: userData.tenantId,
      contextType,
      contextId,
    });

    for (const message of messages as UIMessage[]) {
      if (message.role !== "user") continue;
      validateAIUserInput(extractTextFromUIMessage(message));
    }

    const systemPrompt = buildSystemPrompt({
      tenantId: userData.tenantId,
      contextType,
    });
    const activePrompt = await getActivePromptVersion(userData.tenantId, "chat");

    const tools = getCrmTools(userData.tenantId, userData.id);
    const lastUserMsg = messages[messages.length - 1] as UIMessage | undefined;
    const lastUserText = lastUserMsg ? extractTextFromUIMessage(lastUserMsg) : "";

    const orchestration = await runOrchestration(
      {
        query: lastUserText || "General CRM assistance",
        conversationId: conversationId || undefined,
        policy: {
          allowWriteTools: false,
          maxSteps: 4,
        },
      },
      tools as Record<string, unknown>,
      {
        tenantId: userData.tenantId,
      }
    );

    const orchestrationContext = orchestration.blocked
      ? [
          "Orchestration guardrail blocked this request.",
          `Reason: ${orchestration.guardrailReason || "Policy violation detected."}`,
          "You must refuse harmful/sensitive requests and offer a safe alternative.",
        ].join("\n")
      : [
          "Orchestration summary:",
          orchestration.orchestrationSummary || "No tool summary.",
          orchestration.memory
            ? `Conversation memory facts: ${orchestration.memory.facts.join(" | ") || "none"}`
            : "Conversation memory facts: none",
        ].join("\n");

    const enhancedSystemPrompt = `${systemPrompt}

# Prompt Governance
Active chat prompt version: ${activePrompt.version} (${activePrompt.label})
${activePrompt.prompt}

# Agent Orchestration Layer
${orchestrationContext}`;

    // Convert UIMessages to ModelMessages for streamText
    const modelMessages = await convertToModelMessages(
      messages as UIMessage[],
    );

    const activeConversationId = conversationId || null;

    const result = streamText({
      model: getModel(),
      system: enhancedSystemPrompt,
      messages: modelMessages,
      tools,
      stopWhen: stepCountIs(5),
      maxOutputTokens: parseInt(process.env.AI_MAX_TOKENS || "4096", 10),
      onFinish: async ({ text, usage }) => {
        if (activeConversationId && text) {
          try {
            if (lastUserMsg?.role === "user") {
              await prisma.aIMessage.create({
                data: {
                  conversationId: activeConversationId,
                  role: "user",
                  content: extractTextFromUIMessage(lastUserMsg),
                },
              });
            }

            await prisma.aIMessage.create({
              data: {
                conversationId: activeConversationId,
                role: "assistant",
                content: text,
                promptTokens: usage?.inputTokens,
                completionTokens: usage?.outputTokens,
              },
            });

            // Auto-generate title from first user message
            if (!persistedConversation?.title && lastUserMsg?.role === "user") {
              const titleText = extractTextFromUIMessage(lastUserMsg);
              await prisma.aIConversation.update({
                where: { id: activeConversationId },
                data: { title: titleText.slice(0, 100) },
              });
            }
          } catch {
            // Don't fail the stream if persistence fails
          }
        }

        await logAuditEvent({
          tenantId: userData.tenantId,
          userId: userData.id,
          action: "usage_recorded",
          entity: "ai_chat",
          entityId: activeConversationId || undefined,
          metadata: {
            source: "ai_chat",
            inputTokens: usage?.inputTokens ?? null,
            outputTokens: usage?.outputTokens ?? null,
            totalTokens:
              typeof usage?.inputTokens === "number" &&
              typeof usage?.outputTokens === "number"
                ? usage.inputTokens + usage.outputTokens
                : null,
            contextType: contextType || null,
          },
        });
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    return handleApiError(error);
  }
}
