"use client";

import { useState, useMemo } from "react";
import {
  CircleDollarSign,
  Plus,
  LayoutGrid,
  List,
  Calendar,
  User,
} from "lucide-react";

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

function formatCurrency(amount: number | null, currency = "USD"): string {
  if (amount === null || amount === undefined) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getPriorityStyles(priority: string | null): {
  bg: string;
  text: string;
  label: string;
} {
  switch (priority) {
    case "high":
      return { bg: "bg-red-50", text: "text-red-700", label: "High" };
    case "medium":
      return { bg: "bg-amber-50", text: "text-amber-700", label: "Medium" };
    case "low":
      return { bg: "bg-green-50", text: "text-green-700", label: "Low" };
    default:
      return { bg: "bg-gray-50", text: "text-gray-600", label: "None" };
  }
}

function DealCard({ deal }: { deal: Deal }) {
  const priority = getPriorityStyles(deal.priority);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer">
      <h4 className="text-sm font-semibold text-gray-900 truncate mb-2">
        {deal.name}
      </h4>

      <div className="flex items-center gap-1.5 mb-3">
        <CircleDollarSign className="w-4 h-4 text-[#0891b2]" />
        <span className="text-sm font-medium text-gray-900">
          {formatCurrency(deal.amount, deal.currency)}
        </span>
      </div>

      {deal.owner && (
        <div className="flex items-center gap-1.5 mb-2">
          <User className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-600 truncate">
            {deal.owner.name}
          </span>
        </div>
      )}

      {deal.closeDate && (
        <div className="flex items-center gap-1.5 mb-3">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-600">
            {formatDate(deal.closeDate)}
          </span>
        </div>
      )}

      {deal.priority && (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${priority.bg} ${priority.text}`}
        >
          {priority.label}
        </span>
      )}
    </div>
  );
}

function StageColumn({ column }: { column: KanbanColumn }) {
  return (
    <div className="flex flex-col min-w-[280px] max-w-[320px] w-[300px] flex-shrink-0">
      <div
        className="rounded-t-lg px-4 py-3 bg-white border border-gray-200"
        style={{ borderTopWidth: "3px", borderTopColor: column.stageColor }}
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-gray-900 truncate">
            {column.stageName}
          </h3>
          <span className="flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
            {column.deals.length}
          </span>
        </div>
        <p className="text-xs text-gray-500 font-medium">
          {formatCurrency(column.totalAmount)}
        </p>
      </div>

      <div className="flex-1 space-y-2 p-2 bg-gray-50 border-x border-b border-gray-200 rounded-b-lg overflow-y-auto max-h-[calc(100vh-260px)]">
        {column.deals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CircleDollarSign className="w-8 h-8 text-gray-300 mb-2" />
            <p className="text-xs text-gray-400">No deals in this stage</p>
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

      const col = stageMap.get(key)!;
      col.deals.push(deal);
      col.totalAmount += deal.amount ?? 0;
    }

    return Array.from(stageMap.values()).sort(
      (a, b) => a.probability - b.probability
    );
  }, [deals]);

  const totalPipelineValue = useMemo(
    () => deals.reduce((sum, d) => sum + (d.amount ?? 0), 0),
    [deals]
  );

  return (
    <div className="p-6 pt-8 h-full flex flex-col">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deals</h1>
          <p className="text-gray-600 mt-1">
            {deals.length} deals &middot; {formatCurrency(totalPipelineValue)}{" "}
            total pipeline value
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("board")}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                viewMode === "board"
                  ? "bg-[#0891b2] text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
              title="Board view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                viewMode === "list"
                  ? "bg-[#0891b2] text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-[#0ea5e9] transition-colors text-sm font-medium">
            <Plus className="w-4 h-4" />
            Create deal
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      {viewMode === "board" && (
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-4 h-full min-w-max">
            {columns.length === 0 ? (
              <div className="flex-1 flex items-center justify-center w-full min-w-[600px]">
                <div className="text-center">
                  <CircleDollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No deals yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Create your first deal to get started
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

      {/* List View */}
      {viewMode === "list" && (
        <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deal Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stage
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Close Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {deals.map((deal) => {
                const priority = getPriorityStyles(deal.priority);
                return (
                  <tr
                    key={deal.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-900">
                        {deal.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatCurrency(deal.amount, deal.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${deal.stage?.color}15`,
                          color: deal.stage?.color,
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: deal.stage?.color }}
                        />
                        {deal.stage?.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {deal.owner?.name || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {deal.closeDate ? formatDate(deal.closeDate) : "-"}
                    </td>
                    <td className="px-4 py-3">
                      {deal.priority ? (
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${priority.bg} ${priority.text}`}
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
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-gray-500"
                  >
                    No deals found
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
