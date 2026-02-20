"use client";

import { useEffect, useMemo, useState } from "react";
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

import { toIntlLocale } from "@/i18n/config";
import { useI18n } from "@/i18n/I18nProvider";

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

function formatCurrency(amount: number, intlLocale: string): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toLocaleString(intlLocale)}`;
}

function formatNumber(n: number, intlLocale: string): string {
  return n.toLocaleString(intlLocale);
}

function timeAgo(
  dateStr: string,
  t: (key: string, fallback?: string, values?: Record<string, string | number>) => string
): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t("dashboard.home.timeAgo.justNow", "just now");
  if (mins < 60) {
    return t("dashboard.home.timeAgo.minutes", "{value}m ago", {
      value: mins,
    });
  }
  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    return t("dashboard.home.timeAgo.hours", "{value}h ago", {
      value: hours,
    });
  }
  const days = Math.floor(hours / 24);
  return t("dashboard.home.timeAgo.days", "{value}d ago", {
    value: days,
  });
}

function activityTitle(
  activity: Activity,
  t: (key: string, fallback?: string) => string
): string {
  if (activity.subject) return activity.subject;
  const typeKey: Record<string, { key: string; fallback: string }> = {
    email: { key: "dashboard.home.activityTitles.email", fallback: "Email sent" },
    call: { key: "dashboard.home.activityTitles.call", fallback: "Phone call" },
    meeting: { key: "dashboard.home.activityTitles.meeting", fallback: "Meeting" },
    note: { key: "dashboard.home.activityTitles.note", fallback: "Note added" },
    task: { key: "dashboard.home.activityTitles.task", fallback: "Task" },
  };
  const item = typeKey[activity.type];
  if (!item) return activity.type;
  return t(item.key, item.fallback);
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

function activityTypeLabel(
  key: string,
  t: (key: string, fallback?: string) => string
): string {
  const map: Record<string, { key: string; fallback: string }> = {
    email: { key: "dashboard.home.activityTypePlural.email", fallback: "emails" },
    call: { key: "dashboard.home.activityTypePlural.call", fallback: "calls" },
    meeting: {
      key: "dashboard.home.activityTypePlural.meeting",
      fallback: "meetings",
    },
    note: { key: "dashboard.home.activityTypePlural.note", fallback: "notes" },
    task: { key: "dashboard.home.activityTypePlural.task", fallback: "tasks" },
  };
  const item = map[key];
  if (!item) return key;
  return t(item.key, item.fallback);
}

export default function DashboardPage() {
  const { locale, t } = useI18n();
  const [stats, setStats] = useState<Stats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const intlLocale = useMemo(() => toIntlLocale(locale), [locale]);

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
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0891b2]" />
      </div>
    );
  }

  const statCards = stats
    ? [
        {
          name: t("dashboard.home.stats.totalContacts", "Total Contacts"),
          value: formatNumber(stats.totalContacts, intlLocale),
          icon: Users,
        },
        {
          name: t("dashboard.home.stats.totalCompanies", "Total Companies"),
          value: formatNumber(stats.totalCompanies, intlLocale),
          icon: Building2,
        },
        {
          name: t("dashboard.home.stats.openDeals", "Open Deals"),
          value: formatNumber(stats.totalDeals, intlLocale),
          icon: CircleDollarSign,
        },
        {
          name: t("dashboard.home.stats.totalRevenue", "Total Revenue"),
          value: formatCurrency(stats.totalRevenue, intlLocale),
          icon: TrendingUp,
        },
      ]
    : [];

  return (
    <div className="p-6 pt-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {t("dashboard.home.title", "Dashboard")}
        </h1>
        <p className="mt-1 text-gray-600">
          {t("dashboard.home.subtitle", "Welcome back! Here's what's happening.")}
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div
            key={stat.name}
            className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50">
                <stat.icon className="h-5 w-5 text-[#0891b2]" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="mt-1 text-sm text-gray-500">{stat.name}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {t("dashboard.home.sections.recentActivity", "Recent Activity")}
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {activities.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                {t(
                  "dashboard.home.empty.recentActivities",
                  "No recent activities"
                )}
              </div>
            ) : (
              activities.map((activity) => {
                const Icon = activityIcons[activity.type] || FileText;
                return (
                  <div
                    key={activity.id}
                    className="p-4 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-cyan-50">
                        <Icon className="h-4 w-4 text-[#0891b2]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {activityTitle(activity, t)}
                        </p>
                        <p className="truncate text-sm text-gray-500">
                          {activityDescription(activity)}
                        </p>
                      </div>
                      <span className="flex-shrink-0 text-xs text-gray-400">
                        {timeAgo(activity.createdAt, t)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {t("dashboard.home.sections.dealsByStage", "Deals by Stage")}
            </h2>
          </div>
          <div className="space-y-4 p-6">
            {stats?.dealsByStage.length === 0 ? (
              <div className="py-4 text-center text-gray-400">
                {t("dashboard.home.empty.noDeals", "No deals yet")}
              </div>
            ) : (
              stats?.dealsByStage.map((stage) => (
                <div key={stage.name}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {stage.name}
                    </span>
                    <span className="text-sm text-gray-500">
                      {stage.count === 1
                        ? t("dashboard.home.dealsCount.singular", "{count} deal", {
                            count: stage.count,
                          })
                        : t("dashboard.home.dealsCount.plural", "{count} deals", {
                            count: stage.count,
                          })}{" "}
                      &middot; {formatCurrency(stage.amount, intlLocale)}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
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

          <div className="border-t border-gray-100 p-6">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">
              {t(
                "dashboard.home.sections.contactsByLifecycle",
                "Contacts by Lifecycle"
              )}
            </h3>
            <div className="flex flex-wrap gap-2">
              {stats?.contactsByLifecycle.map((lc) => (
                <span
                  key={lc.name}
                  className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-medium text-cyan-700"
                >
                  {lc.name}
                  <span className="rounded-full bg-cyan-200 px-1.5 py-0.5 text-[10px] font-bold text-cyan-800">
                    {lc.count}
                  </span>
                </span>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 p-6">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">
              {t(
                "dashboard.home.sections.activityBreakdown",
                "Activity Breakdown"
              )}
            </h3>
            <div className="space-y-2">
              {stats?.recentActivities.map((a) => {
                const Icon = activityIcons[a.name] || FileText;
                return (
                  <div key={a.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {activityTypeLabel(a.name, t)}
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
