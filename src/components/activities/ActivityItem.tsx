"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  PhoneIncoming,
  PhoneOutgoing,
  MapPin,
  CheckCircle2,
  Circle,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import ActivityIcon, { getActivityConfig } from "./ActivityIcon";

interface ActivityData {
  id: string;
  type: string;
  subject: string | null;
  body: string | null;
  createdAt: string;
  // Owner
  owner: { id: string; name: string | null; email: string } | null;
  // Associations
  contact: { id: string; firstName: string | null; lastName: string | null; email: string | null } | null;
  company: { id: string; name: string; domain: string | null } | null;
  deal: { id: string; name: string; amount: string | number | null } | null;
  // Call
  callDuration: number | null;
  callOutcome: string | null;
  callDirection: string | null;
  // Meeting
  meetingStart: string | null;
  meetingEnd: string | null;
  meetingLocation: string | null;
  attendees: string[] | null;
  // Email
  emailTo: string | null;
  emailCc: string | null;
  emailStatus: string | null;
  // Task
  dueDate: string | null;
  priority: string | null;
  status: string | null;
  completedAt: string | null;
}

interface ActivityItemProps {
  activity: ActivityData;
  onComplete?: (id: string) => void;
  onDelete?: (id: string) => void;
  isLast?: boolean;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

function formatCallOutcome(outcome: string | null): string {
  const map: Record<string, string> = {
    connected: "Connected",
    left_voicemail: "Left voicemail",
    no_answer: "No answer",
    busy: "Busy",
  };
  return outcome ? map[outcome] || outcome : "";
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    sent: "bg-blue-100 text-blue-700",
    delivered: "bg-blue-100 text-blue-700",
    opened: "bg-green-100 text-green-700",
    clicked: "bg-green-100 text-green-700",
    replied: "bg-emerald-100 text-emerald-700",
    bounced: "bg-red-100 text-red-700",
    completed: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    cancelled: "bg-gray-100 text-gray-600",
    connected: "bg-green-100 text-green-700",
    no_answer: "bg-gray-100 text-gray-600",
    left_voicemail: "bg-yellow-100 text-yellow-700",
    busy: "bg-orange-100 text-orange-700",
  };

  return (
    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${styles[status] || "bg-gray-100 text-gray-600"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export default function ActivityItem({ activity, onComplete, onDelete, isLast }: ActivityItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const config = getActivityConfig(activity.type);

  const ownerName = activity.owner?.name || activity.owner?.email || "System";
  const isTask = activity.type === "task";
  const isCompleted = activity.status === "completed";

  const getStatusForBadge = (): string | null => {
    if (activity.type === "email" && activity.emailStatus) return activity.emailStatus;
    if (activity.type === "call" && activity.callOutcome) return activity.callOutcome;
    if (activity.type === "task" && activity.status) return activity.status;
    return null;
  };

  const statusBadge = getStatusForBadge();

  return (
    <div className="relative flex gap-3 group">
      {/* Timeline spine */}
      <div className="flex flex-col items-center">
        <ActivityIcon type={activity.type} />
        {!isLast && (
          <div className="w-0.5 flex-1 bg-gray-200 mt-1" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-6 min-w-0">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {isTask && (
                <button
                  onClick={() => onComplete?.(activity.id)}
                  className="flex-shrink-0"
                  title={isCompleted ? "Completed" : "Mark as complete"}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <Circle className="w-4 h-4 text-gray-300 hover:text-green-500 transition-colors" />
                  )}
                </button>
              )}
              <span className={`text-sm font-medium text-gray-900 truncate ${isCompleted ? "line-through text-gray-400" : ""}`}>
                {activity.subject || `${config.label} logged`}
              </span>
              {statusBadge && <StatusBadge status={statusBadge} />}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
              <span>{formatTime(activity.createdAt)}</span>
              <span>·</span>
              <span>{ownerName}</span>
              {activity.type === "call" && activity.callDirection && (
                <>
                  <span>·</span>
                  {activity.callDirection === "inbound" ? (
                    <PhoneIncoming className="w-3 h-3" />
                  ) : (
                    <PhoneOutgoing className="w-3 h-3" />
                  )}
                  <span>{activity.callDirection}</span>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {showActions && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowActions(false)} />
                  <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                    <button
                      onClick={() => {
                        onDelete?.(activity.id);
                        setShowActions(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Preview / Body */}
        {activity.body && (
          <div className="mt-1.5">
            {expanded ? (
              <div className="text-sm text-gray-600 whitespace-pre-wrap">{activity.body}</div>
            ) : (
              <p className="text-sm text-gray-500 line-clamp-2">{activity.body}</p>
            )}
          </div>
        )}

        {/* Type-specific details */}
        {activity.type === "call" && activity.callDuration && (
          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(activity.callDuration)}
            </span>
            {activity.callOutcome && (
              <span>{formatCallOutcome(activity.callOutcome)}</span>
            )}
          </div>
        )}

        {activity.type === "meeting" && (
          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-400">
            {activity.meetingStart && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(activity.meetingStart).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
                {activity.meetingEnd && (
                  <>
                    {" - "}
                    {new Date(activity.meetingEnd).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </>
                )}
              </span>
            )}
            {activity.meetingLocation && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {activity.meetingLocation}
              </span>
            )}
          </div>
        )}

        {activity.type === "email" && activity.emailTo && (
          <div className="text-xs text-gray-400 mt-1">
            To: {activity.emailTo}
            {activity.emailCc && <span> · CC: {activity.emailCc}</span>}
          </div>
        )}

        {activity.type === "task" && activity.dueDate && (
          <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            Due: {new Date(activity.dueDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
            {activity.priority && (
              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                activity.priority === "high"
                  ? "bg-red-100 text-red-700"
                  : activity.priority === "medium"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-gray-100 text-gray-600"
              }`}>
                {activity.priority}
              </span>
            )}
          </div>
        )}

        {/* Expand/Collapse */}
        {activity.body && activity.body.length > 120 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-cyan-600 hover:text-cyan-700 mt-1.5 font-medium"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3 h-3" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                Show more
              </>
            )}
          </button>
        )}

        {/* Associations */}
        {(activity.contact || activity.company || activity.deal) && expanded && (
          <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-400">
            {activity.contact && (
              <span className="bg-gray-50 px-2 py-0.5 rounded">
                {[activity.contact.firstName, activity.contact.lastName].filter(Boolean).join(" ")}
              </span>
            )}
            {activity.company && (
              <span className="bg-gray-50 px-2 py-0.5 rounded">
                {activity.company.name}
              </span>
            )}
            {activity.deal && (
              <span className="bg-gray-50 px-2 py-0.5 rounded">
                {activity.deal.name}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
