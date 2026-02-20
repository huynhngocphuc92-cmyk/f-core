"use client";

import { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";

type ConnectorId = "google_ads" | "meta_ads" | "linkedin_ads";

type Connector = {
  connectorId: ConnectorId;
  name: string;
  connected: boolean;
  accountId: string | null;
  status: "connected" | "error" | "disconnected";
  dailyBudget: number;
  syncWindowDays: number;
  lastSyncedAt: string | null;
};

type Campaign = {
  id: string;
  connectorId: ConnectorId;
  campaignName: string;
  status: "active" | "paused";
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  syncedAt: string;
};

type AdsSummary = {
  totalCampaigns: number;
  activeCampaigns: number;
  pausedCampaigns: number;
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalLeads: number;
  ctrPct: number;
  cpl: number;
};

type ConnectorsResponse = {
  connectors: Record<ConnectorId, Connector>;
  summary: AdsSummary;
};

type CampaignsResponse = {
  data: Campaign[];
  summary: AdsSummary;
};

export default function MarketingAdsPage() {
  const [connectors, setConnectors] = useState<Record<ConnectorId, Connector> | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [summary, setSummary] = useState<AdsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      const [connectorsResponse, campaignsResponse] = await Promise.all([
        fetch("/api/marketing/ads/connectors"),
        fetch("/api/marketing/ads/campaigns"),
      ]);

      const connectorsBody = (await connectorsResponse.json()) as ConnectorsResponse & { error?: string };
      const campaignsBody = (await campaignsResponse.json()) as CampaignsResponse & { error?: string };

      if (!connectorsResponse.ok) {
        throw new Error(connectorsBody.error || "Unable to load ads connectors");
      }

      if (!campaignsResponse.ok) {
        throw new Error(campaignsBody.error || "Unable to load ads campaigns");
      }

      setConnectors(connectorsBody.connectors);
      setCampaigns(campaignsBody.data);
      setSummary(campaignsBody.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load ads module");
      setConnectors(null);
      setCampaigns([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function toggleConnector(connector: Connector) {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/marketing/ads/connectors", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectorId: connector.connectorId,
          connected: !connector.connected,
          accountId: connector.accountId || `${connector.connectorId}-account`,
          dailyBudget: connector.dailyBudget || 300,
          syncWindowDays: connector.syncWindowDays || 30,
          authConfig: {
            apiKey: `demo-${connector.connectorId}-api-key`,
          },
        }),
      });

      const body = (await response.json()) as ConnectorsResponse & { error?: string };
      if (!response.ok) throw new Error(body.error || "Unable to update connector");

      setConnectors(body.connectors);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update connector");
    } finally {
      setSaving(false);
    }
  }

  async function syncCampaigns(connectorId?: ConnectorId) {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/marketing/ads/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectorId }),
      });

      const body = (await response.json()) as CampaignsResponse & { error?: string };
      if (!response.ok) throw new Error(body.error || "Unable to sync campaigns");

      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sync campaigns");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 pt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ads Connectors</h1>
        <p className="mt-1 text-gray-600">
          Connect ad networks and sync campaign spend metrics into marketing reporting.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Loading ads connectors...
        </div>
      ) : !connectors || !summary ? null : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
            <Metric label="Campaigns" value={String(summary.totalCampaigns)} />
            <Metric label="Spend" value={formatMoney(summary.totalSpend)} />
            <Metric label="Leads" value={String(summary.totalLeads)} />
            <Metric label="CTR" value={`${summary.ctrPct}%`} />
            <Metric label="CPL" value={formatMoney(summary.cpl)} />
          </div>

          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">Connectors</p>
              <button
                onClick={() => syncCampaigns()}
                disabled={saving}
                className="rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                Sync All
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {(Object.values(connectors) as Connector[]).map((connector) => (
                <div key={connector.connectorId} className="rounded-lg border border-gray-200 p-3">
                  <p className="text-sm font-semibold text-gray-900">{connector.name}</p>
                  <p className="text-xs text-gray-500">Status: {connector.status}</p>
                  <p className="text-xs text-gray-500">Account: {connector.accountId || "-"}</p>
                  <p className="text-xs text-gray-500">Budget/day: {formatMoney(connector.dailyBudget)}</p>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => toggleConnector(connector)}
                      disabled={saving}
                      className="rounded border border-gray-200 px-2 py-1 text-xs"
                    >
                      {connector.connected ? "Disconnect" : "Connect"}
                    </button>
                    <button
                      onClick={() => syncCampaigns(connector.connectorId)}
                      disabled={saving || !connector.connected}
                      className="rounded border border-gray-200 px-2 py-1 text-xs disabled:opacity-50"
                    >
                      Sync
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
              <Megaphone className="h-4 w-4 text-[#0891b2]" />
              <p className="text-sm font-medium text-gray-900">Synced Campaigns</p>
            </div>

            {campaigns.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                No ad campaigns synced yet. Connect a connector and run sync.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{campaign.campaignName}</p>
                        <p className="text-xs text-gray-500">
                          {campaign.connectorId} • {campaign.status} • synced {new Date(campaign.syncedAt).toLocaleString("en-US")}
                        </p>
                      </div>
                      <div className="text-right text-xs text-gray-600">
                        <p>Spend: {formatMoney(campaign.spend)}</p>
                        <p>Leads: {campaign.leads}</p>
                        <p>Clicks: {campaign.clicks}</p>
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

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}
