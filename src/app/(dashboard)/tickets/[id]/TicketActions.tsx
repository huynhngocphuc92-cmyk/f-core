"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import {
  updateTicketStatus,
  updateTicketPriority,
  deleteTicket,
} from "@/app/actions/tickets";

export function StatusSelector({
  ticketId,
  current,
}: {
  ticketId: string;
  current: string;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <select
      value={current}
      disabled={isPending}
      onChange={(e) => {
        startTransition(async () => {
          await updateTicketStatus(ticketId, e.target.value);
          router.refresh();
        });
      }}
      className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2] disabled:opacity-50"
    >
      <option value="open">Open</option>
      <option value="in_progress">In Progress</option>
      <option value="waiting">Waiting</option>
      <option value="resolved">Resolved</option>
      <option value="closed">Closed</option>
    </select>
  );
}

export function PrioritySelector({
  ticketId,
  current,
}: {
  ticketId: string;
  current: string;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <select
      value={current}
      disabled={isPending}
      onChange={(e) => {
        startTransition(async () => {
          await updateTicketPriority(ticketId, e.target.value);
          router.refresh();
        });
      }}
      className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2] disabled:opacity-50"
    >
      <option value="low">Low</option>
      <option value="medium">Medium</option>
      <option value="high">High</option>
      <option value="urgent">Urgent</option>
    </select>
  );
}

export function DeleteButton({ ticketId }: { ticketId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      disabled={isPending}
      onClick={() => {
        if (!confirm("Delete this ticket?")) return;
        startTransition(async () => {
          await deleteTicket(ticketId);
          router.push("/tickets");
        });
      }}
      className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
    >
      <Trash2 className="w-4 h-4" />
      {isPending ? "Deleting..." : "Delete"}
    </button>
  );
}
