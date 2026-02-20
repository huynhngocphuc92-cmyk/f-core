import { describe, expect, it } from "vitest";
import {
  evaluateReleaseReadiness,
  listReleaseChecklistGates,
  resetReleaseReadinessStoreForTests,
  upsertReleaseChecklistGates,
} from "@/lib/release-readiness";

describe("release readiness store", () => {
  it("evaluates required checklist gates and blocks release on failures", async () => {
    await resetReleaseReadinessStoreForTests();
    const tenantId = "tenant-release-readiness";
    const gates = await listReleaseChecklistGates(tenantId);
    expect(gates.length).toBeGreaterThan(0);

    const result = await evaluateReleaseReadiness(tenantId, {
      releaseTag: "v1.2.3-rc1",
      branch: "main",
      actor: "qa-bot",
      persist: true,
      observations: [
        { gateId: "unit_tests", status: "pass", durationMs: 1200 },
        { gateId: "build", status: "fail", durationMs: 1500, notes: "Type error in dashboard module" },
        { gateId: "security_regression", status: "pass", durationMs: 800 },
        { gateId: "ai_evals", status: "pass", durationMs: 700 },
      ],
    });

    expect(result.status).toBe("blocked");
    expect(result.blockers.find((item) => item.gateId === "build")).toBeTruthy();
  });

  it("supports gate policy updates (required/enabled)", async () => {
    await resetReleaseReadinessStoreForTests();
    const tenantId = "tenant-release-readiness-policy";
    const updated = await upsertReleaseChecklistGates(tenantId, [
      { id: "e2e_critical", required: true, enabled: true },
      { id: "ai_evals", enabled: false },
    ]);

    expect(updated.find((gate) => gate.id === "e2e_critical")?.required).toBe(true);
    expect(updated.find((gate) => gate.id === "ai_evals")?.enabled).toBe(false);
  });
});
