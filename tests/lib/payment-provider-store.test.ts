import { beforeEach, describe, expect, it } from "vitest";
import {
  getPaymentProviderState,
  resetPaymentProviderStoreForTests,
  updatePaymentProvider,
  verifyPaymentProviders,
} from "@/lib/payment-provider-store";

const TENANT_ID = "tenant-test-id";

describe("payment provider store", () => {
  beforeEach(async () => {
    await resetPaymentProviderStoreForTests();
  });

  it("returns default provider state", async () => {
    const state = await getPaymentProviderState(TENANT_ID);
    expect(state.activeProvider).toBe("manual");
    expect(state.providers.stripe.mode).toBe("test");
  });

  it("switches active provider and mode", async () => {
    const state = await updatePaymentProvider(TENANT_ID, {
      provider: "stripe",
      enabled: true,
      mode: "live",
      credentials: {
        publicKey: "pk_live_123",
        secretKey: "sk_live_123",
      },
    });

    expect(state.activeProvider).toBe("stripe");
    expect(state.providers.stripe.mode).toBe("live");
    expect(state.providers.paypal.enabled).toBe(false);
  });

  it("increments credential version on rotation", async () => {
    await updatePaymentProvider(TENANT_ID, {
      provider: "paypal",
      enabled: true,
      mode: "test",
      credentials: {
        merchantId: "merchant-1",
        secretKey: "secret-1",
      },
    });

    const state = await updatePaymentProvider(TENANT_ID, {
      provider: "paypal",
      enabled: true,
      mode: "test",
      credentials: {
        merchantId: "merchant-1",
        secretKey: "secret-2",
      },
    });

    expect(state.providers.paypal.version).toBe(3);
    expect(state.providers.paypal.rotatedAt).not.toBeNull();
  });

  it("verifies enabled provider connectivity", async () => {
    await updatePaymentProvider(TENANT_ID, {
      provider: "stripe",
      enabled: true,
      mode: "live",
      credentials: {
        publicKey: "pk_live_123",
        secretKey: "sk_live_123",
      },
    });

    const verification = await verifyPaymentProviders(TENANT_ID, { provider: "stripe" });
    expect(verification.checked).toBe(1);
    expect(verification.failed).toBe(0);
    expect(verification.results[0]?.status).toBe("succeeded");
  });
});
