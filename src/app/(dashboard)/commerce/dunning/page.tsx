"use client";

import { useEffect, useState } from "react";
import { BellRing } from "lucide-react";

type DunningConfig = {
  retryDelaysHours: number[];
  maxRetries: number;
  cancelAfterMaxRetries: boolean;
  notifyChannels: {
    email: boolean;
    sms: boolean;
    inApp: boolean;
  };
};

type DunningCase = {
  id: string;
  customerName: string;
  amount: number;
  currency: string;
  status: "open" | "recovered" | "canceled";
  attemptCount: number;
  nextRetryAt: string | null;
  createdAt: string;
};

type DunningResponse = {
  config: DunningConfig;
  data: DunningCase[];
  summary: {
    total: number;
    open: number;
    recovered: number;
    canceled: number;
    atRiskAmount: number;
  };
};

export default function CommerceDunningPage() {
  const [data, setData] = useState<DunningResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState("ACME Corp");
  const [amount, setAmount] = useState("299");
  const [currency, setCurrency] = useState("USD");

  const [retryDelays, setRetryDelays] = useState("24,72,120");
  const [maxRetries, setMaxRetries] = useState("3");
  const [cancelAfterMaxRetries, setCancelAfterMaxRetries] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySms, setNotifySms] = useState(false);
  const [notifyInApp, setNotifyInApp] = useState(true);

  async function loadDunning() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/commerce/dunning");
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to load dunning workflow");

      setData(body);
      setRetryDelays(body.config.retryDelaysHours.join(","));
      setMaxRetries(String(body.config.maxRetries));
      setCancelAfterMaxRetries(body.config.cancelAfterMaxRetries);
      setNotifyEmail(body.config.notifyChannels.email);
      setNotifySms(body.config.notifyChannels.sms);
      setNotifyInApp(body.config.notifyChannels.inApp);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Unable to load dunning workflow");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDunning();
  }, []);

  async function saveConfig() {
    setSaving(true);
    setError(null);

    try {
      const parsedDelays = retryDelays
        .split(",")
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isFinite(value) && value > 0);

      const response = await fetch("/api/commerce/dunning", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          retryDelaysHours: parsedDelays,
          maxRetries: Number(maxRetries),
          cancelAfterMaxRetries,
          notifyChannels: {
            email: notifyEmail,
            sms: notifySms,
            inApp: notifyInApp,
          },
        }),
      });

      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to save dunning config");

      await loadDunning();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save dunning config");
    } finally {
      setSaving(false);
    }
  }

  async function createFailedPayment() {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/commerce/dunning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          amount: Number(amount),
          currency,
          reason: "Card declined",
        }),
      });

      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to create failed payment");

      await loadDunning();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create failed payment");
    } finally {
      setSaving(false);
    }
  }

  async function transition(id: string, action: "mark_retry_failed" | "mark_paid" | "cancel") {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/commerce/dunning/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to update dunning case");

      await loadDunning();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update dunning case");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 pt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dunning Workflow</h1>
        <p className="mt-1 text-gray-600">
          Configure retry schedules and recover failed subscription payments with automated policy.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-sm font-semibold text-gray-900">Retry Policy</p>
          <div className="grid gap-3">
            <input
              value={retryDelays}
              onChange={(event) => setRetryDelays(event.target.value)}
              className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
              placeholder="Retry delays in hours, ex: 24,72,120"
            />
            <input
              value={maxRetries}
              onChange={(event) => setMaxRetries(event.target.value)}
              className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
              placeholder="Max retries"
            />
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={cancelAfterMaxRetries}
                onChange={(event) => setCancelAfterMaxRetries(event.target.checked)}
              />
              Cancel subscription after max retries
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={notifyEmail}
                onChange={(event) => setNotifyEmail(event.target.checked)}
              />
              Notify by email
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={notifySms}
                onChange={(event) => setNotifySms(event.target.checked)}
              />
              Notify by SMS
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={notifyInApp}
                onChange={(event) => setNotifyInApp(event.target.checked)}
              />
              Notify in-app
            </label>
          </div>
          <button
            onClick={saveConfig}
            disabled={saving}
            className="mt-4 rounded-lg bg-[#0891b2] px-3 py-2 text-sm font-medium text-white hover:bg-[#0e7490] disabled:opacity-50"
          >
            Save Policy
          </button>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-sm font-semibold text-gray-900">Simulate Failed Payment</p>
          <div className="grid gap-3">
            <input
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
              placeholder="Customer"
            />
            <input
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
              placeholder="Amount"
            />
            <input
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
              className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
              placeholder="Currency"
            />
          </div>
          <button
            onClick={createFailedPayment}
            disabled={saving}
            className="mt-4 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            Add Failed Payment
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Loading dunning queue...
        </div>
      ) : !data ? null : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
            <Metric label="Total" value={String(data.summary.total)} />
            <Metric label="Open" value={String(data.summary.open)} />
            <Metric label="Recovered" value={String(data.summary.recovered)} />
            <Metric label="Canceled" value={String(data.summary.canceled)} />
            <Metric label="At-Risk" value={formatMoney(data.summary.atRiskAmount, "USD")} />
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
              <BellRing className="h-4 w-4 text-[#0891b2]" />
              <p className="text-sm font-medium text-gray-900">Failed Payments Queue</p>
            </div>
            {data.data.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">No dunning cases yet.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {data.data.map((dunningCase) => (
                  <div key={dunningCase.id} className="p-4">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{dunningCase.customerName}</p>
                        <p className="text-xs text-gray-500">
                          {formatMoney(dunningCase.amount, dunningCase.currency)} • {dunningCase.status} • attempts: {dunningCase.attemptCount}
                        </p>
                        <p className="text-xs text-gray-500">
                          Next retry: {dunningCase.nextRetryAt ? new Date(dunningCase.nextRetryAt).toLocaleString("en-US") : "-"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {dunningCase.status === "open" && (
                          <button
                            onClick={() => transition(dunningCase.id, "mark_retry_failed")}
                            disabled={saving}
                            className="rounded border border-gray-200 px-2 py-1 text-xs"
                          >
                            Retry Failed
                          </button>
                        )}
                        {dunningCase.status === "open" && (
                          <button
                            onClick={() => transition(dunningCase.id, "mark_paid")}
                            disabled={saving}
                            className="rounded border border-gray-200 px-2 py-1 text-xs"
                          >
                            Mark Paid
                          </button>
                        )}
                        {dunningCase.status !== "canceled" && (
                          <button
                            onClick={() => transition(dunningCase.id, "cancel")}
                            disabled={saving}
                            className="rounded border border-gray-200 px-2 py-1 text-xs"
                          >
                            Cancel
                          </button>
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
