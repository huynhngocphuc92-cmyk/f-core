import { beforeEach, describe, expect, it } from "vitest";
import { buildRevenueReport } from "@/lib/commerce-revenue";
import {
  createInvoice,
  resetInvoiceStoreForTests,
  updateInvoiceStatus,
} from "@/lib/invoice-store";
import {
  createSubscription,
  markSubscriptionPastDue,
  resetSubscriptionStoreForTests,
} from "@/lib/subscription-store";
import {
  createDunningCase,
  markDunningCasePaid,
  resetDunningStoreForTests,
} from "@/lib/dunning-store";
import {
  resetPaymentProviderStoreForTests,
  updatePaymentProvider,
} from "@/lib/payment-provider-store";

const TENANT_ID = "tenant-test-id";

describe("commerce revenue report", () => {
  beforeEach(async () => {
    await resetInvoiceStoreForTests();
    await resetSubscriptionStoreForTests();
    await resetDunningStoreForTests();
    await resetPaymentProviderStoreForTests();
  });

  it("builds consolidated revenue report with reconciliation issues", async () => {
    const invoiceA = await createInvoice(TENANT_ID, {
      customerName: "ACME",
      amount: 1000,
      currency: "USD",
    });
    await updateInvoiceStatus(TENANT_ID, invoiceA.id, "sent");
    await updateInvoiceStatus(TENANT_ID, invoiceA.id, "paid");

    const invoiceB = await createInvoice(TENANT_ID, {
      customerName: "Globex",
      amount: 500,
      currency: "USD",
    });
    await updateInvoiceStatus(TENANT_ID, invoiceB.id, "sent");

    const subA = await createSubscription(TENANT_ID, {
      customerName: "ACME",
      planName: "Growth",
      amount: 300,
      currency: "USD",
      cycle: "monthly",
    });

    const subB = await createSubscription(TENANT_ID, {
      customerName: "Globex",
      planName: "Scale",
      amount: 1200,
      currency: "USD",
      cycle: "yearly",
    });
    await markSubscriptionPastDue(TENANT_ID, subB.id);

    await createDunningCase(TENANT_ID, {
      subscriptionId: subA.id,
      customerName: "ACME",
      amount: 300,
      currency: "USD",
    });

    const caseB = await createDunningCase(TENANT_ID, {
      subscriptionId: subB.id,
      customerName: "Globex",
      amount: 100,
      currency: "USD",
    });
    await markDunningCasePaid(TENANT_ID, caseB.id);

    await updatePaymentProvider(TENANT_ID, {
      provider: "stripe",
      enabled: true,
      mode: "live",
      credentials: {
        publicKey: "pk_live_1",
        secretKey: "sk_live_1",
      },
    });

    const report = await buildRevenueReport(TENANT_ID);

    expect(report.payment.activeProvider).toBe("stripe");
    expect(report.invoices.totalAmount).toBe(1500);
    expect(report.invoices.paidAmount).toBe(1000);
    expect(report.invoices.outstandingAmount).toBe(500);
    expect(report.subscriptions.mrr).toBe(300);
    expect(report.dunning.recoveredAmount).toBe(100);
    expect(report.dunning.open).toBe(1);
    expect(report.reconciliation.issues.length).toBeGreaterThan(0);
  });

  it("returns healthy defaults when no data exists", async () => {
    const report = await buildRevenueReport(TENANT_ID);

    expect(report.invoices.total).toBe(0);
    expect(report.subscriptions.total).toBe(0);
    expect(report.dunning.total).toBe(0);
    expect(report.reconciliation.issues).toContain(
      "Active payment provider is still in test mode"
    );
  });
});
