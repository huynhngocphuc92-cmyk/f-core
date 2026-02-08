"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Video, Phone, MapPin } from "lucide-react";
import Link from "next/link";

const LOCATION_TYPES = [
  { value: "video", label: "Video call", icon: Video },
  { value: "phone", label: "Phone call", icon: Phone },
  { value: "in_person", label: "In person", icon: MapPin },
];

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];

const COLORS = [
  "#0891b2", "#0ea5e9", "#8b5cf6", "#ec4899",
  "#f97316", "#eab308", "#22c55e", "#ef4444",
];

const DEFAULT_AVAILABILITY = [
  { dayOfWeek: 1, startTime: "09:00", endTime: "17:00", enabled: true },
  { dayOfWeek: 2, startTime: "09:00", endTime: "17:00", enabled: true },
  { dayOfWeek: 3, startTime: "09:00", endTime: "17:00", enabled: true },
  { dayOfWeek: 4, startTime: "09:00", endTime: "17:00", enabled: true },
  { dayOfWeek: 5, startTime: "09:00", endTime: "17:00", enabled: true },
  { dayOfWeek: 0, startTime: "09:00", endTime: "17:00", enabled: false },
  { dayOfWeek: 6, startTime: "09:00", endTime: "17:00", enabled: false },
];

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface MeetingTypeFormProps {
  userId: string;
  initialData?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    duration: number;
    color: string | null;
    bufferBefore: number;
    bufferAfter: number;
    minNotice: number;
    maxAdvance: number;
    locationType: string;
    locationValue: string | null;
    availability: {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }[];
  };
}

export default function MeetingTypeForm({ userId, initialData }: MeetingTypeFormProps) {
  const router = useRouter();
  const isEditing = !!initialData;

  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [duration, setDuration] = useState(initialData?.duration || 30);
  const [color, setColor] = useState(initialData?.color || "#0891b2");
  const [locationType, setLocationType] = useState(initialData?.locationType || "video");
  const [locationValue, setLocationValue] = useState(initialData?.locationValue || "");
  const [bufferBefore, setBufferBefore] = useState(initialData?.bufferBefore || 0);
  const [bufferAfter, setBufferAfter] = useState(initialData?.bufferAfter || 15);
  const [minNotice, setMinNotice] = useState(initialData?.minNotice || 240);
  const [maxAdvance, setMaxAdvance] = useState(initialData?.maxAdvance || 30);
  const [saving, setSaving] = useState(false);

  const [availability, setAvailability] = useState(() => {
    if (initialData?.availability) {
      return DEFAULT_AVAILABILITY.map((d) => {
        const match = initialData.availability.find((a) => a.dayOfWeek === d.dayOfWeek);
        return match
          ? { ...d, startTime: match.startTime, endTime: match.endTime, enabled: true }
          : d;
      });
    }
    return DEFAULT_AVAILABILITY;
  });

  const toggleDay = (dayOfWeek: number) => {
    setAvailability((prev) =>
      prev.map((a) => (a.dayOfWeek === dayOfWeek ? { ...a, enabled: !a.enabled } : a))
    );
  };

  const updateTime = (dayOfWeek: number, field: "startTime" | "endTime", value: string) => {
    setAvailability((prev) =>
      prev.map((a) => (a.dayOfWeek === dayOfWeek ? { ...a, [field]: value } : a))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const enabledAvailability = availability
        .filter((a) => a.enabled)
        .map(({ dayOfWeek, startTime, endTime }) => ({
          dayOfWeek,
          startTime,
          endTime,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }));

      if (isEditing) {
        // Update meeting type
        await fetch(`/api/meetings/types/${initialData.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            description,
            duration,
            color,
            locationType,
            locationValue: locationValue || null,
            bufferBefore,
            bufferAfter,
            minNotice,
            maxAdvance,
          }),
        });

        // Update availability
        await fetch(`/api/meetings/types/${initialData.id}/availability`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ availability: enabledAvailability }),
        });
      } else {
        // Create new meeting type
        const createRes = await fetch("/api/meetings/types", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            name,
            description,
            duration,
            color,
            locationType,
            locationValue: locationValue || null,
            bufferBefore,
            bufferAfter,
            minNotice,
            maxAdvance,
            createDefaultAvailability: false,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          }),
        });

        if (!createRes.ok) {
          const err = await createRes.json();
          alert(err.error || "Failed to create meeting type");
          return;
        }

        const created = await createRes.json();

        // Save custom availability
        if (enabledAvailability.length > 0) {
          await fetch(`/api/meetings/types/${created.id}/availability`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ availability: enabledAvailability }),
          });
        }
      }

      router.push("/meetings");
      router.refresh();
    } catch (error) {
      console.error("Error saving meeting type:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 pt-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/meetings"
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? "Edit Meeting Type" : "Create Meeting Type"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Info</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Product Demo"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this meeting type..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2] resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
              <div className="flex items-center gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full transition-all ${
                      color === c ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : ""
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Duration & Location */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Duration & Location</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
              <div className="flex flex-wrap gap-2">
                {DURATION_OPTIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDuration(d)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      duration === d
                        ? "bg-[#0891b2] text-white"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {d} min
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <div className="flex gap-3">
                {LOCATION_TYPES.map((loc) => {
                  const Icon = loc.icon;
                  return (
                    <button
                      key={loc.value}
                      type="button"
                      onClick={() => setLocationType(loc.value)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border ${
                        locationType === loc.value
                          ? "border-[#0891b2] bg-[#0891b2]/5 text-[#0891b2]"
                          : "border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {loc.label}
                    </button>
                  );
                })}
              </div>
            </div>
            {locationType === "in_person" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location Address</label>
                <input
                  type="text"
                  value={locationValue}
                  onChange={(e) => setLocationValue(e.target.value)}
                  placeholder="Enter the meeting address..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
                />
              </div>
            )}
          </div>
        </div>

        {/* Scheduling Settings */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Scheduling</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buffer before (min)</label>
              <input
                type="number"
                value={bufferBefore}
                onChange={(e) => setBufferBefore(parseInt(e.target.value) || 0)}
                min={0}
                max={60}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buffer after (min)</label>
              <input
                type="number"
                value={bufferAfter}
                onChange={(e) => setBufferAfter(parseInt(e.target.value) || 0)}
                min={0}
                max={60}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum notice (hours)</label>
              <input
                type="number"
                value={minNotice / 60}
                onChange={(e) => setMinNotice((parseInt(e.target.value) || 0) * 60)}
                min={0}
                max={72}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max advance booking (days)</label>
              <input
                type="number"
                value={maxAdvance}
                onChange={(e) => setMaxAdvance(parseInt(e.target.value) || 30)}
                min={1}
                max={365}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
              />
            </div>
          </div>
        </div>

        {/* Availability */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Availability</h2>
          <div className="space-y-3">
            {availability
              .sort((a, b) => {
                const order = [1, 2, 3, 4, 5, 6, 0];
                return order.indexOf(a.dayOfWeek) - order.indexOf(b.dayOfWeek);
              })
              .map((day) => (
                <div
                  key={day.dayOfWeek}
                  className={`flex items-center gap-4 p-3 rounded-lg ${
                    day.enabled ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  <label className="flex items-center gap-3 w-32">
                    <input
                      type="checkbox"
                      checked={day.enabled}
                      onChange={() => toggleDay(day.dayOfWeek)}
                      className="w-4 h-4 rounded border-gray-300 text-[#0891b2] focus:ring-[#0891b2]"
                    />
                    <span className={`text-sm font-medium ${day.enabled ? "text-gray-900" : "text-gray-400"}`}>
                      {DAY_LABELS[day.dayOfWeek]}
                    </span>
                  </label>
                  {day.enabled && (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={day.startTime}
                        onChange={(e) => updateTime(day.dayOfWeek, "startTime", e.target.value)}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
                      />
                      <span className="text-gray-400">-</span>
                      <input
                        type="time"
                        value={day.endTime}
                        onChange={(e) => updateTime(day.dayOfWeek, "endTime", e.target.value)}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
                      />
                    </div>
                  )}
                  {!day.enabled && (
                    <span className="text-sm text-gray-400">Unavailable</span>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/meetings"
            className="px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving || !name}
            className="px-6 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-[#0ea5e9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : isEditing ? "Save Changes" : "Create Meeting Type"}
          </button>
        </div>
      </form>
    </div>
  );
}
