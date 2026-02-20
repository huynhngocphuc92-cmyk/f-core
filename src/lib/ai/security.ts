import { ApiError } from "@/lib/api-helpers";

const promptInjectionPatterns: RegExp[] = [
  /\b(ignore|disregard)\b.{0,32}\b(previous|prior|above)\b.{0,32}\b(instruction|rule|prompt)\b/i,
  /\b(reveal|show|print)\b.{0,40}\b(system\s*prompt|hidden\s*prompt|developer\s*message)\b/i,
  /\b(act\s+as)\b.{0,30}\b(system|developer|admin)\b/i,
  /\b(jailbreak|bypass|override)\b.{0,40}\b(safety|policy|guardrail)\b/i,
];

function normalizeText(input: string) {
  return input.replace(/\s+/g, " ").trim();
}

export function validateAIUserInput(text: string) {
  const normalized = normalizeText(text);
  if (!normalized) {
    throw new ApiError(400, "User message is empty");
  }

  if (normalized.length > 8000) {
    throw new ApiError(400, "User message exceeds size limit");
  }

  for (const pattern of promptInjectionPatterns) {
    if (pattern.test(normalized)) {
      throw new ApiError(
        400,
        "Input blocked by AI safety policy (potential prompt-injection pattern)"
      );
    }
  }
}
