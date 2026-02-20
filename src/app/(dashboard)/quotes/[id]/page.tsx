import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Receipt,
  ShieldCheck,
  Signature,
  Clock,
} from "lucide-react";

import { getQuote } from "@/app/actions/quotes";
import { getServerI18n } from "@/i18n/server";

import { QuoteCpqControls } from "./QuoteCpqControls";

const statusColor: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  pending: "bg-blue-50 text-blue-700",
  sent: "bg-yellow-50 text-yellow-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
  expired: "bg-gray-100 text-gray-600",
};

const approvalColor: Record<string, string> = {
  not_requested: "bg-gray-100 text-gray-600",
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
};

const eSignColor: Record<string, string> = {
  not_sent: "bg-gray-100 text-gray-600",
  sent: "bg-blue-50 text-blue-700",
  viewed: "bg-indigo-50 text-indigo-700",
  signed: "bg-emerald-50 text-emerald-700",
  declined: "bg-red-50 text-red-700",
};

function quoteStatusLabel(t: (key: string, fallback?: string) => string, value: string) {
  const map: Record<string, { key: string; fallback: string }> = {
    draft: { key: "dashboard.quotes.status.draft", fallback: "Draft" },
    pending: { key: "dashboard.quotes.status.pending", fallback: "Pending" },
    sent: { key: "dashboard.quotes.status.sent", fallback: "Sent" },
    approved: { key: "dashboard.quotes.status.approved", fallback: "Approved" },
    rejected: { key: "dashboard.quotes.status.rejected", fallback: "Rejected" },
    expired: { key: "dashboard.quotes.status.expired", fallback: "Expired" },
  };
  const item = map[value];
  if (!item) return value;
  return t(item.key, item.fallback);
}

function cpqStatusLabel(t: (key: string, fallback?: string) => string, value: string) {
  const map: Record<string, { key: string; fallback: string }> = {
    not_requested: {
      key: "dashboard.quotes.cpqStatus.notRequested",
      fallback: "Not Requested",
    },
    pending: { key: "dashboard.quotes.cpqStatus.pending", fallback: "Pending" },
    approved: {
      key: "dashboard.quotes.cpqStatus.approved",
      fallback: "Approved",
    },
    rejected: {
      key: "dashboard.quotes.cpqStatus.rejected",
      fallback: "Rejected",
    },
    not_sent: { key: "dashboard.quotes.cpqStatus.notSent", fallback: "Not Sent" },
    sent: { key: "dashboard.quotes.cpqStatus.sent", fallback: "Sent" },
    viewed: { key: "dashboard.quotes.cpqStatus.viewed", fallback: "Viewed" },
    signed: { key: "dashboard.quotes.cpqStatus.signed", fallback: "Signed" },
    declined: {
      key: "dashboard.quotes.cpqStatus.declined",
      fallback: "Declined",
    },
  };
  const item = map[value];
  if (!item) return value;
  return t(item.key, item.fallback);
}

function formatDateTime(value: string | null, intlLocale: string) {
  if (!value) return "-";
  return new Date(value).toLocaleString(intlLocale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const dynamic = "force-dynamic";

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { t, intlLocale } = await getServerI18n();
  const { id } = await params;
  const quote = await getQuote(id);

  if (!quote) {
    notFound();
  }

  const quoteStatus = quoteStatusLabel(t, quote.status);
  const approvalStatus = cpqStatusLabel(t, quote.approvalStatus);
  const eSignStatus = cpqStatusLabel(t, quote.eSignStatus);

  return (
    <div className="p-6 pt-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <Link
            href="/quotes"
            className="mb-2 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("dashboard.quotes.detail.back", "Back to quotes")}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            #{quote.quoteNumber} {quote.title}
          </h1>
          <p className="mt-1 text-gray-600">
            {t(
              "dashboard.quotes.detail.subtitle",
              "Enterprise CPQ details: approvals, e-sign, and buyer timeline."
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium ${statusColor[quote.status] || statusColor.draft}`}
          >
            {t("dashboard.quotes.detail.badge.status", "status: {value}", {
              value: quoteStatus,
            })}
          </span>
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium ${
              approvalColor[quote.approvalStatus] || approvalColor.not_requested
            }`}
          >
            {t("dashboard.quotes.detail.badge.approval", "approval: {value}", {
              value: approvalStatus,
            })}
          </span>
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium ${
              eSignColor[quote.eSignStatus] || eSignColor.not_sent
            }`}
          >
            {t("dashboard.quotes.detail.badge.eSign", "e-sign: {value}", {
              value: eSignStatus,
            })}
          </span>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-gray-500">
            <Receipt className="h-4 w-4" />
            <p className="text-xs uppercase tracking-wide">
              {t("dashboard.quotes.detail.cards.total", "Total")}
            </p>
          </div>
          <p className="text-xl font-bold text-gray-900">
            ${quote.total.toLocaleString(intlLocale)}
          </p>
          <p className="text-xs text-gray-500">{quote.currency}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-gray-500">
            <ShieldCheck className="h-4 w-4" />
            <p className="text-xs uppercase tracking-wide">
              {t("dashboard.quotes.detail.cards.approval", "Approval")}
            </p>
          </div>
          <p className="text-sm font-semibold text-gray-900">{approvalStatus}</p>
          <p className="text-xs text-gray-500">
            {t("dashboard.quotes.detail.cards.requested", "Requested: {value}", {
              value: formatDateTime(quote.approvalRequestedAt, intlLocale),
            })}
          </p>
          <p className="text-xs text-gray-500">
            {t("dashboard.quotes.detail.cards.decided", "Decided: {value}", {
              value: formatDateTime(quote.approvalDecidedAt, intlLocale),
            })}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-gray-500">
            <Signature className="h-4 w-4" />
            <p className="text-xs uppercase tracking-wide">
              {t("dashboard.quotes.detail.cards.eSign", "E-sign")}
            </p>
          </div>
          <p className="text-sm font-semibold text-gray-900">{eSignStatus}</p>
          <p className="text-xs text-gray-500">
            {t("dashboard.quotes.detail.cards.sent", "Sent: {value}", {
              value: formatDateTime(quote.eSignSentAt, intlLocale),
            })}
          </p>
          <p className="text-xs text-gray-500">
            {t(
              "dashboard.quotes.detail.cards.completed",
              "Completed: {value}",
              {
                value: formatDateTime(quote.eSignCompletedAt, intlLocale),
              }
            )}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-gray-500">
            <Clock className="h-4 w-4" />
            <p className="text-xs uppercase tracking-wide">
              {t("dashboard.quotes.detail.cards.buyerActivity", "Buyer Activity")}
            </p>
          </div>
          <p className="text-sm font-semibold text-gray-900">
            {t("dashboard.quotes.detail.cards.events", "{count} events", {
              count: quote.buyerActivities.length,
            })}
          </p>
          <p className="text-xs text-gray-500">
            {t("dashboard.quotes.detail.cards.last", "Last: {value}", {
              value: formatDateTime(quote.buyerLastActivityAt, intlLocale),
            })}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <QuoteCpqControls quoteId={quote.id} />
      </div>

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-gray-900">
          {t("dashboard.quotes.detail.lineItems.title", "Line Items")}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-2 py-2">
                  {t("dashboard.quotes.detail.lineItems.item", "Item")}
                </th>
                <th className="px-2 py-2">
                  {t("dashboard.quotes.detail.lineItems.qty", "Qty")}
                </th>
                <th className="px-2 py-2">
                  {t(
                    "dashboard.quotes.detail.lineItems.unitPrice",
                    "Unit Price"
                  )}
                </th>
                <th className="px-2 py-2">
                  {t("dashboard.quotes.detail.lineItems.discount", "Discount")}
                </th>
                <th className="px-2 py-2">
                  {t("dashboard.quotes.detail.lineItems.total", "Total")}
                </th>
              </tr>
            </thead>
            <tbody>
              {quote.lineItems.map((item) => (
                <tr key={item.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-2 py-2">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    {item.description ? (
                      <p className="text-xs text-gray-500">{item.description}</p>
                    ) : null}
                  </td>
                  <td className="px-2 py-2 text-gray-700">{item.quantity}</td>
                  <td className="px-2 py-2 text-gray-700">
                    ${item.unitPrice.toLocaleString(intlLocale)}
                  </td>
                  <td className="px-2 py-2 text-gray-700">{item.discount}%</td>
                  <td className="px-2 py-2 font-medium text-gray-900">
                    ${item.total.toLocaleString(intlLocale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-sm font-semibold text-gray-900">
            {t(
              "dashboard.quotes.detail.approvalHistory.title",
              "Approval History"
            )}
          </p>
          {quote.approvalRequests.length === 0 ? (
            <p className="text-sm text-gray-500">
              {t(
                "dashboard.quotes.detail.approvalHistory.empty",
                "No approval requests yet."
              )}
            </p>
          ) : (
            <div className="space-y-2">
              {quote.approvalRequests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-lg border border-gray-100 p-3 text-sm"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="font-medium text-gray-900">
                      {cpqStatusLabel(t, request.status)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDateTime(request.requestedAt, intlLocale)}
                    </p>
                  </div>
                  {request.note ? (
                    <p className="text-xs text-gray-600">{request.note}</p>
                  ) : null}
                  {request.decisionAt ? (
                    <p className="mt-1 text-xs text-gray-500">
                      {t(
                        "dashboard.quotes.detail.approvalHistory.decisionAt",
                        "Decision at {value}",
                        {
                          value: formatDateTime(request.decisionAt, intlLocale),
                        }
                      )}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-sm font-semibold text-gray-900">
            {t(
              "dashboard.quotes.detail.buyerTimeline.title",
              "Buyer Activity Timeline"
            )}
          </p>
          {quote.buyerActivities.length === 0 ? (
            <p className="text-sm text-gray-500">
              {t(
                "dashboard.quotes.detail.buyerTimeline.empty",
                "No buyer activity yet."
              )}
            </p>
          ) : (
            <div className="space-y-2">
              {quote.buyerActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="rounded-lg border border-gray-100 p-3 text-sm"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="font-medium text-gray-900">
                      {cpqStatusLabel(t, activity.type)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDateTime(activity.occurredAt, intlLocale)}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">
                    {t(
                      "dashboard.quotes.detail.buyerTimeline.actor",
                      "Actor: {name} ({type})",
                      {
                        name:
                          activity.actorName ||
                          t(
                            "dashboard.quotes.detail.buyerTimeline.unknownActor",
                            "Unknown"
                          ),
                        type: activity.actorType,
                      }
                    )}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
