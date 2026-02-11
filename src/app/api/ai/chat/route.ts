import { streamText, UIMessage, convertToModelMessages, stepCountIs } from "ai";
import { NextRequest } from "next/server";
import { getUserData } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { getModel } from "@/lib/ai/provider";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { getCrmTools } from "@/lib/ai/tools";
import prisma from "@/lib/prisma";

function extractTextFromUIMessage(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export async function POST(request: NextRequest) {
  try {
    const userData = await getUserData(request);
    const { messages, conversationId, contextType, contextId } =
      await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Resolve context name if attached
    let contextName: string | null = null;
    if (contextType && contextId) {
      if (contextType === "contact") {
        const c = await prisma.contact.findFirst({
          where: { id: contextId, tenantId: userData.tenantId },
          select: { firstName: true, lastName: true },
        });
        contextName = c
          ? `${c.firstName || ""} ${c.lastName || ""}`.trim()
          : null;
      } else if (contextType === "company") {
        const c = await prisma.company.findFirst({
          where: { id: contextId, tenantId: userData.tenantId },
          select: { name: true },
        });
        contextName = c?.name || null;
      } else if (contextType === "deal") {
        const d = await prisma.deal.findFirst({
          where: { id: contextId, tenantId: userData.tenantId },
          select: { name: true },
        });
        contextName = d?.name || null;
      }
    }

    const systemPrompt = buildSystemPrompt({
      tenantId: userData.tenantId,
      userName: userData.name || userData.email,
      contextType,
      contextName,
    });

    const tools = getCrmTools(userData.tenantId, userData.id);

    // Convert UIMessages to ModelMessages for streamText
    const modelMessages = await convertToModelMessages(
      messages as UIMessage[],
    );

    const result = streamText({
      model: getModel(),
      system: systemPrompt,
      messages: modelMessages,
      tools,
      stopWhen: stepCountIs(5),
      maxOutputTokens: parseInt(process.env.AI_MAX_TOKENS || "4096", 10),
      onFinish: async ({ text, usage }) => {
        if (conversationId && text) {
          try {
            const lastUserMsg = messages[messages.length - 1] as UIMessage;
            if (lastUserMsg?.role === "user") {
              await prisma.aIMessage.create({
                data: {
                  conversationId,
                  role: "user",
                  content: extractTextFromUIMessage(lastUserMsg),
                },
              });
            }

            await prisma.aIMessage.create({
              data: {
                conversationId,
                role: "assistant",
                content: text,
                promptTokens: usage?.inputTokens,
                completionTokens: usage?.outputTokens,
              },
            });

            // Auto-generate title from first user message
            const conv = await prisma.aIConversation.findUnique({
              where: { id: conversationId },
              select: { title: true },
            });
            if (!conv?.title && lastUserMsg?.role === "user") {
              const titleText = extractTextFromUIMessage(lastUserMsg);
              await prisma.aIConversation.update({
                where: { id: conversationId },
                data: { title: titleText.slice(0, 100) },
              });
            }
          } catch {
            // Don't fail the stream if persistence fails
          }
        }
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    return handleApiError(error);
  }
}
