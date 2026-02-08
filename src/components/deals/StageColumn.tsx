"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import DealCard from "./DealCard";

interface StageData {
  id: string;
  name: string;
  orderIndex: number;
  probability: number;
  color: string | null;
  isClosed: boolean;
  isWon: boolean;
  deals: Array<{
    id: string;
    name: string;
    amount: string | number | null;
    currency: string;
    closeDate: string | null;
    priority: string | null;
    owner: { id: string; name: string | null; email: string } | null;
    companies: Array<{
      company: { id: string; name: string; domain: string | null };
      isPrimary: boolean;
    }>;
    contacts: Array<{
      contact: { id: string; firstName: string | null; lastName: string | null; email: string | null };
    }>;
    stage: { id: string; name: string; isClosed: boolean; isWon: boolean };
  }>;
  totalAmount: number;
  count: number;
}

interface StageColumnProps {
  stage: StageData;
  onDealClick?: (deal: StageData["deals"][number]) => void;
  onAddDeal?: (stageId: string) => void;
}

function formatCurrency(amount: number): string {
  if (amount === 0) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function StageColumn({ stage, onDealClick, onAddDeal }: StageColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const dealIds = stage.deals.map((d) => d.id);

  const borderColor = stage.isClosed
    ? stage.isWon
      ? "border-t-green-500"
      : "border-t-red-400"
    : "";

  return (
    <div className="w-[280px] min-w-[280px] flex flex-col max-h-full">
      {/* Column Header */}
      <div
        className={`px-3 py-2.5 bg-gray-50 border-b border-gray-200 rounded-t-lg ${
          stage.isClosed ? `border-t-2 ${borderColor}` : ""
        }`}
        style={!stage.isClosed && stage.color ? { borderTop: `2px solid ${stage.color}` } : undefined}
      >
        <div className="flex items-center justify-between mb-0.5">
          <div className="flex items-center gap-2">
            {stage.color && !stage.isClosed && (
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: stage.color }}
              />
            )}
            {stage.isClosed && (
              <span
                className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  stage.isWon ? "bg-green-500" : "bg-red-400"
                }`}
              />
            )}
            <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide truncate">
              {stage.name}
            </span>
            <span className="text-xs font-medium text-gray-400">({stage.count})</span>
          </div>
          <span className="text-xs font-semibold text-gray-600">
            {formatCurrency(stage.totalAmount)}
          </span>
        </div>
        <div className="text-xs text-gray-400">{stage.probability}% probability</div>
      </div>

      {/* Column Body */}
      <div
        ref={setNodeRef}
        className={`
          flex-1 overflow-y-auto p-2 space-y-2 min-h-[200px]
          transition-colors duration-150
          ${isOver ? "bg-cyan-50/40 border-2 border-dashed border-cyan-300 rounded-b-lg" : "bg-gray-50/50"}
        `}
      >
        <SortableContext items={dealIds} strategy={verticalListSortingStrategy}>
          {stage.deals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-8 h-8 text-gray-300 mb-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>
              <p className="text-sm text-gray-400">No deals in this stage</p>
              <p className="text-xs text-gray-300 mt-1">Drag a deal here or add one below</p>
            </div>
          ) : (
            stage.deals.map((deal) => (
              <DealCard key={deal.id} deal={deal} onClick={onDealClick} />
            ))
          )}
        </SortableContext>
      </div>

      {/* Column Footer */}
      <div className="p-2 border-t border-gray-100 bg-gray-50/50 rounded-b-lg">
        <button
          onClick={() => onAddDeal?.(stage.id)}
          className="flex items-center gap-1.5 w-full text-sm text-gray-400 hover:text-cyan-600 font-medium py-1 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add deal
        </button>
      </div>
    </div>
  );
}
