"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";

type SsoConfig = {
  tenantSlug: string;
  enabled: boolean;
  ssoOnly: boolean;
  provider: "oidc" | "saml";
  idpDisplayName: string;
  connectionId: string;
  entryPointUrl: string;
  domains: string[];
  updatedAt: string;
};

export default function SsoSettingsPage() {
  const [data, setData] = useState<SsoConfig | null>(null);
  const [domainsText, setDomainsText] = useState("");
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/settings/sso");
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to load SSO settings");
      setData(body.data);
      setDomainsText((body.data?.domains || []).join(", "));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load SSO settings");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function updateField<K extends keyof SsoConfig>(key: K, value: SsoConfig[K]) {
    setData((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function saveSettings() {
    if (!data) return;
    setSaving(true);
    setError(null);
    try {
      const domains = domainsText
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);

      const response = await fetch("/api/settings/sso", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug: data.tenantSlug,
          enabled: data.enabled,
          ssoOnly: data.ssoOnly,
          provider: data.provider,
          idpDisplayName: data.idpDisplayName,
          connectionId: data.connectionId,
          entryPointUrl: data.entryPointUrl,
          domains,
        }),
      });

      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to save SSO settings");
      setData(body.data);
      setDomainsText((body.data?.domains || []).join(", "));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save SSO settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 pt-8 max-w-3xl">
      <Link href="/settings" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#0891b2] mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Settings
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">SSO Configuration</h1>
        <p className="mt-1 text-gray-600">Configure SAML/OIDC workspace login and enforce SSO-only access.</p>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-[#0891b2]" />
          <p className="text-sm font-semibold text-gray-900">Identity Provider</p>
        </div>

        {busy || !data ? (
          <p className="text-sm text-gray-500">Loading SSO settings...</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-gray-700">Workspace slug</span>
              <input
                className="h-10 w-full rounded-lg border border-gray-200 px-3"
                value={data.tenantSlug}
                onChange={(event) => updateField("tenantSlug", event.target.value)}
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block text-gray-700">Provider</span>
              <select
                className="h-10 w-full rounded-lg border border-gray-200 px-3 bg-white"
                value={data.provider}
                onChange={(event) => updateField("provider", event.target.value as "oidc" | "saml")}
              >
                <option value="oidc">OIDC</option>
                <option value="saml">SAML</option>
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1 block text-gray-700">IdP display name</span>
              <input
                className="h-10 w-full rounded-lg border border-gray-200 px-3"
                value={data.idpDisplayName}
                onChange={(event) => updateField("idpDisplayName", event.target.value)}
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block text-gray-700">Connection ID</span>
              <input
                className="h-10 w-full rounded-lg border border-gray-200 px-3"
                value={data.connectionId}
                onChange={(event) => updateField("connectionId", event.target.value)}
              />
            </label>

            <label className="text-sm md:col-span-2">
              <span className="mb-1 block text-gray-700">Entry point URL</span>
              <input
                className="h-10 w-full rounded-lg border border-gray-200 px-3"
                value={data.entryPointUrl}
                onChange={(event) => updateField("entryPointUrl", event.target.value)}
              />
            </label>

            <label className="text-sm md:col-span-2">
              <span className="mb-1 block text-gray-700">Allowed domains (comma-separated)</span>
              <input
                className="h-10 w-full rounded-lg border border-gray-200 px-3"
                value={domainsText}
                onChange={(event) => setDomainsText(event.target.value)}
                placeholder="f-core.com, subsidiary.com"
              />
            </label>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={data.enabled}
                onChange={(event) => updateField("enabled", event.target.checked)}
              />
              Enable SSO
            </label>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={data.ssoOnly}
                onChange={(event) => updateField("ssoOnly", event.target.checked)}
              />
              Enforce SSO-only login
            </label>
          </div>
        )}

        <div className="mt-5">
          <button
            onClick={saveSettings}
            disabled={busy || saving || !data}
            className="rounded-lg bg-[#0891b2] px-4 py-2 text-sm font-medium text-white hover:bg-[#0e7490] disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save SSO Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
