import Link from "next/link";
import {
  MessageCircle,
  Plus,
  Search,
  AlertCircle,
  UserCheck,
  CheckCircle2,
  Star,
  User,
} from "lucide-react";
import { getConversations, getConversationStats } from "@/app/actions/chat";
import { FilterSelect } from "@/components/crm/FilterSelect";

export const dynamic = "force-dynamic";

const statusConfig: Record<string, { label: string; color: string }> = {
  open: { label: "Open", color: "bg-blue-50 text-blue-700" },
  assigned: { label: "Assigned", color: "bg-yellow-50 text-yellow-700" },
  resolved: { label: "Resolved", color: "bg-green-50 text-green-700" },
  closed: { label: "Closed", color: "bg-gray-100 text-gray-500" },
};

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const params = await searchParams;
  const [conversations, stats] = await Promise.all([
    getConversations({
      search: params.search,
      status: params.status,
    }),
    getConversationStats(),
  ]);

  return (
    <div className="p-6 pt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Chat</h1>
          <p className="text-gray-600 mt-1">
            Manage chat conversations with visitors
          </p>
        </div>
        <Link
          href="/chat/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-[#0e7490] transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          New Conversation
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
              <MessageCircle className="w-4.5 h-4.5 text-gray-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <AlertCircle className="w-4.5 h-4.5 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.open}</p>
              <p className="text-xs text-gray-500">Open</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-yellow-50 flex items-center justify-center">
              <UserCheck className="w-4.5 h-4.5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">
                {stats.assigned}
              </p>
              <p className="text-xs text-gray-500">Assigned</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="w-4.5 h-4.5 text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">
                {stats.resolved}
              </p>
              <p className="text-xs text-gray-500">Resolved</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
              <Star className="w-4.5 h-4.5 text-amber-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">
                {stats.avgRating || "-"}
              </p>
              <p className="text-xs text-gray-500">Avg Rating</p>
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
            placeholder="Search conversations..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
          />
        </div>
        <FilterSelect
          name="status"
          defaultValue={params.status || "all"}
          options={[
            { value: "all", label: "All Statuses" },
            { value: "open", label: "Open" },
            { value: "assigned", label: "Assigned" },
            { value: "resolved", label: "Resolved" },
            { value: "closed", label: "Closed" },
          ]}
        />
      </form>

      {/* Conversations Table */}
      {conversations.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm text-center py-12">
          <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-1">No conversations found</p>
          <p className="text-sm text-gray-400">
            Conversations will appear when visitors start chatting
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Visitor
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Widget
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Messages
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Last Message
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Rating
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {conversations.map((conversation) => {
                const st =
                  statusConfig[conversation.status] || statusConfig.open;
                return (
                  <tr
                    key={conversation.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <Link
                        href={`/chat/${conversation.id}`}
                        className="flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-[#0891b2] transition-colors"
                      >
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        {conversation.visitorName || conversation.visitorEmail || "Anonymous Visitor"}
                      </Link>
                      {conversation.visitorEmail && conversation.visitorName && (
                        <p className="text-xs text-gray-400 mt-0.5 ml-5.5">
                          {conversation.visitorEmail}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${st.color}`}
                      >
                        {st.label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {conversation.widget ? (
                        <span className="flex items-center gap-1.5 text-sm text-gray-700">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor:
                                conversation.widget.color || "#0891b2",
                            }}
                          />
                          {conversation.widget.name}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-700">
                      {conversation.messageCount}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">
                      {conversation.lastMessageAt
                        ? new Date(conversation.lastMessageAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )
                        : "-"}
                    </td>
                    <td className="px-5 py-3">
                      {conversation.rating ? (
                        <span className="flex items-center gap-1 text-sm text-amber-600 font-medium">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          {conversation.rating}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
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
