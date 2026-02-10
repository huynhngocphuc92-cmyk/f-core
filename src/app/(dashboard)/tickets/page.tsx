import Link from "next/link";
import {
  Plus,
  Search,
  Ticket,
  AlertCircle,
  Clock,
  CheckCircle2,
  User,
  Building2,
} from "lucide-react";
import { getTickets, getTicketStats } from "@/app/actions/tickets";

export const dynamic = "force-dynamic";

const statusConfig: Record<string, { label: string; color: string }> = {
  open: { label: "Open", color: "bg-blue-50 text-blue-700" },
  in_progress: { label: "In Progress", color: "bg-yellow-50 text-yellow-700" },
  waiting: { label: "Waiting", color: "bg-gray-100 text-gray-600" },
  resolved: { label: "Resolved", color: "bg-green-50 text-green-700" },
  closed: { label: "Closed", color: "bg-gray-100 text-gray-500" },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: "Low", color: "text-gray-500" },
  medium: { label: "Medium", color: "text-blue-600" },
  high: { label: "High", color: "text-orange-600" },
  urgent: { label: "Urgent", color: "text-red-600" },
};

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; priority?: string }>;
}) {
  const params = await searchParams;
  const [tickets, stats] = await Promise.all([
    getTickets({
      search: params.search,
      status: params.status,
      priority: params.priority,
    }),
    getTicketStats(),
  ]);

  return (
    <div className="p-6 pt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
          <p className="text-gray-600 mt-1">
            Manage support tickets and requests
          </p>
        </div>
        <Link
          href="/tickets/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-[#0e7490] transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          New Ticket
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
              <Ticket className="w-4.5 h-4.5 text-gray-600" />
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
              <Clock className="w-4.5 h-4.5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.inProgress}</p>
              <p className="text-xs text-gray-500">In Progress</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="w-4.5 h-4.5 text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.resolved}</p>
              <p className="text-xs text-gray-500">Resolved</p>
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
            placeholder="Search tickets..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
          />
        </div>
        <select
          name="status"
          defaultValue={params.status || "all"}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
          onChange={(e) => {
            const form = e.target.form;
            if (form) form.requestSubmit();
          }}
        >
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="waiting">Waiting</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select
          name="priority"
          defaultValue={params.priority || "all"}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
          onChange={(e) => {
            const form = e.target.form;
            if (form) form.requestSubmit();
          }}
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </form>

      {/* Tickets Table */}
      {tickets.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm text-center py-12">
          <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-1">No tickets found</p>
          <p className="text-sm text-gray-400">Create a new ticket to get started</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  #
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Subject
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Priority
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Assignee
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Contact
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tickets.map((ticket) => {
                const st = statusConfig[ticket.status] || statusConfig.open;
                const pr = priorityConfig[ticket.priority] || priorityConfig.medium;
                return (
                  <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-sm text-gray-400">
                      #{ticket.ticketNumber}
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/tickets/${ticket.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-[#0891b2] transition-colors"
                      >
                        {ticket.subject}
                      </Link>
                      {ticket.category && (
                        <span className="ml-2 px-1.5 py-0.5 text-[10px] font-medium rounded bg-gray-100 text-gray-500">
                          {ticket.category}
                        </span>
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
                      <span className={`text-sm font-medium ${pr.color}`}>
                        {pr.label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {ticket.assignee ? (
                        <span className="flex items-center gap-1.5 text-sm text-gray-700">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          {ticket.assignee.name || ticket.assignee.email}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">Unassigned</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {ticket.contact ? (
                        <Link
                          href={`/contacts/${ticket.contact.id}`}
                          className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-[#0891b2]"
                        >
                          {[ticket.contact.firstName, ticket.contact.lastName]
                            .filter(Boolean)
                            .join(" ")}
                        </Link>
                      ) : ticket.company ? (
                        <Link
                          href={`/companies/${ticket.company.id}`}
                          className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-[#0891b2]"
                        >
                          <Building2 className="w-3.5 h-3.5 text-gray-400" />
                          {ticket.company.name}
                        </Link>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">
                      {new Date(ticket.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
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
