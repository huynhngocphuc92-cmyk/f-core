import { describe, expect, it } from "vitest";
import { runAIEvalHarness } from "@/lib/ai/eval-harness";

describe("ai eval harness", () => {
  it("returns scenario benchmark summary", () => {
    const result = runAIEvalHarness();
    expect(result.totalScenarios).toBe(3);
    expect(result.scenarios.length).toBe(3);
    expect(result.averages.qualityScore).toBeGreaterThan(0);
  });

  it("can fail with very strict thresholds", () => {
    const result = runAIEvalHarness({
      thresholds: {
        minQuality: 99,
        maxLatencyMs: 1,
        maxCostUsd: 0.000001,
      },
    });
    expect(result.allPassed).toBe(false);
    expect(result.failedScenarios).toBeGreaterThan(0);
  });
});
