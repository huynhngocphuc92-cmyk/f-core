import { beforeEach, describe, expect, it } from "vitest";
import {
  getSalesPlaybookRunProgress,
  resetSalesPlaybookStoreForTests,
  startSalesPlaybookRun,
  updateSalesPlaybookStep,
} from "@/lib/sales-playbook-store";

const TENANT_ID = "tenant-test-id";

describe("sales playbook store", () => {
  beforeEach(async () => {
    await resetSalesPlaybookStoreForTests();
  });

  it("starts a run and computes progress", async () => {
    const run = await startSalesPlaybookRun({
      tenantId: TENANT_ID,
      dealId: "deal-1",
      templateId: "discovery-qualification",
    });

    const progress = getSalesPlaybookRunProgress(run);
    expect(run.status).toBe("active");
    expect(progress.totalSteps).toBeGreaterThan(0);
    expect(progress.progressPct).toBe(0);
  });

  it("marks steps complete and closes run when all done", async () => {
    let run = await startSalesPlaybookRun({
      tenantId: TENANT_ID,
      dealId: "deal-1",
      templateId: "proposal-negotiation",
    });

    for (const step of run.steps) {
      const updated = await updateSalesPlaybookStep({
        tenantId: TENANT_ID,
        runId: run.id,
        stepId: step.id,
        completed: true,
      });
      expect(updated).toBeTruthy();
      run = updated!;
    }

    expect(run.status).toBe("completed");
    expect(run.completedAt).not.toBeNull();
    const progress = getSalesPlaybookRunProgress(run);
    expect(progress.progressPct).toBe(100);
  });
});
