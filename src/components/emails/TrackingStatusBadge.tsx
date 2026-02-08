"use client";

import { cn } from "@/lib/utils";
import {
  Send,
  Eye,
  MousePointerClick,
  AlertCircle,
  Clock,
  FileEdit,
} from "lucide-react";

type EmailStatus =
  | "draft"
  | "scheduled"
  | "sent"
  | "delivered"
  | "opened"
  | "clicked"
  | "bounced"
  | "failed";

interface TrackingStatusBadgeProps {
  status: EmailStatus;
  openCount?: number;
  clickCount?: number;
  className?: string;
}

const statusConfig: Record<
  EmailStatus,
  { icon: React.ElementType; label: string; color: string }
> = {
  draft: {
    icon: FileEdit,
    label: "Draft",
    color: "bg-gray-100 text-gray-600",
  },
  scheduled: {
    icon: Clock,
    label: "Scheduled",
    color: "bg-purple-50 text-purple-700",
  },
  sent: {
    icon: Send,
    label: "Sent",
    color: "bg-blue-50 text-blue-700",
  },
  delivered: {
    icon: Send,
    label: "Delivered",
    color: "bg-green-50 text-green-700",
  },
  opened: {
    icon: Eye,
    label: "Opened",
    color: "bg-cyan-50 text-cyan-700",
  },
  clicked: {
    icon: MousePointerClick,
    label: "Clicked",
    color: "bg-emerald-50 text-emerald-700",
  },
  bounced: {
    icon: AlertCircle,
    label: "Bounced",
    color: "bg-red-50 text-red-700",
  },
  failed: {
    icon: AlertCircle,
    label: "Failed",
    color: "bg-red-50 text-red-700",
  },
};

function getDisplayStatus(
  status: string,
  openCount: number,
  clickCount: number
): EmailStatus {
  if (clickCount > 0) return "clicked";
  if (openCount > 0) return "opened";
  return status as EmailStatus;
}

export function TrackingStatusBadge({
  status,
  openCount = 0,
  clickCount = 0,
  className,
}: TrackingStatusBadgeProps) {
  const displayStatus = getDisplayStatus(status, openCount, clickCount);
  const config = statusConfig[displayStatus] || statusConfig.sent;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
        config.color,
        className
      )}
    >
      <Icon className="w-3 h-3" />
      <span>{config.label}</span>
      {openCount > 0 && displayStatus === "opened" && (
        <span className="text-[10px] opacity-75">({openCount})</span>
      )}
      {clickCount > 0 && displayStatus === "clicked" && (
        <span className="text-[10px] opacity-75">({clickCount})</span>
      )}
    </span>
  );
}
