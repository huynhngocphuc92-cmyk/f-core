import { Plus, Search, Filter, MoreHorizontal, LayoutList, Columns3, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { formatTicketNumber } from "@/lib/format-ticket-number";
import { TicketKanbanBoard } from "@/components/tickets/TicketKanbanBoard";

async function getTickets() {
  const tenant = await prisma.tenant.findFirst({
    where: { domain: "demo.f-core.com" },
    select: { id: true },
  });
  if (!tenant) return { tickets: [], pipeline: null };

  const [tickets, pipeline] = await Promise.all([
    prisma.ticket.findMany({
      where: { tenantId: tenant.id, deletedAt: null },
      include: {
        assignedTo: { select: { id: true, name: true, avatarUrl: true } },
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        company: { select: { id: true, name: true } },
        stage: { select: { id: true, name: true, type: true, color: true } },
        sla: { select: { id: true, name: true, firstResponseTime: true, resolutionTime: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.ticketPipeline.findFirst({
      where: { tenantId: tenant.id, isDefault: true, deletedAt: null },
      include: {
        stages: {
          where: { deletedAt: null },
          orderBy: { displayOrder: "asc" },
        },
      },
    }),
  ]);

  return { tickets, pipeline };
}

const priorityConfig: Record<string, { color: string; label: string }> = {
  urgent: { color: "bg-red-50 text-red-700 border-red-200", label: "Urgent" },
  high: { color: "bg-orange-50 text-orange-700 border-orange-200", label: "High" },
  medium: { color: "bg-blue-50 text-blue-700 border-blue-200", label: "Medium" },
  low: { color: "bg-gray-50 text-gray-600 border-gray-200", label: "Low" },
};

const statusConfig: Record<string, { color: string; label: string }> = {
  open: { color: "bg-blue-50 text-blue-700", label: "Open" },
  in_progress: { color: "bg-purple-50 text-purple-700", label: "In Progress" },
  waiting: { color: "bg-amber-50 text-amber-700", label: "Waiting" },
  resolved: { color: "bg-green-50 text-green-700", label: "Resolved" },
  closed: { color: "bg-gray-50 text-gray-600", label: "Closed" },
};

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { tickets, pipeline } = await getTickets();
  const params = await searchParams;
  const view = params.view || "list";

  const openCount = tickets.filter((t) => !["resolved", "closed"].includes(t.status)).length;

  return (
    <div className="p-6 pt-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
          <p className="text-gray-600 mt-1">
            {openCount} open &middot; {tickets.length} total
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden">
            <Link
              href="/tickets?view=list"
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                view === "list"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <LayoutList className="w-4 h-4" />
              List
            </Link>
            <Link
              href="/tickets?view=board"
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                view === "board"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Columns3 className="w-4 h-4" />
              Board
            </Link>
          </div>
          <Link
            href="/tickets/new"
            className="flex items-center gap-2 px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-[#0ea5e9] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create ticket
          </Link>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tickets..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      {view === "board" && pipeline ? (
        <TicketKanbanBoard tickets={tickets} stages={pipeline.stages} />
      ) : (
        /* List View - Table */
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-[#0891b2] focus:ring-[#0891b2]"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ticket
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="w-12 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tickets.map((ticket) => {
                const priority = priorityConfig[ticket.priority] || priorityConfig.medium;
                const status = statusConfig[ticket.status] || statusConfig.open;
                const isOverdue = ticket.dueDate && new Date(ticket.dueDate) < new Date() && !["resolved", "closed"].includes(ticket.status);

                return (
                  <tr
                    key={ticket.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300 text-[#0891b2] focus:ring-[#0891b2]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/tickets/${ticket.id}`}
                        className="block"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 font-mono">
                            {formatTicketNumber(ticket.ticketNumber)}
                          </span>
                          {isOverdue && (
                            <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                          )}
                        </div>
                        <span className="font-medium text-gray-900 hover:text-[#0891b2]">
                          {ticket.title}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-medium rounded border ${priority.color}`}
                      >
                        {priority.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {ticket.contact
                        ? `${ticket.contact.firstName || ""} ${ticket.contact.lastName || ""}`.trim()
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      {ticket.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#0891b2] flex items-center justify-center text-white text-xs font-medium">
                            {ticket.assignedTo.name?.charAt(0) || "?"}
                          </div>
                          <span className="text-sm text-gray-600">
                            {ticket.assignedTo.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(ticket.createdAt).toLocaleDateString()}
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

          {tickets.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No tickets found</p>
              <Link
                href="/tickets/new"
                className="inline-flex items-center gap-2 mt-4 text-[#0891b2] hover:text-[#0ea5e9]"
              >
                <Plus className="w-4 h-4" />
                Create your first ticket
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
