"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Mail,
  Plus,
  Search,
  MoreHorizontal,
  Send,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  MousePointer,
  AlertTriangle,
} from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  fromName: string;
  fromEmail: string;
  totalRecipients: number;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  sentAt: string | null;
  scheduledAt: string | null;
  createdAt: string;
  template?: { id: string; name: string } | null;
  list?: { id: string; name: string; memberCount: number } | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-600", icon: FileText },
  scheduled: { label: "Scheduled", color: "bg-blue-100 text-blue-700", icon: Clock },
  sending: { label: "Sending", color: "bg-yellow-100 text-yellow-700", icon: Send },
  sent: { label: "Sent", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-600", icon: XCircle },
};

export default function EmailMarketingPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (statusFilter) params.set("status", statusFilter);

    fetch(`/api/email-marketing/campaigns?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setCampaigns(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [debouncedSearch, statusFilter]);

  const openRate = (c: Campaign) =>
    c.totalSent > 0 ? ((c.totalOpened / c.totalSent) * 100).toFixed(1) : "—";
  const clickRate = (c: Campaign) =>
    c.totalSent > 0 ? ((c.totalClicked / c.totalSent) * 100).toFixed(1) : "—";

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Marketing</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create and manage email campaigns
          </p>
        </div>
        <Link
          href="/email-marketing/campaigns/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-[#0ea5e9] transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Create campaign
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Campaigns", value: campaigns.length, icon: Mail },
          { label: "Sent", value: campaigns.filter((c) => c.status === "sent").length, icon: Send },
          { label: "Avg. Open Rate", value: campaigns.filter((c) => c.totalSent > 0).length > 0 ? (campaigns.filter((c) => c.totalSent > 0).reduce((sum, c) => sum + (c.totalOpened / c.totalSent) * 100, 0) / campaigns.filter((c) => c.totalSent > 0).length).toFixed(1) + "%" : "—", icon: Eye },
          { label: "Avg. Click Rate", value: campaigns.filter((c) => c.totalSent > 0).length > 0 ? (campaigns.filter((c) => c.totalSent > 0).reduce((sum, c) => sum + (c.totalClicked / c.totalSent) * 100, 0) / campaigns.filter((c) => c.totalSent > 0).length).toFixed(1) + "%" : "—", icon: MousePointer },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
              <stat.icon className="w-3.5 h-3.5" />
              {stat.label}
            </div>
            <div className="text-xl font-semibold text-gray-900">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
          />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {["", "draft", "scheduled", "sent", "cancelled"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                statusFilter === s
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0891b2]" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-20">
            <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No campaigns found</p>
            <Link
              href="/email-marketing/campaigns/new"
              className="inline-flex items-center gap-1.5 mt-3 text-sm text-[#0891b2] hover:underline"
            >
              <Plus className="w-3.5 h-3.5" /> Create your first campaign
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Campaign</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Recipients</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Open Rate</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Click Rate</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => {
                const config = statusConfig[campaign.status] || statusConfig.draft;
                const StatusIcon = config.icon;
                return (
                  <tr key={campaign.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/email-marketing/campaigns/${campaign.id}`} className="block">
                        <div className="text-sm font-medium text-gray-900 hover:text-[#0891b2]">
                          {campaign.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">{campaign.subject}</div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {config.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {campaign.totalRecipients || (campaign.list?.memberCount ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{openRate(campaign)}%</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{clickRate(campaign)}%</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {campaign.sentAt
                        ? new Date(campaign.sentAt).toLocaleDateString()
                        : new Date(campaign.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Quick Links */}
      <div className="flex gap-4 mt-6">
        <Link
          href="/email-marketing/templates"
          className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl border border-gray-200 hover:border-[#0891b2] transition-colors text-sm text-gray-700"
        >
          <FileText className="w-4 h-4 text-[#0891b2]" />
          Templates
        </Link>
        <Link
          href="/email-marketing/lists"
          className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl border border-gray-200 hover:border-[#0891b2] transition-colors text-sm text-gray-700"
        >
          <AlertTriangle className="w-4 h-4 text-[#0891b2]" />
          Contact Lists
        </Link>
      </div>
    </div>
  );
}
