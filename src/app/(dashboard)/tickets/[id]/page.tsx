import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Building2,
  Clock,
  Globe,
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

import { getTicket } from "@/app/actions/tickets";
import { getServerI18n } from "@/i18n/server";

import { StatusSelector, PrioritySelector, DeleteButton } from "./TicketActions";

export const dynamic = "force-dynamic";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { t, intlLocale } = await getServerI18n();
  const { id } = await params;
  const ticket = await getTicket(id);

  if (!ticket) notFound();

  return (
    <div className="p-6 pt-8">
      <Link
        href="/tickets"
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-[#0891b2]"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("dashboard.tickets.detail.back", "Back to Tickets")}
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="mb-1 flex items-center gap-2 text-sm text-gray-500">
                  <span>
                    {t(
                      "dashboard.tickets.detail.ticketNumber",
                      "Ticket #{number}",
                      {
                        number: ticket.ticketNumber,
                      }
                    )}
                  </span>
                  {ticket.category && (
                    <>
                      <span className="text-gray-300">|</span>
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        {ticket.category}
                      </span>
                    </>
                  )}
                </div>
                <h1 className="text-xl font-bold text-gray-900">
                  {ticket.subject}
                </h1>
              </div>
              <DeleteButton ticketId={ticket.id} />
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-900">
              {t("dashboard.tickets.detail.description", "Description")}
            </h3>
            {ticket.description ? (
              <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-700">
                {ticket.description}
              </div>
            ) : (
              <p className="text-sm italic text-gray-400">
                {t(
                  "dashboard.tickets.detail.noDescription",
                  "No description provided"
                )}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-900">
              {t("dashboard.tickets.detail.details", "Details")}
            </h3>
            <div className="space-y-4">
              <div>
                <p className="mb-1 text-xs text-gray-500">
                  {t("dashboard.tickets.detail.status", "Status")}
                </p>
                <StatusSelector ticketId={ticket.id} current={ticket.status} />
              </div>
              <div>
                <p className="mb-1 text-xs text-gray-500">
                  {t("dashboard.tickets.detail.priority", "Priority")}
                </p>
                <PrioritySelector
                  ticketId={ticket.id}
                  current={ticket.priority}
                />
              </div>
              {ticket.source && (
                <div>
                  <p className="mb-1 text-xs text-gray-500">
                    {t("dashboard.tickets.detail.source", "Source")}
                  </p>
                  <p className="flex items-center gap-1.5 text-sm text-gray-700">
                    <Globe className="h-3.5 w-3.5 text-gray-400" />
                    {ticket.source}
                  </p>
                </div>
              )}
              {ticket.sla && (
                <div>
                  <p className="mb-1 text-xs text-gray-500">
                    {t("dashboard.tickets.detail.sla", "SLA")}
                  </p>
                  <p
                    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${
                      ticket.sla.breached
                        ? "bg-red-50 text-red-700"
                        : ticket.sla.atRisk
                          ? "bg-amber-50 text-amber-700"
                          : "bg-green-50 text-green-700"
                    }`}
                  >
                    <AlertTriangle className="h-3 w-3" />
                    {ticket.sla.breached
                      ? t("dashboard.tickets.sla.breached", "Breached")
                      : ticket.sla.atRisk
                        ? t("dashboard.tickets.sla.atRisk", "At risk")
                        : t("dashboard.tickets.sla.onTrack", "On track")}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {t("dashboard.common.dueLabel", "Due {date}", {
                      date: new Date(ticket.sla.resolution.dueAt).toLocaleString(
                        intlLocale
                      ),
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-900">
              {t("dashboard.tickets.detail.people", "People")}
            </h3>
            <div className="space-y-3">
              <div>
                <p className="mb-1 text-xs text-gray-500">
                  {t("dashboard.tickets.detail.assignee", "Assignee")}
                </p>
                {ticket.assignee ? (
                  <p className="flex items-center gap-1.5 text-sm text-gray-700">
                    <User className="h-3.5 w-3.5 text-gray-400" />
                    {ticket.assignee.name || ticket.assignee.email}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400">
                    {t("dashboard.common.unassigned", "Unassigned")}
                  </p>
                )}
              </div>
              <div>
                <p className="mb-1 text-xs text-gray-500">
                  {t("dashboard.tickets.detail.createdBy", "Created by")}
                </p>
                {ticket.createdBy ? (
                  <p className="flex items-center gap-1.5 text-sm text-gray-700">
                    <User className="h-3.5 w-3.5 text-gray-400" />
                    {ticket.createdBy.name || ticket.createdBy.email}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400">
                    {t("dashboard.common.system", "System")}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-900">
              {t("dashboard.tickets.detail.associations", "Associations")}
            </h3>
            <div className="space-y-3">
              {ticket.contact ? (
                <Link
                  href={`/contacts/${ticket.contact.id}`}
                  className="flex items-center gap-2 text-sm text-gray-700 transition-colors hover:text-[#0891b2]"
                >
                  <User className="h-4 w-4 text-gray-400" />
                  {[ticket.contact.firstName, ticket.contact.lastName]
                    .filter(Boolean)
                    .join(" ")}
                </Link>
              ) : (
                <p className="flex items-center gap-2 text-sm text-gray-400">
                  <User className="h-4 w-4" />
                  {t(
                    "dashboard.tickets.detail.noContact",
                    "No contact linked"
                  )}
                </p>
              )}
              {ticket.company ? (
                <Link
                  href={`/companies/${ticket.company.id}`}
                  className="flex items-center gap-2 text-sm text-gray-700 transition-colors hover:text-[#0891b2]"
                >
                  <Building2 className="h-4 w-4 text-gray-400" />
                  {ticket.company.name}
                </Link>
              ) : (
                <p className="flex items-center gap-2 text-sm text-gray-400">
                  <Building2 className="h-4 w-4" />
                  {t(
                    "dashboard.tickets.detail.noCompany",
                    "No company linked"
                  )}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-900">
              {t("dashboard.tickets.detail.timeline", "Timeline")}
            </h3>
            <div className="space-y-3">
              <div>
                <p className="mb-0.5 text-xs text-gray-500">
                  {t("dashboard.tickets.detail.created", "Created")}
                </p>
                <p className="flex items-center gap-1.5 text-sm text-gray-700">
                  <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                  {new Date(ticket.createdAt).toLocaleString(intlLocale)}
                </p>
              </div>
              {ticket.resolvedAt && (
                <div>
                  <p className="mb-0.5 text-xs text-gray-500">
                    {t("dashboard.tickets.detail.resolved", "Resolved")}
                  </p>
                  <p className="flex items-center gap-1.5 text-sm text-gray-700">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    {new Date(ticket.resolvedAt).toLocaleString(intlLocale)}
                  </p>
                </div>
              )}
              {ticket.closedAt && (
                <div>
                  <p className="mb-0.5 text-xs text-gray-500">
                    {t("dashboard.tickets.detail.closed", "Closed")}
                  </p>
                  <p className="flex items-center gap-1.5 text-sm text-gray-700">
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                    {new Date(ticket.closedAt).toLocaleString(intlLocale)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
