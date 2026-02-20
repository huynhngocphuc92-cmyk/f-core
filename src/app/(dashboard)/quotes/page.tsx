import Link from "next/link";
import {
  Plus,
  Search,
  FileText,
  DollarSign,
  Clock,
  CheckCircle2,
  Send,
} from "lucide-react";

import { getQuotes, getQuoteStats } from "@/app/actions/quotes";
import { FilterSelect } from "@/components/crm/FilterSelect";
import { getServerI18n } from "@/i18n/server";

export const dynamic = "force-dynamic";

const statusConfig: Record<
  string,
  { key: string; fallback: string; color: string }
> = {
  draft: {
    key: "dashboard.quotes.status.draft",
    fallback: "Draft",
    color: "bg-gray-100 text-gray-600",
  },
  pending: {
    key: "dashboard.quotes.status.pending",
    fallback: "Pending",
    color: "bg-blue-50 text-blue-700",
  },
  sent: {
    key: "dashboard.quotes.status.sent",
    fallback: "Sent",
    color: "bg-yellow-50 text-yellow-700",
  },
  approved: {
    key: "dashboard.quotes.status.approved",
    fallback: "Approved",
    color: "bg-green-50 text-green-700",
  },
  rejected: {
    key: "dashboard.quotes.status.rejected",
    fallback: "Rejected",
    color: "bg-red-50 text-red-700",
  },
  expired: {
    key: "dashboard.quotes.status.expired",
    fallback: "Expired",
    color: "bg-gray-100 text-gray-500",
  },
};

const cpqStatusConfig: Record<
  string,
  { key: string; fallback: string; color: string }
> = {
  not_requested: {
    key: "dashboard.quotes.cpqStatus.notRequested",
    fallback: "Not Requested",
    color: "bg-gray-100 text-gray-600",
  },
  pending: {
    key: "dashboard.quotes.cpqStatus.pending",
    fallback: "Pending",
    color: "bg-amber-50 text-amber-700",
  },
  approved: {
    key: "dashboard.quotes.cpqStatus.approved",
    fallback: "Approved",
    color: "bg-emerald-50 text-emerald-700",
  },
  rejected: {
    key: "dashboard.quotes.cpqStatus.rejected",
    fallback: "Rejected",
    color: "bg-red-50 text-red-700",
  },
  not_sent: {
    key: "dashboard.quotes.cpqStatus.notSent",
    fallback: "Not Sent",
    color: "bg-gray-100 text-gray-600",
  },
  sent: {
    key: "dashboard.quotes.cpqStatus.sent",
    fallback: "Sent",
    color: "bg-blue-50 text-blue-700",
  },
  viewed: {
    key: "dashboard.quotes.cpqStatus.viewed",
    fallback: "Viewed",
    color: "bg-indigo-50 text-indigo-700",
  },
  signed: {
    key: "dashboard.quotes.cpqStatus.signed",
    fallback: "Signed",
    color: "bg-emerald-50 text-emerald-700",
  },
  declined: {
    key: "dashboard.quotes.cpqStatus.declined",
    fallback: "Declined",
    color: "bg-red-50 text-red-700",
  },
};

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const { t, intlLocale } = await getServerI18n();
  const params = await searchParams;
  const [quotes, stats] = await Promise.all([
    getQuotes({
      search: params.search,
      status: params.status,
    }),
    getQuoteStats(),
  ]);

  return (
    <div className="p-6 pt-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("dashboard.quotes.title", "Quotes")}
          </h1>
          <p className="mt-1 text-gray-600">
            {t(
              "dashboard.quotes.subtitle",
              "Create and manage sales quotes"
            )}
          </p>
        </div>
        <Link
          href="/quotes/new"
          className="flex items-center gap-2 rounded-lg bg-[#0891b2] px-4 py-2 text-sm text-white transition-colors hover:bg-[#0e7490]"
        >
          <Plus className="h-4 w-4" />
          {t("dashboard.quotes.newQuote", "New Quote")}
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
              <FileText className="h-4.5 w-4.5 text-gray-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">
                {t("dashboard.quotes.stats.totalQuotes", "Total Quotes")}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
              <Clock className="h-4.5 w-4.5 text-gray-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.draft}</p>
              <p className="text-xs text-gray-500">
                {t("dashboard.quotes.stats.drafts", "Drafts")}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
              <Send className="h-4.5 w-4.5 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.pending}</p>
              <p className="text-xs text-gray-500">
                {t("dashboard.quotes.stats.pending", "Pending")}
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
                {stats.approved}
              </p>
              <p className="text-xs text-gray-500">
                {t("dashboard.quotes.stats.approved", "Approved")}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
              <DollarSign className="h-4.5 w-4.5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">
                ${stats.totalValue.toLocaleString(intlLocale)}
              </p>
              <p className="text-xs text-gray-500">
                {t("dashboard.quotes.stats.totalValue", "Total Value")}
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
              "dashboard.quotes.filters.searchPlaceholder",
              "Search quotes..."
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
                "dashboard.quotes.filters.allStatuses",
                "All Statuses"
              ),
            },
            {
              value: "draft",
              label: t("dashboard.quotes.status.draft", "Draft"),
            },
            {
              value: "pending",
              label: t("dashboard.quotes.status.pending", "Pending"),
            },
            {
              value: "sent",
              label: t("dashboard.quotes.status.sent", "Sent"),
            },
            {
              value: "approved",
              label: t("dashboard.quotes.status.approved", "Approved"),
            },
            {
              value: "rejected",
              label: t("dashboard.quotes.status.rejected", "Rejected"),
            },
            {
              value: "expired",
              label: t("dashboard.quotes.status.expired", "Expired"),
            },
          ]}
        />
      </form>

      {quotes.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-12 text-center shadow-sm">
          <FileText className="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <p className="mb-1 text-gray-500">
            {t("dashboard.quotes.empty.title", "No quotes found")}
          </p>
          <p className="text-sm text-gray-400">
            {t(
              "dashboard.quotes.empty.subtitle",
              "Create a new quote to get started"
            )}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                  {t("dashboard.quotes.table.quoteNumber", "Quote #")}
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                  {t("dashboard.quotes.table.title", "Title")}
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                  {t("dashboard.quotes.table.status", "Status")}
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                  {t("dashboard.quotes.table.approval", "Approval")}
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                  {t("dashboard.quotes.table.eSign", "E-sign")}
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                  {t("dashboard.quotes.table.contact", "Contact")}
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                  {t("dashboard.quotes.table.company", "Company")}
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                  {t("dashboard.quotes.table.total", "Total")}
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                  {t("dashboard.quotes.table.date", "Date")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {quotes.map((quote) => {
                const st = statusConfig[quote.status] || statusConfig.draft;
                const approval =
                  cpqStatusConfig[quote.approvalStatus] ||
                  cpqStatusConfig.not_requested;
                const eSign =
                  cpqStatusConfig[quote.eSignStatus] || cpqStatusConfig.not_sent;
                return (
                  <tr
                    key={quote.id}
                    className="transition-colors hover:bg-gray-50"
                  >
                    <td className="px-5 py-3 text-sm text-gray-400">
                      #{quote.quoteNumber}
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/quotes/${quote.id}`}
                        className="text-sm font-medium text-gray-900 transition-colors hover:text-[#0891b2]"
                      >
                        {quote.title}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${st.color}`}
                      >
                        {t(st.key, st.fallback)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${approval.color}`}
                      >
                        {t(approval.key, approval.fallback)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${eSign.color}`}
                      >
                        {t(eSign.key, eSign.fallback)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {quote.contact ? (
                        <Link
                          href={`/contacts/${quote.contact.id}`}
                          className="text-sm text-gray-700 transition-colors hover:text-[#0891b2]"
                        >
                          {quote.contact.name}
                        </Link>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {quote.company ? (
                        <Link
                          href={`/companies/${quote.company.id}`}
                          className="text-sm text-gray-700 transition-colors hover:text-[#0891b2]"
                        >
                          {quote.company.name}
                        </Link>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">
                      ${quote.total.toLocaleString(intlLocale)}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">
                      {new Date(quote.createdAt).toLocaleDateString(intlLocale, {
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
