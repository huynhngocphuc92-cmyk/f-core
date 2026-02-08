"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Send,
  Eye,
  MousePointer,
  Users,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Mail,
  BarChart3,
} from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  subject: string;
  previewText: string | null;
  fromName: string;
  fromEmail: string;
  status: string;
  totalRecipients: number;
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  totalUnsubscribed: number;
  sentAt: string | null;
  scheduledAt: string | null;
  completedAt: string | null;
  createdAt: string;
  template: { id: string; name: string } | null;
  list: { id: string; name: string; _count: { members: number } } | null;
  _count: { sends: number };
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-600", icon: FileText },
  scheduled: { label: "Scheduled", color: "bg-blue-100 text-blue-700", icon: Clock },
  sending: { label: "Sending", color: "bg-yellow-100 text-yellow-700", icon: Send },
  sent: { label: "Sent", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-600", icon: XCircle },
};

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch(`/api/email-marketing/campaigns/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) return;
        setCampaign(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  const handleSend = async () => {
    if (!campaign || sending) return;
    if (!confirm("Are you sure you want to send this campaign?")) return;

    setSending(true);
    try {
      const res = await fetch(`/api/email-marketing/campaigns/${campaign.id}/send`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        // Reload campaign data
        const updated = await fetch(`/api/email-marketing/campaigns/${campaign.id}`).then((r) => r.json());
        setCampaign(updated);
      }
    } catch {
      // error handled silently
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0891b2]" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-6 max-w-7xl mx-auto text-center py-20">
        <p className="text-gray-500">Campaign not found</p>
        <Link href="/email-marketing" className="text-[#0891b2] hover:underline mt-2 inline-block">
          Back to campaigns
        </Link>
      </div>
    );
  }

  const config = statusConfig[campaign.status] || statusConfig.draft;
  const StatusIcon = config.icon;
  const canSend = campaign.status === "draft" || campaign.status === "scheduled";

  const openRate = campaign.totalSent > 0 ? ((campaign.totalOpened / campaign.totalSent) * 100).toFixed(1) : "0.0";
  const clickRate = campaign.totalSent > 0 ? ((campaign.totalClicked / campaign.totalSent) * 100).toFixed(1) : "0.0";
  const bounceRate = campaign.totalSent > 0 ? ((campaign.totalBounced / campaign.totalSent) * 100).toFixed(1) : "0.0";
  const deliveryRate = campaign.totalSent > 0 ? ((campaign.totalDelivered / campaign.totalSent) * 100).toFixed(1) : "0.0";

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push("/email-marketing")}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
              <StatusIcon className="w-3 h-3" />
              {config.label}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{campaign.subject}</p>
        </div>
        {canSend && (
          <button
            onClick={handleSend}
            disabled={sending}
            className="flex items-center gap-2 px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-[#0ea5e9] transition-colors font-medium text-sm disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {sending ? "Sending..." : "Send Campaign"}
          </button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Recipients", value: campaign.totalRecipients || campaign.list?._count?.members || 0, icon: Users, sub: "total contacts" },
          { label: "Delivered", value: campaign.totalDelivered, icon: CheckCircle2, sub: `${deliveryRate}% rate` },
          { label: "Opened", value: campaign.totalOpened, icon: Eye, sub: `${openRate}% rate` },
          { label: "Clicked", value: campaign.totalClicked, icon: MousePointer, sub: `${clickRate}% rate` },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
              <stat.icon className="w-3.5 h-3.5" />
              {stat.label}
            </div>
            <div className="text-2xl font-semibold text-gray-900">{stat.value}</div>
            <div className="text-xs text-gray-400 mt-1">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Additional Stats Row */}
      {campaign.status === "sent" && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Bounced
            </div>
            <div className="text-lg font-semibold text-gray-900">{campaign.totalBounced}</div>
            <div className="text-xs text-gray-400">{bounceRate}% rate</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
              <XCircle className="w-3.5 h-3.5" />
              Unsubscribed
            </div>
            <div className="text-lg font-semibold text-gray-900">{campaign.totalUnsubscribed}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
              <BarChart3 className="w-3.5 h-3.5" />
              Total Sent
            </div>
            <div className="text-lg font-semibold text-gray-900">{campaign.totalSent}</div>
          </div>
        </div>
      )}

      {/* Campaign Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Campaign Details</h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-xs text-gray-500">From</dt>
              <dd className="text-sm text-gray-900">{campaign.fromName} &lt;{campaign.fromEmail}&gt;</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Subject</dt>
              <dd className="text-sm text-gray-900">{campaign.subject}</dd>
            </div>
            {campaign.previewText && (
              <div>
                <dt className="text-xs text-gray-500">Preview Text</dt>
                <dd className="text-sm text-gray-900">{campaign.previewText}</dd>
              </div>
            )}
            {campaign.description && (
              <div>
                <dt className="text-xs text-gray-500">Description</dt>
                <dd className="text-sm text-gray-900">{campaign.description}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Configuration</h3>
          <dl className="space-y-3">
            {campaign.template && (
              <div>
                <dt className="text-xs text-gray-500">Template</dt>
                <dd className="text-sm text-[#0891b2]">
                  <Link href={`/email-marketing/templates/${campaign.template.id}/edit`}>
                    {campaign.template.name}
                  </Link>
                </dd>
              </div>
            )}
            {campaign.list && (
              <div>
                <dt className="text-xs text-gray-500">Contact List</dt>
                <dd className="text-sm text-gray-900">
                  {campaign.list.name} ({campaign.list._count?.members || 0} contacts)
                </dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-gray-500">Created</dt>
              <dd className="text-sm text-gray-900">{new Date(campaign.createdAt).toLocaleString()}</dd>
            </div>
            {campaign.sentAt && (
              <div>
                <dt className="text-xs text-gray-500">Sent</dt>
                <dd className="text-sm text-gray-900">{new Date(campaign.sentAt).toLocaleString()}</dd>
              </div>
            )}
            {campaign.scheduledAt && (
              <div>
                <dt className="text-xs text-gray-500">Scheduled</dt>
                <dd className="text-sm text-gray-900">{new Date(campaign.scheduledAt).toLocaleString()}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Visual Stats Bar (for sent campaigns) */}
      {campaign.status === "sent" && campaign.totalSent > 0 && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Performance Funnel</h3>
          <div className="space-y-3">
            {[
              { label: "Sent", value: campaign.totalSent, pct: 100, color: "bg-gray-400" },
              { label: "Delivered", value: campaign.totalDelivered, pct: (campaign.totalDelivered / campaign.totalSent) * 100, color: "bg-blue-500" },
              { label: "Opened", value: campaign.totalOpened, pct: (campaign.totalOpened / campaign.totalSent) * 100, color: "bg-green-500" },
              { label: "Clicked", value: campaign.totalClicked, pct: (campaign.totalClicked / campaign.totalSent) * 100, color: "bg-[#0891b2]" },
            ].map((bar) => (
              <div key={bar.label} className="flex items-center gap-3">
                <div className="w-20 text-xs text-gray-600">{bar.label}</div>
                <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                  <div
                    className={`h-full ${bar.color} rounded-full flex items-center justify-end pr-2 transition-all duration-500`}
                    style={{ width: `${Math.max(bar.pct, 2)}%` }}
                  >
                    <span className="text-[10px] font-medium text-white">{bar.pct.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="w-12 text-right text-xs text-gray-500">{bar.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
