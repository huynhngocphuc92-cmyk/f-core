"use client";

import { useState, useTransition } from "react";
import { Trash2, RefreshCw, Download, X, AlertTriangle, Loader2 } from "lucide-react";
import {
  bulkDeleteContacts,
  bulkUpdateContacts,
  bulkDeleteCompanies,
  bulkDeleteDeals,
  bulkUpdateDeals,
  bulkDeleteTickets,
  bulkUpdateTickets,
} from "@/app/actions/bulk";

// ============================================
// TYPES
// ============================================

export type BulkModule = "contacts" | "companies" | "deals" | "tickets";

interface BulkActionBarProps {
  selectedIds: string[];
  module: BulkModule;
  onClear: () => void;
  onComplete: () => void;
}

// ============================================
// MODULE CONFIG
// ============================================

const moduleConfig: Record<
  BulkModule,
  {
    deleteFn: (ids: string[]) => Promise<{ success: boolean; count: number; error?: string }>;
    updateFn?: (ids: string[], data: { field: string; value: string }) => Promise<{ success: boolean; count: number; error?: string }>;
    statusField: string;
    statusOptions: { label: string; value: string }[];
    label: string;
  }
> = {
  contacts: {
    deleteFn: bulkDeleteContacts,
    updateFn: bulkUpdateContacts,
    statusField: "lifecycleStage",
    statusOptions: [
      { label: "Subscriber", value: "subscriber" },
      { label: "Lead", value: "lead" },
      { label: "MQL", value: "mql" },
      { label: "SQL", value: "sql" },
      { label: "Opportunity", value: "opportunity" },
      { label: "Customer", value: "customer" },
      { label: "Evangelist", value: "evangelist" },
    ],
    label: "contacts",
  },
  companies: {
    deleteFn: bulkDeleteCompanies,
    statusField: "",
    statusOptions: [],
    label: "companies",
  },
  deals: {
    deleteFn: bulkDeleteDeals,
    updateFn: bulkUpdateDeals,
    statusField: "priority",
    statusOptions: [
      { label: "Low", value: "low" },
      { label: "Medium", value: "medium" },
      { label: "High", value: "high" },
    ],
    label: "deals",
  },
  tickets: {
    deleteFn: bulkDeleteTickets,
    updateFn: bulkUpdateTickets,
    statusField: "status",
    statusOptions: [
      { label: "Open", value: "open" },
      { label: "In Progress", value: "in_progress" },
      { label: "Waiting", value: "waiting" },
      { label: "Resolved", value: "resolved" },
      { label: "Closed", value: "closed" },
    ],
    label: "tickets",
  },
};

// ============================================
// COMPONENT
// ============================================

export default function BulkActionBar({
  selectedIds,
  module,
  onClear,
  onComplete,
}: BulkActionBarProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const config = moduleConfig[module];
  const count = selectedIds.length;

  if (count === 0) return null;

  // ---- Delete ----
  function handleDeleteClick() {
    setShowStatusMenu(false);
    setShowDeleteConfirm(true);
    setError(null);
  }

  function handleDeleteConfirm() {
    startTransition(async () => {
      const result = await config.deleteFn(selectedIds);
      if (result.success) {
        setShowDeleteConfirm(false);
        onComplete();
      } else {
        setError(result.error || "Delete failed");
      }
    });
  }

  // ---- Status / Stage change ----
  function handleStatusClick() {
    setShowDeleteConfirm(false);
    setShowStatusMenu((v) => !v);
    setError(null);
  }

  function handleStatusSelect(value: string) {
    if (!config.updateFn) return;
    startTransition(async () => {
      const result = await config.updateFn!(selectedIds, {
        field: config.statusField,
        value,
      });
      if (result.success) {
        setShowStatusMenu(false);
        onComplete();
      } else {
        setError(result.error || "Update failed");
      }
    });
  }

  // ---- Export Selected ----
  function handleExport() {
    setShowDeleteConfirm(false);
    setShowStatusMenu(false);
    // Export selected IDs as CSV query param
    const params = new URLSearchParams();
    params.set("ids", selectedIds.join(","));
    window.open(`/api/${module}/export?${params.toString()}`, "_blank");
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-6 pointer-events-none">
      <div className="pointer-events-auto bg-gray-900 text-white rounded-xl shadow-2xl border border-gray-700 px-6 py-3 flex items-center gap-4 max-w-2xl animate-in slide-in-from-bottom-4">
        {/* Selected count */}
        <div className="flex items-center gap-2 pr-4 border-r border-gray-700">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#0891b2] text-sm font-bold">
            {count}
          </span>
          <span className="text-sm text-gray-300 whitespace-nowrap">
            {count === 1 ? "item" : "items"} selected
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 relative">
          {/* Delete */}
          <button
            onClick={handleDeleteClick}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-gray-800 hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>

          {/* Change Status / Stage (if module supports it) */}
          {config.statusOptions.length > 0 && (
            <div className="relative">
              <button
                onClick={handleStatusClick}
                disabled={isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4" />
                Change {config.statusField === "lifecycleStage" ? "Stage" : config.statusField === "status" ? "Status" : "Priority"}
              </button>

              {/* Status dropdown */}
              {showStatusMenu && (
                <div className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-10">
                  {config.statusOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleStatusSelect(opt.value)}
                      disabled={isPending}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Export Selected */}
          <button
            onClick={handleExport}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        {/* Loading indicator */}
        {isPending && (
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        )}

        {/* Clear selection */}
        <button
          onClick={onClear}
          disabled={isPending}
          className="ml-auto p-1.5 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
          title="Clear selection"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Delete Confirmation Overlay */}
        {showDeleteConfirm && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-80 z-20">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900">
                  Delete {count} {config.label}?
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  This will soft-delete the selected {config.label}. They can be
                  recovered by an admin.
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleDeleteConfirm}
                    disabled={isPending}
                    className="flex-1 px-3 py-1.5 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {isPending ? "Deleting..." : "Delete"}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isPending}
                    className="flex-1 px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
            {error && (
              <p className="text-xs text-red-600 mt-2">{error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
