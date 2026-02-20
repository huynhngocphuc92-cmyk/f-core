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
import { FilterSelect } from "@/components/crm/FilterSelect";
import { getServerI18n } from "@/i18n/server";

export const dynamic = "force-dynamic";

const statusConfig: Record<
  string,
  { key: string; fallback: string; color: string }
> = {
  open: {
    key: "dashboard.tickets.status.open",
    fallback: "Open",
    color: "bg-blue-50 text-blue-700",
  },
  in_progress: {
    key: "dashboard.tickets.status.inProgress",
    fallback: "In Progress",
    color: "bg-yellow-50 text-yellow-700",
  },
  waiting: {
    key: "dashboard.tickets.status.waiting",
    fallback: "Waiting",
    color: "bg-gray-100 text-gray-600",
  },
  resolved: {
    key: "dashboard.tickets.status.resolved",
    fallback: "Resolved",
    color: "bg-green-50 text-green-700",
  },
  closed: {
    key: "dashboard.tickets.status.closed",
    fallback: "Closed",
    color: "bg-gray-100 text-gray-500",
  },
};

const priorityConfig: Record<
  string,
  { key: string; fallback: string; color: string }
> = {
  low: {
    key: "dashboard.tickets.priority.low",
    fallback: "Low",
    color: "text-gray-500",
  },
  medium: {
    key: "dashboard.tickets.priority.medium",
    fallback: "Medium",
    color: "text-blue-600",
  },
  high: {
    key: "dashboard.tickets.priority.high",
    fallback: "High",
    color: "text-orange-600",
  },
  urgent: {
    key: "dashboard.tickets.priority.urgent",
    fallback: "Urgent",
    color: "text-red-600",
  },
};

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; priority?: string }>;
}) {
  const { t, intlLocale } = await getServerI18n();
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("dashboard.tickets.title", "Tickets")}
          </h1>
          <p className="mt-1 text-gray-600">
            {t(
              "dashboard.tickets.subtitle",
              "Manage support tickets and requests"
            )}
          </p>
        </div>
        <Link
          href="/tickets/new"
          className="flex items-center gap-2 rounded-lg bg-[#0891b2] px-4 py-2 text-sm text-white transition-colors hover:bg-[#0e7490]"
        >
          <Plus className="h-4 w-4" />
          {t("dashboard.tickets.newTicket", "New Ticket")}
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
              <Ticket className="h-4.5 w-4.5 text-gray-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">
                {t("dashboard.tickets.stats.total", "Total")}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
              <AlertCircle className="h-4.5 w-4.5 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.open}</p>
              <p className="text-xs text-gray-500">
                {t("dashboard.tickets.stats.open", "Open")}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-50">
              <Clock className="h-4.5 w-4.5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">
                {stats.inProgress}
              </p>
              <p className="text-xs text-gray-500">
                {t("dashboard.tickets.stats.inProgress", "In Progress")}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50">
              <CheckCircle2 className="h-4.5 w-4.5 text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">
                {stats.resolved}
              </p>
              <p className="text-xs text-gray-500">
                {t("dashboard.tickets.stats.resolved", "Resolved")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <form className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            name="search"
            type="text"
            defaultValue={params.search || ""}
            placeholder={t(
              "dashboard.tickets.filters.searchPlaceholder",
              "Search tickets..."
            )}
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-4 text-sm focus:border-[#0891b2] focus:outline-none"
          />
        </div>
        <FilterSelect
          name="status"
          defaultValue={params.status || "all"}
          options={[
            {
              value: "all",
              label: t(
                "dashboard.tickets.filters.allStatuses",
                "All Statuses"
              ),
            },
            {
              value: "open",
              label: t("dashboard.tickets.status.open", "Open"),
            },
            {
              value: "in_progress",
              label: t("dashboard.tickets.status.inProgress", "In Progress"),
            },
            {
              value: "waiting",
              label: t("dashboard.tickets.status.waiting", "Waiting"),
            },
            {
              value: "resolved",
              label: t("dashboard.tickets.status.resolved", "Resolved"),
            },
            {
              value: "closed",
              label: t("dashboard.tickets.status.closed", "Closed"),
            },
          ]}
        />
        <FilterSelect
          name="priority"
          defaultValue={params.priority || "all"}
          options={[
            {
              value: "all",
              label: t(
                "dashboard.tickets.filters.allPriorities",
                "All Priorities"
              ),
            },
            {
              value: "urgent",
              label: t("dashboard.tickets.priority.urgent", "Urgent"),
            },
            {
              value: "high",
              label: t("dashboard.tickets.priority.high", "High"),
            },
            {
              value: "medium",
              label: t("dashboard.tickets.priority.medium", "Medium"),
            },
            {
              value: "low",
              label: t("dashboard.tickets.priority.low", "Low"),
            },
          ]}
        />
      </form>

      {tickets.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-12 text-center shadow-sm">
          <Ticket className="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <p className="mb-1 text-gray-500">
            {t("dashboard.tickets.empty.title", "No tickets found")}
          </p>
          <p className="text-sm text-gray-400">
            {t(
              "dashboard.tickets.empty.subtitle",
              "Create a new ticket to get started"
            )}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                  {t("dashboard.tickets.table.number", "#")}
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                  {t("dashboard.tickets.table.subject", "Subject")}
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                  {t("dashboard.tickets.table.status", "Status")}
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                  {t("dashboard.tickets.table.priority", "Priority")}
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                  {t("dashboard.tickets.table.assignee", "Assignee")}
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                  {t("dashboard.tickets.table.contact", "Contact")}
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                  {t("dashboard.tickets.table.sla", "SLA")}
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                  {t("dashboard.tickets.table.created", "Created")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tickets.map((ticket) => {
                const st = statusConfig[ticket.status] || statusConfig.open;
                const pr = priorityConfig[ticket.priority] || priorityConfig.medium;
                return (
                  <tr
                    key={ticket.id}
                    className="transition-colors hover:bg-gray-50"
                  >
                    <td className="px-5 py-3 text-sm text-gray-400">
                      #{ticket.ticketNumber}
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/tickets/${ticket.id}`}
                        className="text-sm font-medium text-gray-900 transition-colors hover:text-[#0891b2]"
                      >
                        {ticket.subject}
                      </Link>
                      {ticket.category && (
                        <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                          {ticket.category}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${st.color}`}
                      >
                        {t(st.key, st.fallback)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-sm font-medium ${pr.color}`}>
                        {t(pr.key, pr.fallback)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {ticket.assignee ? (
                        <span className="flex items-center gap-1.5 text-sm text-gray-700">
                          <User className="h-3.5 w-3.5 text-gray-400" />
                          {ticket.assignee.name || ticket.assignee.email}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">
                          {t("dashboard.common.unassigned", "Unassigned")}
                        </span>
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
                          <Building2 className="h-3.5 w-3.5 text-gray-400" />
                          {ticket.company.name}
                        </Link>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-medium ${
                            ticket.sla?.breached
                              ? "bg-red-50 text-red-700"
                              : ticket.sla?.atRisk
                                ? "bg-amber-50 text-amber-700"
                                : "bg-green-50 text-green-700"
                          }`}
                        >
                          {ticket.sla?.breached
                            ? t(
                                "dashboard.tickets.sla.breached",
                                "Breached"
                              )
                            : ticket.sla?.atRisk
                              ? t("dashboard.tickets.sla.atRisk", "At risk")
                              : t("dashboard.tickets.sla.onTrack", "On track")}
                        </span>
                        <span className="text-xs text-gray-500">
                          {t("dashboard.common.dueLabel", "Due {date}", {
                            date: new Date(
                              ticket.sla?.resolution?.dueAt ||
                                ticket.dueDate ||
                                ticket.createdAt
                            ).toLocaleDateString(intlLocale, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }),
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">
                      {new Date(ticket.createdAt).toLocaleDateString(intlLocale, {
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
