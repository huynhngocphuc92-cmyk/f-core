import { ApiError } from "@/lib/api-helpers";

type UserRateState = {
  count: number;
  resetAtMs: number;
};

const HOUR_MS = 60 * 60 * 1000;
const userWindow = new Map<string, UserRateState>();

function getLimitPerHour() {
  const parsed = Number.parseInt(process.env.AI_RATE_LIMIT_PER_HOUR || "100", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 100;
  return parsed;
}

export function assertAIRateLimit(userId: string) {
  const now = Date.now();
  const current = userWindow.get(userId);
  const limit = getLimitPerHour();

  if (!current || current.resetAtMs <= now) {
    userWindow.set(userId, {
      count: 1,
      resetAtMs: now + HOUR_MS,
    });
    return;
  }

  if (current.count >= limit) {
    throw new ApiError(429, "AI rate limit exceeded for this user");
  }

  userWindow.set(userId, {
    ...current,
    count: current.count + 1,
  });
}

export function resetAIRateLimitStoreForTests() {
  userWindow.clear();
}
