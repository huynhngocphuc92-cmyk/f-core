import Link from "next/link";
import {
  Plus,
  Search,
  Mail,
  Send,
  FileText,
  BarChart2,
  Eye,
  MousePointerClick,
} from "lucide-react";
import { getCampaigns, getCampaignStats } from "@/app/actions/campaigns";
import { FilterSelect } from "@/components/crm/FilterSelect";

export const dynamic = "force-dynamic";

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-600" },
  scheduled: { label: "Scheduled", color: "bg-blue-50 text-blue-700" },
  sending: { label: "Sending", color: "bg-yellow-50 text-yellow-700" },
  sent: { label: "Sent", color: "bg-green-50 text-green-700" },
  cancelled: { label: "Cancelled", color: "bg-red-50 text-red-600" },
};

export default async function EmailMarketingPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const params = await searchParams;
  const [campaigns, stats] = await Promise.all([
    getCampaigns({ search: params.search, status: params.status }),
    getCampaignStats(),
  ]);

  return (
    <div className="p-6 pt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Marketing</h1>
          <p className="text-gray-600 mt-1">
            Create and manage email campaigns
          </p>
        </div>
        <Link
          href="/email-marketing/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-[#0e7490] transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Campaigns</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.drafts}</p>
              <p className="text-xs text-gray-500">Drafts</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <Send className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.sent}</p>
              <p className="text-xs text-gray-500">Sent</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.avgOpenRate}%</p>
              <p className="text-xs text-gray-500">Open Rate</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <MousePointerClick className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.avgClickRate}%</p>
              <p className="text-xs text-gray-500">Click Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            name="search"
            type="text"
            defaultValue={params.search || ""}
            placeholder="Search campaigns..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
          />
        </div>
        <FilterSelect
          name="status"
          defaultValue={params.status || "all"}
          options={[
            { value: "all", label: "All Statuses" },
            { value: "draft", label: "Drafts" },
            { value: "sent", label: "Sent" },
            { value: "scheduled", label: "Scheduled" },
          ]}
        />
      </form>

      {/* Campaigns List */}
      {campaigns.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm text-center py-12">
          <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-1">No campaigns yet</p>
          <p className="text-sm text-gray-400">
            Create your first email campaign
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Campaign
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Recipients
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Open Rate
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Click Rate
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {campaigns.map((campaign) => {
                const st = statusConfig[campaign.status] || statusConfig.draft;
                const openRate =
                  campaign.deliveredCount > 0
                    ? Math.round(
                        (campaign.openedCount / campaign.deliveredCount) * 100
                      )
                    : 0;
                const clickRate =
                  campaign.openedCount > 0
                    ? Math.round(
                        (campaign.clickedCount / campaign.openedCount) * 100
                      )
                    : 0;

                return (
                  <tr
                    key={campaign.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <Link
                        href={`/email-marketing/campaigns/${campaign.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-[#0891b2] transition-colors"
                      >
                        {campaign.name}
                      </Link>
                      <p className="text-xs text-gray-500 truncate max-w-[250px]">
                        {campaign.subject}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${st.color}`}
                      >
                        {st.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-700">
                      {campaign.recipientCount > 0
                        ? campaign.recipientCount.toLocaleString()
                        : "-"}
                    </td>
                    <td className="px-5 py-3">
                      {campaign.status === "sent" ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full">
                            <div
                              className="h-full bg-green-500 rounded-full"
                              style={{ width: `${openRate}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-700">
                            {openRate}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {campaign.status === "sent" ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${clickRate}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-700">
                            {clickRate}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">
                      {campaign.sentAt
                        ? new Date(campaign.sentAt).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" }
                          )
                        : new Date(campaign.createdAt).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" }
                          )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
