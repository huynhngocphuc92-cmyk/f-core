"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

type Subscription = {
  id: string;
  subscriptionNumber: string;
  customerName: string;
  planName: string;
  amount: number;
  currency: string;
  cycle: "monthly" | "quarterly" | "yearly";
  status: "active" | "past_due" | "canceled";
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string;
  renewalCount: number;
};

type SubscriptionResponse = {
  data: Subscription[];
  summary: {
    total: number;
    active: number;
    pastDue: number;
    canceled: number;
    mrr: number;
    arr: number;
  };
};

export default function CommerceSubscriptionsPage() {
  const [data, setData] = useState<SubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState("ACME Corp");
  const [planName, setPlanName] = useState("Growth Plan");
  const [amount, setAmount] = useState("299");
  const [currency, setCurrency] = useState("USD");
  const [cycle, setCycle] = useState<"monthly" | "quarterly" | "yearly">("monthly");

  async function loadSubscriptions() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/commerce/subscriptions");
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to load subscriptions");
      setData(body);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Unable to load subscriptions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSubscriptions();
  }, []);

  async function create() {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/commerce/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          planName,
          amount: Number(amount),
          currency,
          cycle,
        }),
      });

      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to create subscription");
      await loadSubscriptions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create subscription");
    } finally {
      setSaving(false);
    }
  }

  async function transition(
    id: string,
    action: "renew" | "cancel" | "resume" | "mark_past_due",
    effective?: "immediate" | "period_end"
  ) {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/commerce/subscriptions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          effective,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to update subscription");
      await loadSubscriptions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update subscription");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 pt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
        <p className="mt-1 text-gray-600">
          Manage recurring plans, renewals, and cancellation policy per customer.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-gray-900">Create Subscription</p>
        <div className="grid gap-3 md:grid-cols-5">
          <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="h-10 rounded-lg border border-gray-200 px-3 text-sm" placeholder="Customer" />
          <input value={planName} onChange={(e) => setPlanName(e.target.value)} className="h-10 rounded-lg border border-gray-200 px-3 text-sm" placeholder="Plan" />
          <input value={amount} onChange={(e) => setAmount(e.target.value)} className="h-10 rounded-lg border border-gray-200 px-3 text-sm" placeholder="Amount" />
          <input value={currency} onChange={(e) => setCurrency(e.target.value)} className="h-10 rounded-lg border border-gray-200 px-3 text-sm" placeholder="Currency" />
          <select value={cycle} onChange={(e) => setCycle(e.target.value as "monthly" | "quarterly" | "yearly")} className="h-10 rounded-lg border border-gray-200 px-3 text-sm">
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        <button onClick={create} disabled={saving} className="mt-3 rounded-lg bg-[#0891b2] px-3 py-2 text-sm font-medium text-white hover:bg-[#0e7490] disabled:opacity-50">Create Subscription</button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">Loading subscriptions...</div>
      ) : !data ? null : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-6">
            <Metric label="Total" value={String(data.summary.total)} />
            <Metric label="Active" value={String(data.summary.active)} />
            <Metric label="Past Due" value={String(data.summary.pastDue)} />
            <Metric label="Canceled" value={String(data.summary.canceled)} />
            <Metric label="MRR" value={formatMoney(data.summary.mrr, "USD")} />
            <Metric label="ARR" value={formatMoney(data.summary.arr, "USD")} />
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
              <RefreshCw className="h-4 w-4 text-[#0891b2]" />
              <p className="text-sm font-medium text-gray-900">Recurring Billing Engine</p>
            </div>
            {data.data.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">No subscriptions yet.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {data.data.map((subscription) => (
                  <div key={subscription.id} className="p-4">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {subscription.subscriptionNumber} • {subscription.customerName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {subscription.planName} • {formatMoney(subscription.amount, subscription.currency)} / {subscription.cycle} • {subscription.status}
                        </p>
                        <p className="text-xs text-gray-500">
                          Period ends: {new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US")} • Renewals: {subscription.renewalCount}
                        </p>
                        {subscription.cancelAtPeriodEnd && (
                          <p className="text-xs text-amber-700">Cancellation scheduled at period end</p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {subscription.status !== "canceled" && (
                          <button onClick={() => transition(subscription.id, "renew")} disabled={saving} className="rounded border border-gray-200 px-2 py-1 text-xs">Renew Now</button>
                        )}
                        {subscription.status !== "canceled" && !subscription.cancelAtPeriodEnd && (
                          <button onClick={() => transition(subscription.id, "cancel", "period_end")} disabled={saving} className="rounded border border-gray-200 px-2 py-1 text-xs">Cancel End of Term</button>
                        )}
                        {subscription.status !== "canceled" && (
                          <button onClick={() => transition(subscription.id, "cancel", "immediate")} disabled={saving} className="rounded border border-gray-200 px-2 py-1 text-xs">Cancel Now</button>
                        )}
                        {subscription.cancelAtPeriodEnd && (
                          <button onClick={() => transition(subscription.id, "resume")} disabled={saving} className="rounded border border-gray-200 px-2 py-1 text-xs">Resume</button>
                        )}
                        {subscription.status === "active" && (
                          <button onClick={() => transition(subscription.id, "mark_past_due")} disabled={saving} className="rounded border border-gray-200 px-2 py-1 text-xs">Mark Past Due</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
