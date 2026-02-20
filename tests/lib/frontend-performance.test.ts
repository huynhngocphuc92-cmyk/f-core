import { describe, expect, it } from "vitest";
import {
  evaluateFrontendPerformance,
  listFrontendThresholds,
  resetFrontendPerformanceStoreForTests,
  upsertFrontendThresholds,
} from "@/lib/frontend-performance";

describe("frontend performance store", () => {
  it("seeds thresholds and evaluates alerts", async () => {
    await resetFrontendPerformanceStoreForTests();
    const tenantId = "tenant-frontend-performance";
    const thresholds = await listFrontendThresholds(tenantId);
    expect(thresholds.length).toBeGreaterThan(0);

    const evaluation = await evaluateFrontendPerformance(tenantId, {
      snapshots: [{ route: "/dashboard", lcpMs: 3200, inpMs: 250, cls: 0.15, jsKb: 500 }],
      persist: true,
    });

    expect(evaluation.summary.checkedRoutes).toBe(1);
    expect(evaluation.summary.breachedRoutes).toBe(1);
    expect(evaluation.alerts.length).toBeGreaterThan(0);
  });

  it("updates route thresholds", async () => {
    await resetFrontendPerformanceStoreForTests();
    const tenantId = "tenant-frontend-performance-update";
    const current = (await listFrontendThresholds(tenantId))[0];
    const previousLcp = current.maxLcpMs;

    const updated = await upsertFrontendThresholds(tenantId, [
      {
        route: current.route,
        maxLcpMs: previousLcp + 200,
        maxInpMs: current.maxInpMs,
        maxCls: current.maxCls,
        maxJsKb: current.maxJsKb,
        enabled: true,
      },
    ]);
    const changed = updated.find((item) => item.route === current.route)!;
    expect(changed.maxLcpMs).toBe(previousLcp + 200);
  });
});
