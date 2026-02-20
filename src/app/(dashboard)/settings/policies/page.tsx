"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";

type Policy = {
  tenantSlug: string;
  session: {
    maxSessionMinutes: number;
    idleTimeoutMinutes: number;
    rememberMeAllowed: boolean;
  };
  password: {
    minLength: number;
    requireUppercase: boolean;
    requireNumber: boolean;
    requireSpecialChar: boolean;
  };
  ipAllowlist: {
    enabled: boolean;
    entries: string[];
  };
  updatedAt: string;
};

export default function TenantPolicySettingsPage() {
  const [data, setData] = useState<Policy | null>(null);
  const [ipEntriesText, setIpEntriesText] = useState("");
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/settings/policies");
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to load tenant policies");
      setData(body.data);
      setIpEntriesText((body.data?.ipAllowlist?.entries || []).join(", "));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load tenant policies");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function setValue(updater: (current: Policy) => Policy) {
    setData((current) => (current ? updater(current) : current));
  }

  async function savePolicies() {
    if (!data) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/settings/policies", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug: data.tenantSlug,
          session: data.session,
          password: data.password,
          ipAllowlist: {
            enabled: data.ipAllowlist.enabled,
            entries: ipEntriesText
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
          },
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to save tenant policies");
      setData(body.data);
      setIpEntriesText((body.data?.ipAllowlist?.entries || []).join(", "));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save tenant policies");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 pt-8 max-w-4xl">
      <Link href="/settings" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#0891b2] mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Settings
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tenant Security Policies</h1>
        <p className="mt-1 text-gray-600">Configure session timeout, password requirements, and IP allowlist.</p>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-[#0891b2]" />
          <p className="text-sm font-semibold text-gray-900">Org-wide Policy</p>
        </div>

        {busy || !data ? (
          <p className="text-sm text-gray-500">Loading policy...</p>
        ) : (
          <div className="space-y-6">
            <section>
              <h2 className="mb-3 text-sm font-semibold text-gray-800">Session</h2>
              <div className="grid gap-3 md:grid-cols-3">
                <label className="text-sm">
                  <span className="mb-1 block text-gray-700">Max session (minutes)</span>
                  <input
                    type="number"
                    min={15}
                    max={1440}
                    className="h-10 w-full rounded-lg border border-gray-200 px-3"
                    value={data.session.maxSessionMinutes}
                    onChange={(event) =>
                      setValue((current) => ({
                        ...current,
                        session: { ...current.session, maxSessionMinutes: Number(event.target.value) || 15 },
                      }))
                    }
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-gray-700">Idle timeout (minutes)</span>
                  <input
                    type="number"
                    min={5}
                    max={720}
                    className="h-10 w-full rounded-lg border border-gray-200 px-3"
                    value={data.session.idleTimeoutMinutes}
                    onChange={(event) =>
                      setValue((current) => ({
                        ...current,
                        session: { ...current.session, idleTimeoutMinutes: Number(event.target.value) || 5 },
                      }))
                    }
                  />
                </label>
                <label className="mt-7 flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={data.session.rememberMeAllowed}
                    onChange={(event) =>
                      setValue((current) => ({
                        ...current,
                        session: { ...current.session, rememberMeAllowed: event.target.checked },
                      }))
                    }
                  />
                  Allow remember-me
                </label>
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-sm font-semibold text-gray-800">Password</h2>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-sm">
                  <span className="mb-1 block text-gray-700">Minimum length</span>
                  <input
                    type="number"
                    min={8}
                    max={64}
                    className="h-10 w-full rounded-lg border border-gray-200 px-3"
                    value={data.password.minLength}
                    onChange={(event) =>
                      setValue((current) => ({
                        ...current,
                        password: { ...current.password, minLength: Number(event.target.value) || 8 },
                      }))
                    }
                  />
                </label>
                <div className="space-y-2 pt-6 text-sm text-gray-700">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={data.password.requireUppercase}
                      onChange={(event) =>
                        setValue((current) => ({
                          ...current,
                          password: { ...current.password, requireUppercase: event.target.checked },
                        }))
                      }
                    />
                    Require uppercase
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={data.password.requireNumber}
                      onChange={(event) =>
                        setValue((current) => ({
                          ...current,
                          password: { ...current.password, requireNumber: event.target.checked },
                        }))
                      }
                    />
                    Require number
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={data.password.requireSpecialChar}
                      onChange={(event) =>
                        setValue((current) => ({
                          ...current,
                          password: { ...current.password, requireSpecialChar: event.target.checked },
                        }))
                      }
                    />
                    Require special character
                  </label>
                </div>
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-sm font-semibold text-gray-800">IP Allowlist</h2>
              <label className="mb-3 flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={data.ipAllowlist.enabled}
                  onChange={(event) =>
                    setValue((current) => ({
                      ...current,
                      ipAllowlist: { ...current.ipAllowlist, enabled: event.target.checked },
                    }))
                  }
                />
                Enforce allowlist
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-gray-700">Allowed entries (comma-separated IP or CIDR)</span>
                <input
                  className="h-10 w-full rounded-lg border border-gray-200 px-3"
                  value={ipEntriesText}
                  onChange={(event) => setIpEntriesText(event.target.value)}
                  placeholder="203.0.113.5, 10.0.0.0/24"
                />
              </label>
            </section>
          </div>
        )}

        <div className="mt-6">
          <button
            onClick={savePolicies}
            disabled={busy || saving || !data}
            className="rounded-lg bg-[#0891b2] px-4 py-2 text-sm font-medium text-white hover:bg-[#0e7490] disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Policies"}
          </button>
        </div>
      </div>
    </div>
  );
}
