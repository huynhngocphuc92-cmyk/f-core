import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { formatTicketNumber } from "@/lib/format-ticket-number";
import { TicketDetailClient } from "@/components/tickets/TicketDetailClient";
import {
  ArrowLeft,
  Clock,
  AlertCircle,
  MessageSquare,
  User,
  Building2,
  Tag,
} from "lucide-react";

async function getTicket(id: string) {
  const tenant = await prisma.tenant.findFirst({
    where: { domain: "demo.f-core.com" },
    select: { id: true },
  });
  if (!tenant) return null;

  const ticket = await prisma.ticket.findFirst({
    where: { id, tenantId: tenant.id, deletedAt: null },
    include: {
      assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      contact: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      company: { select: { id: true, name: true, domain: true } },
      stage: { select: { id: true, name: true, type: true, color: true, displayOrder: true } },
      pipeline: {
        select: {
          id: true,
          name: true,
          stages: {
            where: { deletedAt: null },
            orderBy: { displayOrder: "asc" },
            select: { id: true, name: true, type: true, color: true, displayOrder: true },
          },
        },
      },
      sla: true,
      comments: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          performedBy: { select: { id: true, name: true } },
        },
      },
    },
  });

  return ticket;
}

const priorityConfig: Record<string, { color: string; label: string; dotColor: string }> = {
  urgent: { color: "bg-red-50 text-red-700 border-red-200", label: "Urgent", dotColor: "bg-red-500" },
  high: { color: "bg-orange-50 text-orange-700 border-orange-200", label: "High", dotColor: "bg-orange-500" },
  medium: { color: "bg-blue-50 text-blue-700 border-blue-200", label: "Medium", dotColor: "bg-blue-500" },
  low: { color: "bg-gray-50 text-gray-600 border-gray-200", label: "Low", dotColor: "bg-gray-400" },
};

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ticket = await getTicket(id);

  if (!ticket) notFound();

  const priority = priorityConfig[ticket.priority] || priorityConfig.medium;
  const isOverdue =
    ticket.dueDate &&
    new Date(ticket.dueDate) < new Date() &&
    !["resolved", "closed"].includes(ticket.status);

  return (
    <div className="p-6 pt-8">
      {/* Back Link */}
      <Link
        href="/tickets"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to tickets
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-sm text-gray-400 font-mono">
              {formatTicketNumber(ticket.ticketNumber)}
            </span>
            <span
              className={`inline-flex px-2 py-0.5 text-xs font-medium rounded border ${priority.color}`}
            >
              {priority.label}
            </span>
            {isOverdue && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded bg-red-50 text-red-600">
                <AlertCircle className="w-3 h-3" />
                Overdue
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{ticket.title}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Conversation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {ticket.description && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{ticket.description}</p>
            </div>
          )}

          {/* Pipeline Progress */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Pipeline Progress</h3>
            <div className="flex items-center gap-1">
              {ticket.pipeline.stages.map((stage, index) => {
                const isCurrent = stage.id === ticket.stageId;
                const isPast = stage.displayOrder < ticket.stage.displayOrder;
                return (
                  <div key={stage.id} className="flex-1">
                    <div
                      className={`h-2 rounded-full ${
                        isCurrent
                          ? "bg-[#0891b2]"
                          : isPast
                          ? "bg-[#0891b2]/40"
                          : "bg-gray-200"
                      }`}
                    />
                    <p
                      className={`text-[11px] mt-1 truncate ${
                        isCurrent ? "text-[#0891b2] font-semibold" : "text-gray-400"
                      }`}
                    >
                      {stage.name}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Comments / Conversation */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Conversation ({ticket.comments.length})
              </h3>
            </div>

            <div className="divide-y divide-gray-100">
              {ticket.comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`px-5 py-4 ${comment.isInternal ? "bg-amber-50/50" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#0891b2] flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                      {comment.author?.name?.charAt(0) || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {comment.author?.name || "System"}
                        </span>
                        {comment.isInternal && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 rounded">
                            Internal
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {ticket.comments.length === 0 && (
                <div className="text-center py-8 text-sm text-gray-400">
                  No comments yet
                </div>
              )}
            </div>

            {/* Comment Input */}
            <TicketDetailClient ticketId={ticket.id} />
          </div>

          {/* Activity Log */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Activity
            </h3>
            <div className="space-y-3">
              {ticket.activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-2 flex-shrink-0" />
                  <div>
                    <span className="text-gray-600">{activity.description}</span>
                    {activity.performedBy && (
                      <span className="text-gray-400"> by {activity.performedBy.name}</span>
                    )}
                    <span className="text-xs text-gray-400 ml-2">
                      {new Date(activity.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Status Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Details</h3>

            <div>
              <label className="text-xs text-gray-500 block mb-1">Status</label>
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium"
                style={{ backgroundColor: (ticket.stage.color || "#6B7280") + "20", color: ticket.stage.color || "#6B7280" }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: ticket.stage.color || "#6B7280" }}
                />
                {ticket.stage.name}
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">Priority</label>
              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded border ${priority.color}`}>
                {priority.label}
              </span>
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">Category</label>
              <span className="text-sm text-gray-700">{ticket.category || "None"}</span>
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">Source</label>
              <span className="text-sm text-gray-700 capitalize">{ticket.source}</span>
            </div>

            {ticket.tags.length > 0 && (
              <div>
                <label className="text-xs text-gray-500 block mb-1">Tags</label>
                <div className="flex flex-wrap gap-1">
                  {ticket.tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* People Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">People</h3>

            <div>
              <label className="text-xs text-gray-500 block mb-1">Assigned to</label>
              {ticket.assignedTo ? (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#0891b2] flex items-center justify-center text-white text-xs font-medium">
                    {ticket.assignedTo.name?.charAt(0) || "?"}
                  </div>
                  <span className="text-sm text-gray-700">{ticket.assignedTo.name}</span>
                </div>
              ) : (
                <span className="text-sm text-gray-400">Unassigned</span>
              )}
            </div>

            {ticket.contact && (
              <div>
                <label className="text-xs text-gray-500 block mb-1">Contact</label>
                <Link href={`/contacts/${ticket.contact.id}`} className="flex items-center gap-2 hover:text-[#0891b2]">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">
                    {ticket.contact.firstName} {ticket.contact.lastName}
                  </span>
                </Link>
                {ticket.contact.email && (
                  <p className="text-xs text-gray-400 ml-6">{ticket.contact.email}</p>
                )}
              </div>
            )}

            {ticket.company && (
              <div>
                <label className="text-xs text-gray-500 block mb-1">Company</label>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">{ticket.company.name}</span>
                </div>
              </div>
            )}
          </div>

          {/* SLA Card */}
          {ticket.sla && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">SLA</h3>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Policy</label>
                <span className="text-sm text-gray-700">{ticket.sla.name}</span>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">First Response</label>
                <span className={`text-sm ${ticket.firstResponseAt ? "text-green-600" : isOverdue ? "text-red-600" : "text-gray-700"}`}>
                  {ticket.firstResponseAt
                    ? `Responded at ${new Date(ticket.firstResponseAt).toLocaleString()}`
                    : `${ticket.sla.firstResponseTime} min target`}
                </span>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Resolution</label>
                <span className={`text-sm ${ticket.resolvedAt ? "text-green-600" : isOverdue ? "text-red-600" : "text-gray-700"}`}>
                  {ticket.resolvedAt
                    ? `Resolved at ${new Date(ticket.resolvedAt).toLocaleString()}`
                    : `${ticket.sla.resolutionTime} min target`}
                </span>
              </div>
              {ticket.dueDate && (
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Due Date</label>
                  <span className={`text-sm ${isOverdue ? "text-red-600 font-medium" : "text-gray-700"}`}>
                    {new Date(ticket.dueDate).toLocaleString()}
                    {isOverdue && " (Overdue)"}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Timestamps */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-2">
            <h3 className="text-sm font-semibold text-gray-700">Dates</h3>
            <div className="text-sm">
              <span className="text-gray-500">Created:</span>{" "}
              <span className="text-gray-700">{new Date(ticket.createdAt).toLocaleString()}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-500">Updated:</span>{" "}
              <span className="text-gray-700">{new Date(ticket.updatedAt).toLocaleString()}</span>
            </div>
            {ticket.createdBy && (
              <div className="text-sm">
                <span className="text-gray-500">Created by:</span>{" "}
                <span className="text-gray-700">{ticket.createdBy.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
