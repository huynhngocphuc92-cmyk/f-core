import { createAnthropic } from "@ai-sdk/anthropic";

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL || undefined,
});

export function getModel() {
  const modelId = process.env.AI_MODEL || "claude-sonnet-4-5";
  return anthropic(modelId);
}
