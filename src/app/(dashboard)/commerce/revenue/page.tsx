"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { ChartNoAxesCombined } from "lucide-react";

type RevenueReport = {
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

export default function CommerceRevenuePage() {
  const [report, setReport] = useState<RevenueReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadRevenueReport() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/commerce/revenue");
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to load revenue report");
      setReport(body);
    } catch (err) {
      setReport(null);
      setError(err instanceof Error ? err.message : "Unable to load revenue report");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRevenueReport();
  }, []);

  return (
    <div className="p-6 pt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Revenue Reconciliation</h1>
        <p className="mt-1 text-gray-600">
          Consolidated revenue view across invoices, subscriptions, and payment recovery.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Loading revenue report...
        </div>
      ) : !report ? null : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
            <Metric label="Recognized" value={formatMoney(report.reconciliation.recognizedRevenue)} />
            <Metric label="MRR" value={formatMoney(report.subscriptions.mrr)} />
            <Metric label="ARR" value={formatMoney(report.subscriptions.arr)} />
            <Metric label="Outstanding" value={formatMoney(report.invoices.outstandingAmount)} />
            <Metric label="At-Risk" value={formatMoney(report.reconciliation.atRiskRevenue)} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="Invoices">
              <Row label="Total" value={String(report.invoices.total)} />
              <Row label="Paid" value={String(report.invoices.paid)} />
              <Row label="Sent" value={String(report.invoices.sent)} />
              <Row label="Collection rate" value={`${report.invoices.collectionRate}%`} />
            </Panel>

            <Panel title="Subscriptions">
              <Row label="Total" value={String(report.subscriptions.total)} />
              <Row label="Active" value={String(report.subscriptions.active)} />
              <Row label="Past due" value={String(report.subscriptions.pastDue)} />
              <Row label="Canceled" value={String(report.subscriptions.canceled)} />
            </Panel>

            <Panel title="Dunning">
              <Row label="Open" value={String(report.dunning.open)} />
              <Row label="Recovered" value={String(report.dunning.recovered)} />
              <Row label="Recovery rate" value={`${report.dunning.recoveryRate}%`} />
              <Row label="Recovered amount" value={formatMoney(report.dunning.recoveredAmount)} />
            </Panel>
          </div>

          <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <ChartNoAxesCombined className="h-4 w-4 text-[#0891b2]" />
              <p className="text-sm font-medium text-gray-900">Reconciliation Health</p>
            </div>
            <div className="grid gap-2 text-sm text-gray-700 md:grid-cols-2">
              <div>
                Active provider: <b>{report.payment.activeProvider}</b> ({report.payment.mode})
              </div>
              <div>
                Variance (recognized - expected recurring): <b>{formatMoney(report.reconciliation.variance)}</b>
              </div>
            </div>

            {report.reconciliation.issues.length === 0 ? (
              <p className="mt-3 text-sm text-emerald-700">No reconciliation issues detected.</p>
            ) : (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-800">
                {report.reconciliation.issues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="mb-1 text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="mb-3 text-sm font-medium text-gray-900">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}
