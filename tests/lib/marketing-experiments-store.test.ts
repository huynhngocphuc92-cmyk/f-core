import { beforeEach, describe, expect, it } from "vitest";
import {
  createExperiment,
  recordExperimentEvent,
  resetMarketingExperimentsStoreForTests,
  summarizeExperiments,
  updateExperimentStatus,
} from "@/lib/marketing-experiments-store";

const TENANT_ID = "tenant-test-id";

describe("marketing experiments store", () => {
  beforeEach(async () => {
    await resetMarketingExperimentsStoreForTests();
  });

  it("creates experiment with variant split", async () => {
    const experiment = await createExperiment(TENANT_ID, {
      name: "Landing CTA",
      type: "landing_page",
      targetId: "lp-1",
      goal: "form_submission",
      variants: [
        { key: "A", name: "Control", trafficPct: 50 },
        { key: "B", name: "Variant", trafficPct: 50 },
      ],
    });

    expect(experiment.status).toBe("draft");
    expect(experiment.variants).toHaveLength(2);
    expect(experiment.variants[0].exposures).toBe(0);
  });

  it("rejects invalid traffic split", async () => {
    await expect(
      createExperiment(TENANT_ID, {
        name: "Landing CTA",
        type: "landing_page",
        targetId: "lp-1",
        goal: "form_submission",
        variants: [
          { key: "A", name: "Control", trafficPct: 60 },
          { key: "B", name: "Variant", trafficPct: 20 },
        ],
      })
    ).rejects.toThrow("Variant traffic split must total 100%");
  });

  it("records exposure and conversion for running experiment", async () => {
    const experiment = await createExperiment(TENANT_ID, {
      name: "Email Subject",
      type: "email_campaign",
      targetId: "camp-1",
      goal: "click",
      variants: [
        { key: "A", name: "Control", trafficPct: 50 },
        { key: "B", name: "Variant", trafficPct: 50 },
      ],
    });

    await updateExperimentStatus(TENANT_ID, experiment.id, { action: "start" });
    await recordExperimentEvent(TENANT_ID, experiment.id, { eventType: "exposure", variantKey: "A" });
    const updated = await recordExperimentEvent(TENANT_ID, experiment.id, {
      eventType: "conversion",
      variantKey: "A",
    });

    const variantA = updated.variants.find((item) => item.key === "A");
    expect(variantA?.exposures).toBe(1);
    expect(variantA?.conversions).toBe(1);
    expect(variantA?.conversionRatePct).toBe(100);
  });

  it("picks winner when completing experiment", async () => {
    const experiment = await createExperiment(TENANT_ID, {
      name: "Hero test",
      type: "landing_page",
      targetId: "lp-1",
      goal: "submission",
      variants: [
        { key: "A", name: "Control", trafficPct: 50 },
        { key: "B", name: "Variant", trafficPct: 50 },
      ],
    });

    await updateExperimentStatus(TENANT_ID, experiment.id, { action: "start" });
    await recordExperimentEvent(TENANT_ID, experiment.id, { eventType: "exposure", variantKey: "A" });
    await recordExperimentEvent(TENANT_ID, experiment.id, { eventType: "conversion", variantKey: "A" });
    await recordExperimentEvent(TENANT_ID, experiment.id, { eventType: "exposure", variantKey: "B" });

    const completed = await updateExperimentStatus(TENANT_ID, experiment.id, { action: "complete" });
    expect(completed.status).toBe("completed");
    expect(completed.winnerVariantKey).toBe("A");
  });

  it("summarizes experiment totals", async () => {
    const experiment = await createExperiment(TENANT_ID, {
      name: "Hero test",
      type: "landing_page",
      targetId: "lp-1",
      goal: "submission",
      variants: [
        { key: "A", name: "Control", trafficPct: 50 },
        { key: "B", name: "Variant", trafficPct: 50 },
      ],
    });

    await updateExperimentStatus(TENANT_ID, experiment.id, { action: "start" });
    await recordExperimentEvent(TENANT_ID, experiment.id, { eventType: "exposure", variantKey: "A" });
    const updated = await recordExperimentEvent(TENANT_ID, experiment.id, {
      eventType: "conversion",
      variantKey: "A",
    });

    const summary = summarizeExperiments([updated]);
    expect(summary.total).toBe(1);
    expect(summary.running).toBe(1);
    expect(summary.totalExposures).toBe(1);
    expect(summary.totalConversions).toBe(1);
    expect(summary.overallConversionRatePct).toBe(100);
  });
});
