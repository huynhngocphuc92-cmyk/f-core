import { describe, expect, it } from "vitest";
import { runAIEvalHarness } from "@/lib/ai/eval-harness";

describe("ai eval regression benchmarks", () => {
  it("meets baseline quality/latency/cost thresholds", () => {
    const result = runAIEvalHarness({
      thresholds: {
        minQuality: 70,
        maxLatencyMs: 250,
        maxCostUsd: 0.02,
      },
    });

    expect(result.allPassed).toBe(true);
    expect(result.failedScenarios).toBe(0);
  });
});
