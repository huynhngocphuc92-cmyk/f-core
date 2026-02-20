import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import { getTenantId } from "@/lib/auth-helpers";
import { GET as getProviders, PUT as putProviders } from "@/app/api/commerce/payments/providers/route";
import { POST as verifyProviders } from "@/app/api/commerce/payments/providers/verify/route";
import { resetPaymentProviderStoreForTests } from "@/lib/payment-provider-store";

const mockGetTenantId = vi.mocked(getTenantId);
const TENANT_ID = "tenant-test-id";

beforeEach(() => {
  vi.clearAllMocks();
});

beforeEach(async () => {
  await resetPaymentProviderStoreForTests();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
});

describe("commerce payment providers API", () => {
  it("returns default provider config", async () => {
    const response = await getProviders(createMockRequest("/api/commerce/payments/providers"));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.activeProvider).toBe("manual");
    expect(body.providers.stripe.mode).toBe("test");
  });

  it("updates provider configuration", async () => {
    const response = await putProviders(
      createMockRequest("/api/commerce/payments/providers", {
        method: "PUT",
        body: {
          provider: "stripe",
          enabled: true,
          mode: "live",
          credentials: {
            publicKey: "pk_live_abc",
            secretKey: "sk_live_abc",
          },
        },
      })
    );

    const body = await getResponseBody(response);
    expect(response.status).toBe(200);
    expect(body.activeProvider).toBe("stripe");
    expect(body.providers.stripe.mode).toBe("live");
    expect(body.providers.stripe.version).toBeGreaterThanOrEqual(2);
  });

  it("verifies provider connection health", async () => {
    await putProviders(
      createMockRequest("/api/commerce/payments/providers", {
        method: "PUT",
        body: {
          provider: "stripe",
          enabled: true,
          mode: "live",
          credentials: {
            publicKey: "pk_live_abc",
            secretKey: "sk_live_abc",
          },
        },
      })
    );

    const response = await verifyProviders(
      createMockRequest("/api/commerce/payments/providers/verify", {
        method: "POST",
        body: { provider: "stripe" },
      })
    );
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.checked).toBe(1);
    expect(body.failed).toBe(0);
  });

  it("returns 401 when not authenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));

    const response = await getProviders(createMockRequest("/api/commerce/payments/providers"));
    expect(response.status).toBe(401);
  });
});
