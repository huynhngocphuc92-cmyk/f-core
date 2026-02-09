"use client";

import Link from "next/link";
import { formatTicketNumber } from "@/lib/format-ticket-number";

interface Stage {
  id: string;
  name: string;
  type: string;
  color: string | null;
}

interface TicketForBoard {
  id: string;
  ticketNumber: number;
  title: string;
  priority: string;
  status: string;
  stageId: string;
  createdAt: Date;
  assignedTo: { id: string; name: string | null; avatarUrl: string | null } | null;
  contact: { id: string; firstName: string | null; lastName: string | null } | null;
  _count: { comments: number };
}

const priorityDot: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-blue-500",
  low: "bg-gray-400",
};

export function TicketKanbanBoard({
  tickets,
  stages,
}: {
  tickets: TicketForBoard[];
  stages: Stage[];
}) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {stages.map((stage) => {
        const stageTickets = tickets.filter((t) => t.stageId === stage.id);
        return (
          <div
            key={stage.id}
            className="flex-shrink-0 w-72 bg-gray-100 rounded-xl"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: stage.color || "#6B7280" }}
                />
                <span className="text-sm font-semibold text-gray-700">
                  {stage.name}
                </span>
              </div>
              <span className="text-xs font-medium text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
                {stageTickets.length}
              </span>
            </div>

            {/* Cards */}
            <div className="px-3 pb-3 space-y-2 min-h-[200px]">
              {stageTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/tickets/${ticket.id}`}
                  className="block bg-white rounded-lg border border-gray-200 p-3 hover:border-[#0891b2] hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-[11px] text-gray-400 font-mono">
                      {formatTicketNumber(ticket.ticketNumber)}
                    </span>
                    <div
                      className={`w-2 h-2 rounded-full ${priorityDot[ticket.priority] || priorityDot.medium}`}
                      title={ticket.priority}
                    />
                  </div>
                  <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">
                    {ticket.title}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {ticket.contact
                        ? `${ticket.contact.firstName || ""} ${ticket.contact.lastName || ""}`.trim()
                        : "No contact"}
                    </span>
                    {ticket.assignedTo && (
                      <div
                        className="w-6 h-6 rounded-full bg-[#0891b2] flex items-center justify-center text-white text-[10px] font-medium"
                        title={ticket.assignedTo.name || ""}
                      >
                        {ticket.assignedTo.name?.charAt(0) || "?"}
                      </div>
                    )}
                  </div>
                  {ticket._count.comments > 0 && (
                    <div className="mt-2 text-xs text-gray-400">
                      {ticket._count.comments} comment{ticket._count.comments > 1 ? "s" : ""}
                    </div>
                  )}
                </Link>
              ))}

              {stageTickets.length === 0 && (
                <div className="text-center py-8 text-xs text-gray-400">
                  No tickets
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
