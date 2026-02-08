"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Building2, Calendar, User } from "lucide-react";

interface DealCardDeal {
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
  stage: {
    id: string;
    name: string;
    isClosed: boolean;
    isWon: boolean;
  };
}

interface DealCardProps {
  deal: DealCardDeal;
  onClick?: (deal: DealCardDeal) => void;
  isDragOverlay?: boolean;
}

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-amber-400",
  low: "bg-blue-400",
};

function formatCurrency(amount: string | number | null, currency: string): string {
  if (!amount) return "";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isOverdue(dateStr: string | null, stage: DealCardDeal["stage"]): boolean {
  if (!dateStr || stage.isClosed) return false;
  return new Date(dateStr) < new Date();
}

export default function DealCard({ deal, onClick, isDragOverlay }: DealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const primaryCompany = deal.companies.find((c) => c.isPrimary)?.company ?? deal.companies[0]?.company;
  const overdue = isOverdue(deal.closeDate, deal.stage);

  return (
    <div
      ref={isDragOverlay ? undefined : setNodeRef}
      style={isDragOverlay ? undefined : style}
      {...(isDragOverlay ? {} : attributes)}
      {...(isDragOverlay ? {} : listeners)}
      onClick={() => onClick?.(deal)}
      className={`
        w-full p-3 rounded-lg border bg-white cursor-grab active:cursor-grabbing
        transition-all duration-150
        ${isDragging ? "opacity-50 shadow-xl rotate-[2deg] scale-[1.02]" : "shadow-sm hover:shadow-md hover:border-gray-300"}
        ${overdue ? "border-l-4 border-l-red-400" : "border-gray-200"}
        ${isDragOverlay ? "shadow-xl rotate-[2deg] scale-[1.02]" : ""}
      `}
    >
      {/* Row 1: Priority dot + Deal name */}
      <div className="flex items-start gap-2 mb-1">
        {deal.priority && (
          <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${PRIORITY_COLORS[deal.priority] || "bg-gray-300"}`} />
        )}
        <span className="text-sm font-semibold text-gray-900 truncate flex-1">
          {deal.name}
        </span>
      </div>

      {/* Row 2: Company */}
      {primaryCompany && (
        <div className="flex items-center gap-1.5 mb-2">
          <Building2 className="w-3 h-3 text-gray-400 flex-shrink-0" />
          <span className="text-xs text-gray-500 truncate">{primaryCompany.name}</span>
        </div>
      )}

      {/* Row 3: Amount + Close date */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-900">
          {formatCurrency(deal.amount, deal.currency)}
        </span>
        {deal.closeDate && (
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-gray-400" />
            <span className={`text-xs ${overdue ? "text-red-600 font-medium" : "text-gray-500"}`}>
              {formatDate(deal.closeDate)}
            </span>
          </div>
        )}
      </div>

      {/* Row 4: Owner + Overdue badge */}
      <div className="flex items-center justify-between">
        {deal.owner && (
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="w-3 h-3 text-gray-500" />
            </div>
            <span className="text-xs text-gray-500 truncate max-w-[120px]">
              {deal.owner.name || deal.owner.email}
            </span>
          </div>
        )}
        {overdue && (
          <span className="text-xs font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
            Overdue
          </span>
        )}
      </div>
    </div>
  );
}
