import { describe, expect, it } from "vitest";
import {
  evaluateApiPerformance,
  listApiPerformanceBudgets,
  resetApiPerformanceStoreForTests,
  upsertApiPerformanceBudgets,
} from "@/lib/api-performance-budget";

describe("api performance budget store", () => {
  it("seeds default budgets and evaluates alerts", async () => {
    await resetApiPerformanceStoreForTests();
    const tenantId = "tenant-performance";
    const budgets = await listApiPerformanceBudgets(tenantId);
    expect(budgets.length).toBeGreaterThan(0);

    const evaluation = await evaluateApiPerformance(tenantId, {
      snapshots: [
        { endpoint: "/api/ai/chat", requestCount: 50, p95LatencyMs: 3000, errorRatePct: 0.5 },
      ],
      persist: true,
    });

    expect(evaluation.summary.checkedEndpoints).toBe(1);
    expect(evaluation.summary.breachedEndpoints).toBe(1);
    expect(evaluation.alerts.length).toBeGreaterThan(0);
  });

  it("updates budget thresholds", async () => {
    await resetApiPerformanceStoreForTests();
    const tenantId = "tenant-performance-update";
    const existing = (await listApiPerformanceBudgets(tenantId))[0];
    const oldLatency = existing.maxP95LatencyMs;
    const oldErrorRate = existing.maxErrorRatePct;

    const updated = await upsertApiPerformanceBudgets(tenantId, [
      {
        endpoint: existing.endpoint,
        maxP95LatencyMs: oldLatency + 100,
        maxErrorRatePct: oldErrorRate + 1,
        enabled: true,
      },
    ]);

    const changed = updated.find((item) => item.endpoint === existing.endpoint)!;
    expect(changed.maxP95LatencyMs).toBe(oldLatency + 100);
    expect(changed.maxErrorRatePct).toBe(oldErrorRate + 1);
  });
});
