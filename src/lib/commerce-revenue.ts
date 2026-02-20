import { getPaymentProviderState } from "@/lib/payment-provider-store";
import { listInvoices, summarizeInvoices } from "@/lib/invoice-store";
import { listSubscriptions, summarizeSubscriptions } from "@/lib/subscription-store";
import { listDunningCases, summarizeDunningCases } from "@/lib/dunning-store";

export type RevenueReport = {
  generatedAt: string;
  payment: {
    activeProvider: "stripe" | "paypal" | "manual";
    mode: "test" | "live";
  };
  invoices: {
    total: number;
    draft: number;
    sent: number;
    paid: number;
    void: number;
    totalAmount: number;
    paidAmount: number;
    outstandingAmount: number;
    collectionRate: number;
  };
  subscriptions: {
    total: number;
    active: number;
    pastDue: number;
    canceled: number;
    mrr: number;
    arr: number;
  };
  dunning: {
    total: number;
    open: number;
    recovered: number;
    canceled: number;
    atRiskAmount: number;
    recoveredAmount: number;
    recoveryRate: number;
  };
  reconciliation: {
    recognizedRevenue: number;
    expectedRecurringRevenue: number;
    atRiskRevenue: number;
    variance: number;
    issues: string[];
  };
};

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export async function buildRevenueReport(tenantId: string): Promise<RevenueReport> {
  const now = new Date().toISOString();

  const paymentState = await getPaymentProviderState(tenantId);
  const activeProviderConfig = paymentState.providers[paymentState.activeProvider];

  const invoices = await listInvoices(tenantId);
  const invoiceSummary = summarizeInvoices(invoices);
  const outstandingAmount = invoiceSummary.totalAmount - invoiceSummary.paidAmount;
  const collectionRate =
    invoiceSummary.totalAmount > 0
      ? (invoiceSummary.paidAmount / invoiceSummary.totalAmount) * 100
      : 100;

  const subscriptions = await listSubscriptions(tenantId);
  const subscriptionSummary = summarizeSubscriptions(subscriptions);

  const dunningCases = await listDunningCases(tenantId);
  const dunningSummary = summarizeDunningCases(dunningCases);
  const recoveredAmount = dunningCases
    .filter((item) => item.status === "recovered")
    .reduce((sum, item) => sum + item.amount, 0);
  const recoveryRate =
    dunningCases.length > 0 ? (dunningSummary.recovered / dunningCases.length) * 100 : 100;

  const recognizedRevenue = invoiceSummary.paidAmount;
  const expectedRecurringRevenue = subscriptionSummary.mrr;
  const atRiskRevenue = dunningSummary.atRiskAmount;
  const variance = recognizedRevenue - expectedRecurringRevenue;

  const issues: string[] = [];

  if (outstandingAmount > 0) {
    issues.push("Outstanding invoices require collection follow-up");
  }

  if (dunningSummary.open > 0) {
    issues.push("Open dunning cases are impacting cash collection");
  }

  if (subscriptionSummary.pastDue > 0) {
    issues.push("Past-due subscriptions should be triaged in dunning workflow");
  }

  if (activeProviderConfig.mode === "test") {
    issues.push("Active payment provider is still in test mode");
  }

  return {
    generatedAt: now,
    payment: {
      activeProvider: paymentState.activeProvider,
      mode: activeProviderConfig.mode,
    },
    invoices: {
      total: invoiceSummary.total,
      draft: invoiceSummary.draft,
      sent: invoiceSummary.sent,
      paid: invoiceSummary.paid,
      void: invoiceSummary.void,
      totalAmount: round2(invoiceSummary.totalAmount),
      paidAmount: round2(invoiceSummary.paidAmount),
      outstandingAmount: round2(outstandingAmount),
      collectionRate: round2(collectionRate),
    },
    subscriptions: {
      total: subscriptionSummary.total,
      active: subscriptionSummary.active,
      pastDue: subscriptionSummary.pastDue,
      canceled: subscriptionSummary.canceled,
      mrr: round2(subscriptionSummary.mrr),
      arr: round2(subscriptionSummary.arr),
    },
    dunning: {
      total: dunningSummary.total,
      open: dunningSummary.open,
      recovered: dunningSummary.recovered,
      canceled: dunningSummary.canceled,
      atRiskAmount: round2(dunningSummary.atRiskAmount),
      recoveredAmount: round2(recoveredAmount),
      recoveryRate: round2(recoveryRate),
    },
    reconciliation: {
      recognizedRevenue: round2(recognizedRevenue),
      expectedRecurringRevenue: round2(expectedRecurringRevenue),
      atRiskRevenue: round2(atRiskRevenue),
      variance: round2(variance),
      issues,
    },
  };
}
