import { beforeEach, describe, expect, it } from "vitest";
import {
  cancelSubscription,
  createSubscription,
  listSubscriptions,
  markSubscriptionPastDue,
  renewSubscription,
  resetSubscriptionStoreForTests,
  resumeSubscription,
} from "@/lib/subscription-store";

const TENANT_ID = "tenant-test-id";

describe("subscription store", () => {
  beforeEach(async () => {
    await resetSubscriptionStoreForTests();
  });

  it("creates active subscription with billing period", async () => {
    const subscription = await createSubscription(TENANT_ID, {
      customerName: "ACME",
      planName: "Growth",
      amount: 299,
      currency: "USD",
      cycle: "monthly",
    });

    expect(subscription.status).toBe("active");
    expect(subscription.subscriptionNumber).toContain("SUB-");
    expect(subscription.nextBillingAt).toBe(subscription.currentPeriodEnd);
    expect(await listSubscriptions(TENANT_ID)).toHaveLength(1);
  });

  it("renews active subscription and increments counter", async () => {
    const subscription = await createSubscription(TENANT_ID, {
      customerName: "ACME",
      planName: "Growth",
      amount: 299,
      currency: "USD",
      cycle: "monthly",
    });

    const previousPeriodEnd = subscription.currentPeriodEnd;
    const renewed = await renewSubscription(TENANT_ID, subscription.id);

    expect(renewed.renewalCount).toBe(1);
    expect(renewed.currentPeriodStart).toBe(previousPeriodEnd);
    expect(renewed.currentPeriodEnd > previousPeriodEnd).toBe(true);
  });

  it("supports cancellation scheduling and resume", async () => {
    const subscription = await createSubscription(TENANT_ID, {
      customerName: "ACME",
      planName: "Growth",
      amount: 299,
      currency: "USD",
      cycle: "monthly",
    });

    const scheduled = await cancelSubscription(TENANT_ID, subscription.id, "period_end", "budget");
    expect(scheduled.cancelAtPeriodEnd).toBe(true);

    const resumed = await resumeSubscription(TENANT_ID, subscription.id);
    expect(resumed.cancelAtPeriodEnd).toBe(false);
    expect(resumed.status).toBe("active");
  });

  it("supports immediate cancel and blocks invalid transitions", async () => {
    const subscription = await createSubscription(TENANT_ID, {
      customerName: "ACME",
      planName: "Growth",
      amount: 299,
      currency: "USD",
      cycle: "monthly",
    });

    const canceled = await cancelSubscription(TENANT_ID, subscription.id, "immediate");
    expect(canceled.status).toBe("canceled");
    expect(canceled.nextBillingAt).toBeNull();

    await expect(renewSubscription(TENANT_ID, subscription.id)).rejects.toThrow();
    await expect(markSubscriptionPastDue(TENANT_ID, subscription.id)).rejects.toThrow();
  });
});
