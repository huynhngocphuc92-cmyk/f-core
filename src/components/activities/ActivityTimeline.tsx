"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Plus,
  Filter,
  Loader2,
  Activity,
} from "lucide-react";
import ActivityItem from "./ActivityItem";
import ActivityForm from "./ActivityForm";
import { getActivityConfig, type ActivityType } from "./ActivityIcon";

interface ActivityData {
  id: string;
  type: string;
  subject: string | null;
  body: string | null;
  createdAt: string;
  owner: { id: string; name: string | null; email: string } | null;
  contact: { id: string; firstName: string | null; lastName: string | null; email: string | null } | null;
  company: { id: string; name: string; domain: string | null } | null;
  deal: { id: string; name: string; amount: string | number | null } | null;
  callDuration: number | null;
  callOutcome: string | null;
  callDirection: string | null;
  meetingStart: string | null;
  meetingEnd: string | null;
  meetingLocation: string | null;
  attendees: string[] | null;
  emailTo: string | null;
  emailCc: string | null;
  emailStatus: string | null;
  dueDate: string | null;
  priority: string | null;
  status: string | null;
  completedAt: string | null;
}

interface ActivityTimelineProps {
  contactId?: string;
  companyId?: string;
  dealId?: string;
  showHeader?: boolean;
  showLogButtons?: boolean;
}

const FILTER_TYPES: ActivityType[] = ["email", "call", "meeting", "note", "task"];

function getDateGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const activityDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (activityDate.getTime() === today.getTime()) return "Today";
  if (activityDate.getTime() === yesterday.getTime()) return "Yesterday";

  const diffDays = Math.floor((today.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    return date.toLocaleDateString("en-US", { weekday: "long" });
  }
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  }
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function groupByDate(activities: ActivityData[]): Map<string, ActivityData[]> {
  const groups = new Map<string, ActivityData[]>();
  for (const activity of activities) {
    const group = getDateGroup(activity.createdAt);
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(activity);
  }
  return groups;
}

export default function ActivityTimeline({
  contactId,
  companyId,
  dealId,
  showHeader = true,
  showLogButtons = true,
}: ActivityTimelineProps) {
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formDefaultType, setFormDefaultType] = useState("note");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetchActivities = useCallback(async (cursor?: string) => {
    if (!cursor) setLoading(true);
    else setLoadingMore(true);

    try {
      const params = new URLSearchParams({ limit: "20" });
      if (contactId) params.set("contactId", contactId);
      if (companyId) params.set("companyId", companyId);
      if (dealId) params.set("dealId", dealId);
      if (activeFilters.size > 0) params.set("type", Array.from(activeFilters).join(","));
      if (cursor) params.set("cursor", cursor);

      const res = await fetch(`/api/activities?${params}`);
      if (!res.ok) throw new Error("Failed to fetch activities");
      const json = await res.json();

      if (cursor) {
        setActivities((prev) => [...prev, ...(json.data || [])]);
      } else {
        setActivities(json.data || []);
      }
      setNextCursor(json.meta?.nextCursor || null);
      setHasMore(json.meta?.hasMore || false);
      setError(null);
    } catch {
      setError("Failed to load activities");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [contactId, companyId, dealId, activeFilters]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleToggleFilter = (type: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const handleComplete = async (id: string) => {
    const activity = activities.find((a) => a.id === id);
    if (!activity) return;

    const newStatus = activity.status === "completed" ? "pending" : "completed";

    // Optimistic update
    setActivities((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, status: newStatus, completedAt: newStatus === "completed" ? new Date().toISOString() : null }
          : a
      )
    );

    try {
      const res = await fetch(`/api/activities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      setToast({ message: newStatus === "completed" ? "Task completed" : "Task reopened", type: "success" });
    } catch {
      fetchActivities();
      setToast({ message: "Failed to update task", type: "error" });
    }
  };

  const handleDelete = async (id: string) => {
    // Optimistic remove
    setActivities((prev) => prev.filter((a) => a.id !== id));

    try {
      const res = await fetch(`/api/activities/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setToast({ message: "Activity deleted", type: "success" });
    } catch {
      fetchActivities();
      setToast({ message: "Failed to delete activity", type: "error" });
    }
  };

  const handleActivityCreated = () => {
    setFormOpen(false);
    fetchActivities();
    setToast({ message: "Activity logged", type: "success" });
  };

  const openForm = (type: string) => {
    setFormDefaultType(type);
    setFormOpen(true);
  };

  const dateGroups = groupByDate(activities);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      {showHeader && (
        <div className="px-4 py-3 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Activity</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-1.5 rounded-md transition-colors ${
                  showFilters || activeFilters.size > 0
                    ? "text-cyan-600 bg-cyan-50"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Filter className="w-4 h-4" />
              </button>
              <button
                onClick={() => openForm("note")}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#0891b2] text-white rounded-md text-sm font-semibold hover:bg-[#0ea5e9] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Log
              </button>
            </div>
          </div>

          {/* Filter chips */}
          {showFilters && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {FILTER_TYPES.map((type) => {
                const config = getActivityConfig(type);
                const isActive = activeFilters.has(type);
                return (
                  <button
                    key={type}
                    onClick={() => handleToggleFilter(type)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                      isActive
                        ? `${config.bgColor} ${config.iconColor} ring-1 ring-current`
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {config.label}
                  </button>
                );
              })}
              {activeFilters.size > 0 && (
                <button
                  onClick={() => setActiveFilters(new Set())}
                  className="text-xs text-gray-400 hover:text-gray-600 px-1"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {/* Quick log buttons */}
          {showLogButtons && (
            <div className="flex gap-1 mt-2">
              {FILTER_TYPES.map((type) => {
                const config = getActivityConfig(type);
                return (
                  <button
                    key={type}
                    onClick={() => openForm(type)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium ${config.bgColor} ${config.iconColor} hover:opacity-80 transition-opacity`}
                  >
                    {config.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Timeline body */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-sm text-red-600 mb-2">{error}</p>
            <button
              onClick={() => fetchActivities()}
              className="text-sm text-cyan-600 hover:text-cyan-700 font-medium"
            >
              Retry
            </button>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-1">No activities yet</p>
            <p className="text-xs text-gray-400 mb-4">
              Log your first activity to start tracking interactions
            </p>
            <button
              onClick={() => openForm("note")}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0891b2] text-white rounded-md text-sm font-semibold hover:bg-[#0ea5e9] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Log activity
            </button>
          </div>
        ) : (
          <>
            {Array.from(dateGroups.entries()).map(([dateLabel, groupActivities]) => (
              <div key={dateLabel} className="mb-2">
                {/* Date header */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {dateLabel}
                  </span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Activities in group */}
                {groupActivities.map((activity, idx) => (
                  <ActivityItem
                    key={activity.id}
                    activity={activity}
                    onComplete={handleComplete}
                    onDelete={handleDelete}
                    isLast={
                      idx === groupActivities.length - 1 &&
                      dateLabel === Array.from(dateGroups.keys()).pop()
                    }
                  />
                ))}
              </div>
            ))}

            {/* Load more */}
            {hasMore && (
              <div className="text-center py-4">
                <button
                  onClick={() => nextCursor && fetchActivities(nextCursor)}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load more"
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Activity Form */}
      <ActivityForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={handleActivityCreated}
        defaultType={formDefaultType}
        contactId={contactId}
        companyId={companyId}
        dealId={dealId}
      />

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-[70] px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
            toast.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
