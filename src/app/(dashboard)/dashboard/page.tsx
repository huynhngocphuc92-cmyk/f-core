"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Building2,
  CircleDollarSign,
  TrendingUp,
  Mail,
  Phone,
  Calendar,
  FileText,
  CheckSquare,
  Loader2,
} from "lucide-react";

interface Stats {
  totalContacts: number;
  totalCompanies: number;
  totalDeals: number;
  totalRevenue: number;
  dealsWon: number;
  dealsByStage: { name: string; count: number; amount: number; color: string }[];
  contactsByLifecycle: { name: string; count: number }[];
  recentActivities: { name: string; count: number }[];
}

interface Activity {
  id: string;
  type: string;
  subject: string | null;
  body: string | null;
  createdAt: string;
  contact: { id: string; firstName: string | null; lastName: string | null } | null;
  company: { id: string; name: string } | null;
  deal: { id: string; name: string } | null;
  owner: { id: string; name: string | null } | null;
}

const activityIcons: Record<string, typeof Mail> = {
  email: Mail,
  call: Phone,
  meeting: Calendar,
  note: FileText,
  task: CheckSquare,
};

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

function formatNumber(n: number): string {
  return n.toLocaleString();
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function activityTitle(activity: Activity): string {
  if (activity.subject) return activity.subject;
  const typeLabel: Record<string, string> = {
    email: "Email sent",
    call: "Phone call",
    meeting: "Meeting",
    note: "Note added",
    task: "Task",
  };
  return typeLabel[activity.type] || activity.type;
}

function activityDescription(activity: Activity): string {
  const parts: string[] = [];
  if (activity.contact) {
    parts.push(`${activity.contact.firstName || ""} ${activity.contact.lastName || ""}`.trim());
  }
  if (activity.deal) parts.push(activity.deal.name);
  if (activity.company) parts.push(activity.company.name);
  return parts.join(" - ") || activity.body?.slice(0, 60) || "";
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/reports/stats").then((r) => r.json()),
      fetch("/api/activities?limit=10").then((r) => r.json()),
    ])
      .then(([statsRes, activitiesRes]) => {
        setStats(statsRes.data);
        setActivities(activitiesRes.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[#0891b2]" />
      </div>
    );
  }

  const statCards = stats
    ? [
        {
          name: "Total Contacts",
          value: formatNumber(stats.totalContacts),
          icon: Users,
        },
        {
          name: "Total Companies",
          value: formatNumber(stats.totalCompanies),
          icon: Building2,
        },
        {
          name: "Open Deals",
          value: formatNumber(stats.totalDeals),
          icon: CircleDollarSign,
        },
        {
          name: "Total Revenue",
          value: formatCurrency(stats.totalRevenue),
          icon: TrendingUp,
        },
      ]
    : [];

  return (
    <div className="p-6 pt-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back! Here&apos;s what&apos;s happening.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-cyan-50 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-[#0891b2]" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-500 mt-1">{stat.name}</div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Activity
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {activities.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                No recent activities
              </div>
            ) : (
              activities.map((activity) => {
                const Icon = activityIcons[activity.type] || FileText;
                return (
                  <div
                    key={activity.id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-cyan-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="w-4 h-4 text-[#0891b2]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {activityTitle(activity)}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {activityDescription(activity)}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {timeAgo(activity.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Deals by Stage */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              Deals by Stage
            </h2>
          </div>
          <div className="p-6 space-y-4">
            {stats?.dealsByStage.length === 0 ? (
              <div className="text-center text-gray-400 py-4">No deals yet</div>
            ) : (
              stats?.dealsByStage.map((stage) => (
                <div key={stage.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {stage.name}
                    </span>
                    <span className="text-sm text-gray-500">
                      {stage.count} deal{stage.count !== 1 ? "s" : ""} &middot;{" "}
                      {formatCurrency(stage.amount)}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          stats.totalRevenue > 0
                            ? (stage.amount / stats.totalRevenue) * 100
                            : 0
                        )}%`,
                        backgroundColor: stage.color || "#0891b2",
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Contacts by Lifecycle */}
          <div className="p-6 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Contacts by Lifecycle
            </h3>
            <div className="flex flex-wrap gap-2">
              {stats?.contactsByLifecycle.map((lc) => (
                <span
                  key={lc.name}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-50 text-xs font-medium text-cyan-700"
                >
                  {lc.name}
                  <span className="bg-cyan-200 text-cyan-800 rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                    {lc.count}
                  </span>
                </span>
              ))}
            </div>
          </div>

          {/* Activity Breakdown */}
          <div className="p-6 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Activity Breakdown
            </h3>
            <div className="space-y-2">
              {stats?.recentActivities.map((a) => {
                const Icon = activityIcons[a.name] || FileText;
                return (
                  <div
                    key={a.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 capitalize">
                        {a.name}s
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {a.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
