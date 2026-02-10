import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Send,
  Users,
  Eye,
  MousePointerClick,
  AlertTriangle,
  UserMinus,
  CalendarDays,
} from "lucide-react";
import { getCampaign } from "@/app/actions/campaigns";
import { SendButton, DeleteButton } from "./CampaignActions";

export const dynamic = "force-dynamic";

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-600" },
  scheduled: { label: "Scheduled", color: "bg-blue-50 text-blue-700" },
  sending: { label: "Sending", color: "bg-yellow-50 text-yellow-700" },
  sent: { label: "Sent", color: "bg-green-50 text-green-700" },
  cancelled: { label: "Cancelled", color: "bg-red-50 text-red-600" },
};

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await getCampaign(id);

  if (!campaign) notFound();

  const st = statusConfig[campaign.status] || statusConfig.draft;
  const openRate =
    campaign.deliveredCount > 0
      ? Math.round((campaign.openedCount / campaign.deliveredCount) * 100)
      : 0;
  const clickRate =
    campaign.openedCount > 0
      ? Math.round((campaign.clickedCount / campaign.openedCount) * 100)
      : 0;
  const bounceRate =
    campaign.sentCount > 0
      ? Math.round((campaign.bouncedCount / campaign.sentCount) * 100)
      : 0;

  return (
    <div className="p-6 pt-8">
      <Link
        href="/email-marketing"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#0891b2] transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Campaigns
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {campaign.name}
                </h1>
                <div className="flex items-center gap-3 mt-2">
                  <span
                    className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${st.color}`}
                  >
                    {st.label}
                  </span>
                  {campaign.owner && (
                    <span className="text-sm text-gray-500">
                      by {campaign.owner.name}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {campaign.status === "draft" && (
                  <SendButton campaignId={campaign.id} />
                )}
                <DeleteButton campaignId={campaign.id} />
              </div>
            </div>
          </div>

          {/* Analytics */}
          {campaign.status === "sent" && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-500">Delivered</span>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {campaign.deliveredCount.toLocaleString()}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Eye className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-gray-500">Opened</span>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {openRate}%
                </p>
                <p className="text-xs text-gray-400">
                  {campaign.openedCount.toLocaleString()} opens
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-1">
                  <MousePointerClick className="w-4 h-4 text-blue-500" />
                  <span className="text-xs text-gray-500">Clicked</span>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {clickRate}%
                </p>
                <p className="text-xs text-gray-400">
                  {campaign.clickedCount.toLocaleString()} clicks
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-xs text-gray-500">Bounced</span>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {bounceRate}%
                </p>
                <p className="text-xs text-gray-400">
                  {campaign.bouncedCount.toLocaleString()} bounces
                </p>
              </div>
            </div>
          )}

          {/* Email Content */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
              Email Content
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Subject</p>
                <p className="text-sm text-gray-900 font-medium">
                  {campaign.subject}
                </p>
              </div>
              {campaign.previewText && (
                <div>
                  <p className="text-xs text-gray-500">Preview Text</p>
                  <p className="text-sm text-gray-700">
                    {campaign.previewText}
                  </p>
                </div>
              )}
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs text-gray-500 mb-2">Body</p>
                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                  {campaign.body}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
              Details
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <span
                  className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${st.color}`}
                >
                  {st.label}
                </span>
              </div>
              {campaign.sentAt && (
                <div>
                  <p className="text-xs text-gray-500">Sent at</p>
                  <p className="flex items-center gap-1.5 text-sm text-gray-700">
                    <Send className="w-3.5 h-3.5 text-gray-400" />
                    {new Date(campaign.sentAt).toLocaleString()}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500">Created</p>
                <p className="flex items-center gap-1.5 text-sm text-gray-700">
                  <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                  {new Date(campaign.createdAt).toLocaleString()}
                </p>
              </div>
              {campaign.recipientCount > 0 && (
                <div>
                  <p className="text-xs text-gray-500">Recipients</p>
                  <p className="flex items-center gap-1.5 text-sm text-gray-700">
                    <Users className="w-3.5 h-3.5 text-gray-400" />
                    {campaign.recipientCount.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
