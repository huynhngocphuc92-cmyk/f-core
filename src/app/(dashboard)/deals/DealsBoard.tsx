"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CircleDollarSign,
  Plus,
  LayoutGrid,
  List,
  Calendar,
  User,
} from "lucide-react";

import { toIntlLocale } from "@/i18n/config";
import { useI18n } from "@/i18n/I18nProvider";

interface DealStage {
  id: string;
  name: string;
  color: string;
  probability: number;
}

interface DealPipeline {
  id: string;
  name: string;
}

interface DealOwner {
  id: string;
  name: string;
  email: string;
}

interface Deal {
  id: string;
  name: string;
  amount: number | null;
  currency: string;
  closeDate: string | null;
  priority: string | null;
  stage: DealStage;
  pipeline: DealPipeline;
  owner: DealOwner | null;
}

interface KanbanColumn {
  stageId: string;
  stageName: string;
  stageColor: string;
  probability: number;
  deals: Deal[];
  totalAmount: number;
}

function formatCurrency(
  amount: number | null,
  intlLocale: string,
  currency = "USD"
): string {
  if (amount === null || amount === undefined) return "$0";
  return new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string | null, intlLocale: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString(intlLocale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getPriorityStyles(
  priority: string | null,
  t: (key: string, fallback?: string) => string
): {
  bg: string;
  text: string;
  label: string;
} {
  switch (priority) {
    case "high":
      return {
        bg: "bg-red-50",
        text: "text-red-700",
        label: t("dashboard.deals.priority.high", "High"),
      };
    case "medium":
      return {
        bg: "bg-amber-50",
        text: "text-amber-700",
        label: t("dashboard.deals.priority.medium", "Medium"),
      };
    case "low":
      return {
        bg: "bg-green-50",
        text: "text-green-700",
        label: t("dashboard.deals.priority.low", "Low"),
      };
    default:
      return {
        bg: "bg-gray-50",
        text: "text-gray-600",
        label: t("dashboard.deals.priority.none", "None"),
      };
  }
}

function DealCard({ deal }: { deal: Deal }) {
  const { locale, t } = useI18n();
  const intlLocale = toIntlLocale(locale);
  const priority = getPriorityStyles(deal.priority, t);

  return (
    <Link
      href={`/deals/${deal.id}`}
      className="block cursor-pointer rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md"
    >
      <h4 className="mb-2 truncate text-sm font-semibold text-gray-900">
        {deal.name}
      </h4>

      <div className="mb-3 flex items-center gap-1.5">
        <CircleDollarSign className="h-4 w-4 text-[#0891b2]" />
        <span className="text-sm font-medium text-gray-900">
          {formatCurrency(deal.amount, intlLocale, deal.currency)}
        </span>
      </div>

      {deal.owner && (
        <div className="mb-2 flex items-center gap-1.5">
          <User className="h-3.5 w-3.5 text-gray-400" />
          <span className="truncate text-xs text-gray-600">{deal.owner.name}</span>
        </div>
      )}

      {deal.closeDate && (
        <div className="mb-3 flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-xs text-gray-600">
            {formatDate(deal.closeDate, intlLocale)}
          </span>
        </div>
      )}

      {deal.priority && (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${priority.bg} ${priority.text}`}
        >
          {priority.label}
        </span>
      )}
    </Link>
  );
}

function StageColumn({ column }: { column: KanbanColumn }) {
  const { locale, t } = useI18n();
  const intlLocale = toIntlLocale(locale);

  return (
    <div className="flex w-[300px] min-w-[280px] max-w-[320px] flex-shrink-0 flex-col">
      <div
        className="rounded-t-lg border border-gray-200 bg-white px-4 py-3"
        style={{ borderTopWidth: "3px", borderTopColor: column.stageColor }}
      >
        <div className="mb-1 flex items-center justify-between">
          <h3 className="truncate text-sm font-semibold text-gray-900">
            {column.stageName}
          </h3>
          <span className="flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-gray-100 px-1.5 text-xs font-semibold text-gray-600">
            {column.deals.length}
          </span>
        </div>
        <p className="text-xs font-medium text-gray-500">
          {formatCurrency(column.totalAmount, intlLocale)}
        </p>
      </div>

      <div className="max-h-[calc(100vh-260px)] flex-1 space-y-2 overflow-y-auto rounded-b-lg border-x border-b border-gray-200 bg-gray-50 p-2">
        {column.deals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CircleDollarSign className="mb-2 h-8 w-8 text-gray-300" />
            <p className="text-xs text-gray-400">
              {t("dashboard.deals.emptyStage", "No deals in this stage")}
            </p>
          </div>
        ) : (
          column.deals.map((deal) => <DealCard key={deal.id} deal={deal} />)
        )}
      </div>
    </div>
  );
}

export default function DealsBoard({ deals }: { deals: Deal[] }) {
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const { locale, t } = useI18n();
  const intlLocale = toIntlLocale(locale);

  const columns: KanbanColumn[] = useMemo(() => {
    const stageMap = new Map<string, KanbanColumn>();

    for (const deal of deals) {
      if (!deal.stage) continue;

      const key = deal.stage.name;
      if (!stageMap.has(key)) {
        stageMap.set(key, {
          stageId: deal.stage.id,
          stageName: deal.stage.name,
          stageColor: deal.stage.color || "#6b7280",
          probability: deal.stage.probability ?? 0,
          deals: [],
          totalAmount: 0,
        });
      }

      const col = stageMap.get(key);
      if (!col) continue;

      col.deals.push(deal);
      col.totalAmount += deal.amount ?? 0;
    }

    return Array.from(stageMap.values()).sort(
      (a, b) => a.probability - b.probability
    );
  }, [deals]);

  const totalPipelineValue = useMemo(
    () => deals.reduce((sum, deal) => sum + (deal.amount ?? 0), 0),
    [deals]
  );

  return (
    <div className="flex h-full flex-col p-6 pt-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("dashboard.deals.title", "Deals")}
          </h1>
          <p className="mt-1 text-gray-600">
            {t(
              "dashboard.deals.summary",
              "{count} deals · {value} total pipeline value",
              {
                count: deals.length,
                value: formatCurrency(totalPipelineValue, intlLocale),
              }
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center overflow-hidden rounded-lg border border-gray-200 bg-white">
            <button
              onClick={() => setViewMode("board")}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                viewMode === "board"
                  ? "bg-[#0891b2] text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
              title={t("dashboard.deals.view.board", "Board view")}
              aria-label={t("dashboard.deals.view.board", "Board view")}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                viewMode === "list"
                  ? "bg-[#0891b2] text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
              title={t("dashboard.deals.view.list", "List view")}
              aria-label={t("dashboard.deals.view.list", "List view")}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <Link
            href="/deals/new"
            className="flex items-center gap-2 rounded-lg bg-[#0891b2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0ea5e9]"
          >
            <Plus className="h-4 w-4" />
            {t("dashboard.deals.createDeal", "Create deal")}
          </Link>
        </div>
      </div>

      {viewMode === "board" && (
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex h-full min-w-max gap-4">
            {columns.length === 0 ? (
              <div className="flex w-full min-w-[600px] flex-1 items-center justify-center">
                <div className="text-center">
                  <CircleDollarSign className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                  <p className="font-medium text-gray-500">
                    {t("dashboard.deals.noDealsYet", "No deals yet")}
                  </p>
                  <p className="mt-1 text-sm text-gray-400">
                    {t(
                      "dashboard.deals.createFirst",
                      "Create your first deal to get started"
                    )}
                  </p>
                </div>
              </div>
            ) : (
              columns.map((column) => (
                <StageColumn key={column.stageId} column={column} />
              ))
            )}
          </div>
        </div>
      )}

      {viewMode === "list" && (
        <div className="flex-1 overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t("dashboard.deals.table.dealName", "Deal Name")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t("dashboard.deals.table.amount", "Amount")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t("dashboard.deals.table.stage", "Stage")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t("dashboard.deals.table.owner", "Owner")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t("dashboard.deals.table.closeDate", "Close Date")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t("dashboard.deals.table.priority", "Priority")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {deals.map((deal) => {
                const priority = getPriorityStyles(deal.priority, t);
                return (
                  <tr
                    key={deal.id}
                    className="cursor-pointer transition-colors hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/deals/${deal.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-[#0891b2]"
                      >
                        {deal.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatCurrency(deal.amount, intlLocale, deal.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium"
                        style={{
                          backgroundColor: `${deal.stage?.color}15`,
                          color: deal.stage?.color,
                        }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: deal.stage?.color }}
                        />
                        {deal.stage?.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {deal.owner?.name || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {deal.closeDate ? formatDate(deal.closeDate, intlLocale) : "-"}
                    </td>
                    <td className="px-4 py-3">
                      {deal.priority ? (
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${priority.bg} ${priority.text}`}
                        >
                          {priority.label}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {deals.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    {t("dashboard.deals.emptyList", "No deals found")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
