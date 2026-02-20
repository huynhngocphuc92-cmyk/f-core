import { beforeEach, describe, expect, it } from "vitest";
import {
  cancelDunningCase,
  createDunningCase,
  getDunningConfig,
  listDunningCases,
  markDunningCasePaid,
  markDunningCaseRetryFailed,
  resetDunningStoreForTests,
  updateDunningConfig,
} from "@/lib/dunning-store";

const TENANT_ID = "tenant-test-id";

describe("dunning store", () => {
  beforeEach(async () => {
    await resetDunningStoreForTests();
  });

  it("returns default config", async () => {
    const config = await getDunningConfig(TENANT_ID);
    expect(config.maxRetries).toBe(3);
    expect(config.retryDelaysHours).toEqual([24, 72, 120]);
  });

  it("creates open dunning case with next retry", async () => {
    const dunningCase = await createDunningCase(TENANT_ID, {
      customerName: "ACME",
      amount: 400,
      currency: "USD",
    });

    expect(dunningCase.status).toBe("open");
    expect(dunningCase.attemptCount).toBe(1);
    expect(dunningCase.nextRetryAt).toBeTruthy();
    expect(await listDunningCases(TENANT_ID)).toHaveLength(1);
  });

  it("moves dunning case to recovered", async () => {
    const dunningCase = await createDunningCase(TENANT_ID, {
      customerName: "ACME",
      amount: 400,
      currency: "USD",
    });

    const paid = await markDunningCasePaid(TENANT_ID, dunningCase.id);
    expect(paid.status).toBe("recovered");
    expect(paid.nextRetryAt).toBeNull();
  });

  it("cancels case after max retries when policy enabled", async () => {
    await updateDunningConfig(TENANT_ID, {
      retryDelaysHours: [1, 2],
      maxRetries: 2,
      cancelAfterMaxRetries: true,
      notifyChannels: {
        email: true,
        sms: false,
        inApp: true,
      },
    });

    const dunningCase = await createDunningCase(TENANT_ID, {
      customerName: "ACME",
      amount: 400,
      currency: "USD",
    });

    const finalCase = await markDunningCaseRetryFailed(TENANT_ID, dunningCase.id, "still failed");
    expect(finalCase.status).toBe("canceled");
    expect(finalCase.nextRetryAt).toBeNull();
  });

  it("supports manual cancellation", async () => {
    const dunningCase = await createDunningCase(TENANT_ID, {
      customerName: "ACME",
      amount: 400,
      currency: "USD",
    });

    const canceled = await cancelDunningCase(TENANT_ID, dunningCase.id, "manual override");
    expect(canceled.status).toBe("canceled");
  });
});
