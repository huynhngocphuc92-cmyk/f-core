import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Building2,
  Clock,
  Tag,
  Globe,
  CalendarDays,
  CheckCircle2,
} from "lucide-react";
import { getTicket } from "@/app/actions/tickets";
import { StatusSelector, PrioritySelector, DeleteButton } from "./TicketActions";

export const dynamic = "force-dynamic";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ticket = await getTicket(id);

  if (!ticket) notFound();

  return (
    <div className="p-6 pt-8">
      <Link
        href="/tickets"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#0891b2] transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Tickets
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <span>Ticket #{ticket.ticketNumber}</span>
                  {ticket.category && (
                    <>
                      <span className="text-gray-300">|</span>
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-600">
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

          {/* Description */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
              Description
            </h3>
            {ticket.description ? (
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                {ticket.description}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No description provided</p>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Status & Priority */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
              Details
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <StatusSelector ticketId={ticket.id} current={ticket.status} />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Priority</p>
                <PrioritySelector ticketId={ticket.id} current={ticket.priority} />
              </div>
              {ticket.source && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Source</p>
                  <p className="flex items-center gap-1.5 text-sm text-gray-700">
                    <Globe className="w-3.5 h-3.5 text-gray-400" />
                    {ticket.source}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* People */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
              People
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Assignee</p>
                {ticket.assignee ? (
                  <p className="flex items-center gap-1.5 text-sm text-gray-700">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    {ticket.assignee.name || ticket.assignee.email}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400">Unassigned</p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Created by</p>
                {ticket.createdBy ? (
                  <p className="flex items-center gap-1.5 text-sm text-gray-700">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    {ticket.createdBy.name || ticket.createdBy.email}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400">System</p>
                )}
              </div>
            </div>
          </div>

          {/* Associations */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
              Associations
            </h3>
            <div className="space-y-3">
              {ticket.contact ? (
                <Link
                  href={`/contacts/${ticket.contact.id}`}
                  className="flex items-center gap-2 text-sm text-gray-700 hover:text-[#0891b2] transition-colors"
                >
                  <User className="w-4 h-4 text-gray-400" />
                  {[ticket.contact.firstName, ticket.contact.lastName]
                    .filter(Boolean)
                    .join(" ")}
                </Link>
              ) : (
                <p className="flex items-center gap-2 text-sm text-gray-400">
                  <User className="w-4 h-4" />
                  No contact linked
                </p>
              )}
              {ticket.company ? (
                <Link
                  href={`/companies/${ticket.company.id}`}
                  className="flex items-center gap-2 text-sm text-gray-700 hover:text-[#0891b2] transition-colors"
                >
                  <Building2 className="w-4 h-4 text-gray-400" />
                  {ticket.company.name}
                </Link>
              ) : (
                <p className="flex items-center gap-2 text-sm text-gray-400">
                  <Building2 className="w-4 h-4" />
                  No company linked
                </p>
              )}
            </div>
          </div>

          {/* Timestamps */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
              Timeline
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Created</p>
                <p className="flex items-center gap-1.5 text-sm text-gray-700">
                  <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                  {new Date(ticket.createdAt).toLocaleString()}
                </p>
              </div>
              {ticket.resolvedAt && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Resolved</p>
                  <p className="flex items-center gap-1.5 text-sm text-gray-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    {new Date(ticket.resolvedAt).toLocaleString()}
                  </p>
                </div>
              )}
              {ticket.closedAt && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Closed</p>
                  <p className="flex items-center gap-1.5 text-sm text-gray-700">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    {new Date(ticket.closedAt).toLocaleString()}
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
