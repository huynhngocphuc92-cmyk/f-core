"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import {
  updateTicketStatus,
  updateTicketPriority,
  deleteTicket,
} from "@/app/actions/tickets";
import { useI18n } from "@/i18n/I18nProvider";

export function StatusSelector({
  ticketId,
  current,
}: {
  ticketId: string;
  current: string;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { t } = useI18n();

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
      className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-[#0891b2] focus:outline-none disabled:opacity-50"
    >
      <option value="open">{t("dashboard.tickets.status.open", "Open")}</option>
      <option value="in_progress">
        {t("dashboard.tickets.status.inProgress", "In Progress")}
      </option>
      <option value="waiting">
        {t("dashboard.tickets.status.waiting", "Waiting")}
      </option>
      <option value="resolved">
        {t("dashboard.tickets.status.resolved", "Resolved")}
      </option>
      <option value="closed">
        {t("dashboard.tickets.status.closed", "Closed")}
      </option>
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
  const { t } = useI18n();

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
      className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-[#0891b2] focus:outline-none disabled:opacity-50"
    >
      <option value="low">{t("dashboard.tickets.priority.low", "Low")}</option>
      <option value="medium">
        {t("dashboard.tickets.priority.medium", "Medium")}
      </option>
      <option value="high">{t("dashboard.tickets.priority.high", "High")}</option>
      <option value="urgent">
        {t("dashboard.tickets.priority.urgent", "Urgent")}
      </option>
    </select>
  );
}

export function DeleteButton({ ticketId }: { ticketId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { t } = useI18n();

  return (
    <button
      disabled={isPending}
      onClick={() => {
        if (
          !confirm(
            t("dashboard.tickets.actions.deleteConfirm", "Delete this ticket?")
          )
        ) {
          return;
        }
        startTransition(async () => {
          await deleteTicket(ticketId);
          router.push("/tickets");
        });
      }}
      className="flex items-center gap-2 rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" />
      {isPending
        ? t("dashboard.tickets.actions.deleting", "Deleting...")
        : t("dashboard.tickets.actions.delete", "Delete")}
    </button>
  );
}
