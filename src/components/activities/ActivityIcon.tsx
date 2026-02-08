"use client";

import {
  Mail,
  Phone,
  CalendarDays,
  StickyNote,
  CheckSquare,
} from "lucide-react";
import type { ReactNode } from "react";

export type ActivityType = "email" | "call" | "meeting" | "note" | "task";

interface ActivityTypeConfig {
  icon: ReactNode;
  label: string;
  bgColor: string;
  iconColor: string;
}

const ACTIVITY_TYPE_CONFIG: Record<ActivityType, ActivityTypeConfig> = {
  email: {
    icon: <Mail className="w-4 h-4" />,
    label: "Email",
    bgColor: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  call: {
    icon: <Phone className="w-4 h-4" />,
    label: "Call",
    bgColor: "bg-green-50",
    iconColor: "text-green-600",
  },
  meeting: {
    icon: <CalendarDays className="w-4 h-4" />,
    label: "Meeting",
    bgColor: "bg-purple-50",
    iconColor: "text-purple-600",
  },
  note: {
    icon: <StickyNote className="w-4 h-4" />,
    label: "Note",
    bgColor: "bg-yellow-50",
    iconColor: "text-yellow-600",
  },
  task: {
    icon: <CheckSquare className="w-4 h-4" />,
    label: "Task",
    bgColor: "bg-orange-50",
    iconColor: "text-orange-600",
  },
};

export function getActivityConfig(type: string): ActivityTypeConfig {
  return ACTIVITY_TYPE_CONFIG[type as ActivityType] || ACTIVITY_TYPE_CONFIG.note;
}

interface ActivityIconProps {
  type: string;
  size?: "sm" | "md";
}

export default function ActivityIcon({ type, size = "md" }: ActivityIconProps) {
  const config = getActivityConfig(type);
  const sizeClasses = size === "sm" ? "w-7 h-7" : "w-8 h-8";

  return (
    <div
      className={`${sizeClasses} rounded-full ${config.bgColor} ${config.iconColor} flex items-center justify-center flex-shrink-0 shadow-sm border-2 border-white`}
    >
      {config.icon}
    </div>
  );
}
