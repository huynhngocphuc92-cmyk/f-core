import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import { getTenantId } from "@/lib/auth-helpers";
import { GET as getRevenueReport } from "@/app/api/commerce/revenue/route";
import { createInvoice, resetInvoiceStoreForTests, updateInvoiceStatus } from "@/lib/invoice-store";
import { resetSubscriptionStoreForTests } from "@/lib/subscription-store";
import { resetDunningStoreForTests } from "@/lib/dunning-store";
import { resetPaymentProviderStoreForTests } from "@/lib/payment-provider-store";

const mockGetTenantId = vi.mocked(getTenantId);
const TENANT_ID = "tenant-test-id";

beforeEach(() => {
  vi.clearAllMocks();
});

beforeEach(async () => {
  await resetInvoiceStoreForTests();
  await resetSubscriptionStoreForTests();
  await resetDunningStoreForTests();
  await resetPaymentProviderStoreForTests();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
});

describe("commerce revenue API", () => {
  it("returns consolidated report payload", async () => {
    const invoice = await createInvoice(TENANT_ID, {
      customerName: "ACME",
      amount: 200,
      currency: "USD",
    });
    await updateInvoiceStatus(TENANT_ID, invoice.id, "sent");

    const response = await getRevenueReport(createMockRequest("/api/commerce/revenue"));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.invoices.total).toBe(1);
    expect(body.subscriptions.total).toBe(0);
    expect(body.reconciliation).toBeTruthy();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));

    const response = await getRevenueReport(createMockRequest("/api/commerce/revenue"));
    expect(response.status).toBe(401);
  });
});
