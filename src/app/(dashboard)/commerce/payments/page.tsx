"use client";

import { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";

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

export default function CommercePaymentsPage() {
  const [data, setData] = useState<ProviderResponse | null>(null);
  const [provider, setProvider] = useState<ProviderId>("manual");
  const [mode, setMode] = useState<"test" | "live">("test");
  const [publicKey, setPublicKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [merchantId, setMerchantId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/commerce/payments/providers");
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Unable to load payment providers");

        setData(body);
        setProvider(body.activeProvider);
      } catch (err) {
        setData(null);
        setError(err instanceof Error ? err.message : "Unable to load payment providers");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  useEffect(() => {
    if (!data) return;
    const config = data.providers[provider];
    setMode(config.mode);
    setPublicKey(config.credentials.publicKey || "");
    setSecretKey("");
    setMerchantId(config.credentials.merchantId || "");
  }, [data, provider]);

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
      if (!response.ok) throw new Error(body.error || "Unable to save payment configuration");

      setData(body);
      setSecretKey("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save payment configuration");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 pt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payment Providers</h1>
        <p className="mt-1 text-gray-600">
          Configure active payment provider with test/live mode and credential rotation.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Loading payment provider settings...
        </div>
      ) : !data ? null : (
        <div className="max-w-2xl rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-[#0891b2]" />
            <p className="text-sm font-medium text-gray-900">Provider Configuration</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <select
              value={provider}
              onChange={(event) => setProvider(event.target.value as ProviderId)}
              className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
            >
              <option value="stripe">Stripe</option>
              <option value="paypal">PayPal</option>
              <option value="manual">Manual</option>
            </select>

            <select
              value={mode}
              onChange={(event) => setMode(event.target.value as "test" | "live")}
              className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
            >
              <option value="test">Test Mode</option>
              <option value="live">Live Mode</option>
            </select>
          </div>

          <div className="mt-3 grid gap-3">
            <input
              value={publicKey}
              onChange={(event) => setPublicKey(event.target.value)}
              placeholder="Public Key"
              className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
            />
            <input
              value={secretKey}
              onChange={(event) => setSecretKey(event.target.value)}
              placeholder="Secret Key (leave blank to keep current)"
              className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
            />
            <input
              value={merchantId}
              onChange={(event) => setMerchantId(event.target.value)}
              placeholder="Merchant ID"
              className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
            />
          </div>

          <div className="mt-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
            Active provider: <b>{data.activeProvider}</b> • Version: <b>{data.providers[provider].version}</b>
            {data.providers[provider].rotatedAt ? (
              <span> • Rotated: {new Date(data.providers[provider].rotatedAt as string).toLocaleString("en-US")}</span>
            ) : null}
          </div>

          <button
            onClick={saveConfig}
            disabled={saving}
            className="mt-4 rounded-lg bg-[#0891b2] px-3 py-2 text-sm font-medium text-white hover:bg-[#0e7490] disabled:opacity-50"
          >
            Save Provider Config
          </button>
        </div>
      )}
    </div>
  );
}
