"use client";

import { useEffect, useMemo, useState } from "react";
import { Save } from "lucide-react";
import type { ServiceRoutingPolicy } from "@/lib/service-routing-store";

type RoutingUser = {
  id: string;
  name: string | null;
  email: string;
  role: string;
};

const emptyPolicy: ServiceRoutingPolicy = {
  teams: [
    {
      id: "general",
      name: "General Support",
      assigneeIds: [],
    },
  ],
  businessHours: {
    timezone: "UTC",
    weekdays: [1, 2, 3, 4, 5],
    startHour: 9,
    endHour: 18,
  },
  priorityRules: {
    low: { teamId: "general" },
    medium: { teamId: "general" },
    high: { teamId: "general" },
    urgent: { teamId: "general" },
  },
  channelRules: {
    email: { teamId: null },
    phone: { teamId: null },
    web: { teamId: null },
    chat: { teamId: null },
  },
  offHoursTeamId: null,
  fallbackAssigneeId: null,
};

const weekdayOptions = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
];

const priorityOptions = ["urgent", "high", "medium", "low"] as const;

export default function ServiceRoutingPage() {
  const [policy, setPolicy] = useState<ServiceRoutingPolicy>(emptyPolicy);
  const [users, setUsers] = useState<RoutingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/service/inbox/routing-rules");
      const data = await response.json();
      setPolicy(data.policy || emptyPolicy);
      setUsers(data.users || []);
    } catch {
      setError("Unable to load routing rules.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const teamOptions = useMemo(
    () => policy.teams.map((team) => ({ value: team.id, label: team.name })),
    [policy]
  );

  async function savePolicy() {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/service/inbox/routing-rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policy }),
      });
      if (!response.ok) throw new Error("Save failed");
      await loadData();
    } catch {
      setError("Unable to save routing rules.");
    } finally {
      setSaving(false);
    }
  }

  function updatePriorityRule(priority: (typeof priorityOptions)[number], teamId: string) {
    setPolicy((prev) => ({
      ...prev,
      priorityRules: {
        ...prev.priorityRules,
        [priority]: { teamId: teamId || null },
      },
    }));
  }

  if (loading) {
    return (
      <div className="p-6 pt-8">
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Loading routing rules...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Routing Rules</h1>
          <p className="text-gray-600 mt-1">
            Auto-assign tickets by team, priority, and business hours.
          </p>
        </div>
        <button
          onClick={savePolicy}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-[#0e7490] transition-colors text-sm disabled:opacity-70"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Rules"}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
            Teams
          </h2>
          <div className="space-y-3">
            {policy.teams.map((team, index) => (
              <div key={team.id} className="rounded-lg border border-gray-100 p-3">
                <input
                  value={team.name}
                  onChange={(event) =>
                    setPolicy((prev) => {
                      const teams = [...prev.teams];
                      teams[index] = { ...teams[index], name: event.target.value || team.name };
                      return { ...prev, teams };
                    })
                  }
                  className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm"
                />
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">Assignees</p>
                  <select
                    multiple
                    value={team.assigneeIds}
                    onChange={(event) => {
                      const selected = Array.from(event.target.selectedOptions).map(
                        (option) => option.value
                      );
                      setPolicy((prev) => {
                        const teams = [...prev.teams];
                        teams[index] = { ...teams[index], assigneeIds: selected };
                        return { ...prev, teams };
                      });
                    }}
                    className="w-full min-h-20 rounded-md border border-gray-200 px-2 py-1.5 text-sm"
                  >
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name || user.email} ({user.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-5">
          <section>
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
              Priority Routing
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {priorityOptions.map((priority) => (
                <label key={priority} className="text-xs text-gray-600 capitalize">
                  {priority}
                  <select
                    value={policy.priorityRules[priority].teamId || ""}
                    onChange={(event) => updatePriorityRule(priority, event.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm text-gray-800"
                  >
                    <option value="">No team</option>
                    {teamOptions.map((team) => (
                      <option key={team.value} value={team.value}>
                        {team.label}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
              Business Hours
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <label className="text-xs text-gray-600">
                Start hour (UTC)
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={policy.businessHours.startHour}
                  onChange={(event) =>
                    setPolicy((prev) => ({
                      ...prev,
                      businessHours: {
                        ...prev.businessHours,
                        startHour: Number(event.target.value || 0),
                      },
                    }))
                  }
                  className="mt-1 w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm"
                />
              </label>
              <label className="text-xs text-gray-600">
                End hour (UTC)
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={policy.businessHours.endHour}
                  onChange={(event) =>
                    setPolicy((prev) => ({
                      ...prev,
                      businessHours: {
                        ...prev.businessHours,
                        endHour: Number(event.target.value || 1),
                      },
                    }))
                  }
                  className="mt-1 w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm"
                />
              </label>
              <label className="text-xs text-gray-600 col-span-2">
                Off-hours team
                <select
                  value={policy.offHoursTeamId || ""}
                  onChange={(event) =>
                    setPolicy((prev) => ({
                      ...prev,
                      offHoursTeamId: event.target.value || null,
                    }))
                  }
                  className="mt-1 w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm text-gray-800"
                >
                  <option value="">No override</option>
                  {teamOptions.map((team) => (
                    <option key={team.value} value={team.value}>
                      {team.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {weekdayOptions.map((day) => {
                const active = policy.businessHours.weekdays.includes(day.value);
                return (
                  <button
                    key={day.value}
                    onClick={() =>
                      setPolicy((prev) => {
                        const weekdays = active
                          ? prev.businessHours.weekdays.filter((item) => item !== day.value)
                          : [...prev.businessHours.weekdays, day.value].sort();
                        return {
                          ...prev,
                          businessHours: {
                            ...prev.businessHours,
                            weekdays: weekdays.length > 0 ? weekdays : [1],
                          },
                        };
                      })
                    }
                    className={`px-2.5 py-1 rounded-full text-xs border ${
                      active
                        ? "bg-[#0891b2] text-white border-[#0891b2]"
                        : "bg-white text-gray-600 border-gray-200"
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
