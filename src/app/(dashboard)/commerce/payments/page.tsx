"use client";

import { useEffect, useState } from "react";
import { CreditCard, ArrowUpRight, RefreshCw } from "lucide-react";

type ProviderId = "stripe" | "paypal" | "manual";

type ProviderConfig = {
  provider: ProviderId;
  enabled: boolean;
  mode: "test" | "live";
  credentials: {
    publicKey?: string | null;
    secretKey?: string | null;
    merchantId?: string | null;
  };
  version: number;
  rotatedAt: string | null;
};

type ProviderResponse = {
  activeProvider: ProviderId;
  providers: Record<ProviderId, ProviderConfig>;
};

type Payment = {
  id: string;
  invoiceId: string | null;
  subscriptionId: string | null;
  customerName: string;
  amount: number;
  currency: string;
  status: "pending" | "processing" | "succeeded" | "failed" | "refunded";
  method: string;
  stripePaymentIntentId: string | null;
  paidAt: string | null;
  refundedAmount: number | null;
  refundedAt: string | null;
  createdAt: string;
};

type PaymentSummary = {
  total: number;
  pending: number;
  processing: number;
  succeeded: number;
  failed: number;
  refunded: number;
  totalAmount: number;
  collectedAmount: number;
  refundedAmount: number;
};

type PaymentResponse = {
  data: Payment[];
  summary: PaymentSummary;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  processing: "bg-blue-100 text-blue-700",
  succeeded: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-gray-100 text-gray-600",
};

export default function CommercePaymentsPage() {
  const [tab, setTab] = useState<"payments" | "config">("payments");
  const [providerData, setProviderData] = useState<ProviderResponse | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Provider config state
  const [provider, setProvider] = useState<ProviderId>("manual");
  const [mode, setMode] = useState<"test" | "live">("test");
  const [publicKey, setPublicKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [merchantId, setMerchantId] = useState("");

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [providerRes, paymentRes] = await Promise.all([
        fetch("/api/commerce/payments/providers"),
        fetch("/api/commerce/payments"),
      ]);
      const providerBody = await providerRes.json();
      const paymentBody = await paymentRes.json();

      if (!providerRes.ok) throw new Error(providerBody.error || "Unable to load providers");

      setProviderData(providerBody);
      setProvider(providerBody.activeProvider);

      if (paymentRes.ok) {
        setPaymentData(paymentBody);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (!providerData) return;
    const config = providerData.providers[provider];
    setMode(config.mode);
    setPublicKey(config.credentials.publicKey || "");
    setSecretKey("");
    setMerchantId(config.credentials.merchantId || "");
  }, [providerData, provider]);

  async function saveConfig() {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/commerce/payments/providers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          enabled: true,
          mode,
          credentials: {
            publicKey: publicKey || null,
            secretKey: secretKey || null,
            merchantId: merchantId || null,
          },
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to save");
      setProviderData(body);
      setSecretKey("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save");
    } finally {
      setSaving(false);
    }
  }

  async function refundPayment(paymentId: string) {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/commerce/payments/${paymentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "refund",
          refundReason: "requested_by_customer",
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Refund failed");
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refund failed");
    } finally {
      setSaving(false);
    }
  }

  async function markPaid(paymentId: string) {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/commerce/payments/${paymentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_paid" }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Failed to mark as paid");
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 pt-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="mt-1 text-gray-600">
            Payment processing, Stripe integration, and revenue tracking.
          </p>
        </div>
        <button
          onClick={loadAll}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-gray-100 p-1">
        <button
          onClick={() => setTab("payments")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
            tab === "payments"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Payments ({paymentData?.summary.total ?? 0})
        </button>
        <button
          onClick={() => setTab("config")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
            tab === "config"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Provider Config
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Loading...
        </div>
      ) : tab === "payments" ? (
        <PaymentsTab
          data={paymentData}
          saving={saving}
          onRefund={refundPayment}
          onMarkPaid={markPaid}
        />
      ) : (
        <ConfigTab
          data={providerData}
          provider={provider}
          setProvider={setProvider}
          mode={mode}
          setMode={setMode}
          publicKey={publicKey}
          setPublicKey={setPublicKey}
          secretKey={secretKey}
          setSecretKey={setSecretKey}
          merchantId={merchantId}
          setMerchantId={setMerchantId}
          saving={saving}
          onSave={saveConfig}
        />
      )}
    </div>
  );
}

function PaymentsTab({
  data,
  saving,
  onRefund,
  onMarkPaid,
}: {
  data: PaymentResponse | null;
  saving: boolean;
  onRefund: (id: string) => void;
  onMarkPaid: (id: string) => void;
}) {
  if (!data) return null;

  return (
    <>
      {/* Summary */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
        <Metric label="Total" value={String(data.summary.total)} />
        <Metric label="Succeeded" value={String(data.summary.succeeded)} accent />
        <Metric label="Pending" value={String(data.summary.pending)} />
        <Metric
          label="Collected"
          value={formatMoney(data.summary.collectedAmount, "USD")}
          accent
        />
        <Metric
          label="Refunded"
          value={formatMoney(data.summary.refundedAmount, "USD")}
        />
      </div>

      {/* Payments list */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
          <CreditCard className="h-4 w-4 text-[#0891b2]" />
          <p className="text-sm font-medium text-gray-900">Recent Payments</p>
        </div>

        {data.data.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            No payments yet. Create an invoice and use Stripe Checkout to generate a payment.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {data.data.map((payment) => (
              <div
                key={payment.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {payment.customerName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatMoney(payment.amount, payment.currency)} •{" "}
                    {payment.method}
                    {payment.stripePaymentIntentId && (
                      <span className="ml-1 text-gray-400">
                        • {payment.stripePaymentIntentId.slice(0, 20)}...
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(payment.createdAt).toLocaleString("en-US")}
                    {payment.paidAt &&
                      ` • Paid ${new Date(payment.paidAt).toLocaleString("en-US")}`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      STATUS_COLORS[payment.status] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {payment.status}
                  </span>

                  {payment.status === "pending" && (
                    <button
                      onClick={() => onMarkPaid(payment.id)}
                      disabled={saving}
                      className="rounded border border-gray-200 px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
                    >
                      Mark Paid
                    </button>
                  )}

                  {payment.status === "succeeded" && (
                    <button
                      onClick={() => onRefund(payment.id)}
                      disabled={saving}
                      className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      Refund
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function ConfigTab({
  data,
  provider,
  setProvider,
  mode,
  setMode,
  publicKey,
  setPublicKey,
  secretKey,
  setSecretKey,
  merchantId,
  setMerchantId,
  saving,
  onSave,
}: {
  data: ProviderResponse | null;
  provider: ProviderId;
  setProvider: (p: ProviderId) => void;
  mode: "test" | "live";
  setMode: (m: "test" | "live") => void;
  publicKey: string;
  setPublicKey: (v: string) => void;
  secretKey: string;
  setSecretKey: (v: string) => void;
  merchantId: string;
  setMerchantId: (v: string) => void;
  saving: boolean;
  onSave: () => void;
}) {
  if (!data) return null;

  return (
    <div className="max-w-2xl rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-[#0891b2]" />
        <p className="text-sm font-medium text-gray-900">Provider Configuration</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value as ProviderId)}
          className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
        >
          <option value="stripe">Stripe</option>
          <option value="paypal">PayPal</option>
          <option value="manual">Manual</option>
        </select>

        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as "test" | "live")}
          className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
        >
          <option value="test">Test Mode</option>
          <option value="live">Live Mode</option>
        </select>
      </div>

      <div className="mt-3 grid gap-3">
        <input
          value={publicKey}
          onChange={(e) => setPublicKey(e.target.value)}
          placeholder="Public Key"
          className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
        />
        <input
          value={secretKey}
          onChange={(e) => setSecretKey(e.target.value)}
          placeholder="Secret Key (leave blank to keep current)"
          className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
        />
        <input
          value={merchantId}
          onChange={(e) => setMerchantId(e.target.value)}
          placeholder="Merchant ID"
          className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
        />
      </div>

      <div className="mt-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
        Active provider: <b>{data.activeProvider}</b> • Version:{" "}
        <b>{data.providers[provider].version}</b>
        {data.providers[provider].rotatedAt ? (
          <span>
            {" "}
            • Rotated:{" "}
            {new Date(
              data.providers[provider].rotatedAt as string
            ).toLocaleString("en-US")}
          </span>
        ) : null}
      </div>

      <button
        onClick={onSave}
        disabled={saving}
        className="mt-4 rounded-lg bg-[#0891b2] px-3 py-2 text-sm font-medium text-white hover:bg-[#0e7490] disabled:opacity-50"
      >
        Save Provider Config
      </button>
    </div>
  );
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="mb-1 text-xs text-gray-500">{label}</p>
      <p
        className={`text-lg font-semibold ${
          accent ? "text-[#0891b2]" : "text-gray-900"
        }`}
      >
        {value}
      </p>
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
