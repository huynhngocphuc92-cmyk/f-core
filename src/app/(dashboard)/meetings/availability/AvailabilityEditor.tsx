"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Check } from "lucide-react";
import { saveAvailability } from "@/app/actions/meetings";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

interface AvailabilitySlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  enabled: boolean;
}

export default function AvailabilityEditor({
  initial,
}: {
  initial: { dayOfWeek: number; startTime: string; endTime: string }[];
}) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  const initialMap = new Map(initial.map((s) => [s.dayOfWeek, s]));

  const [slots, setSlots] = useState<AvailabilitySlot[]>(
    DAYS.map((_, i) => {
      const existing = initialMap.get(i);
      return {
        dayOfWeek: i,
        startTime: existing?.startTime || "09:00",
        endTime: existing?.endTime || "17:00",
        enabled: !!existing,
      };
    })
  );

  function toggleDay(dayOfWeek: number) {
    setSlots((prev) =>
      prev.map((s) =>
        s.dayOfWeek === dayOfWeek ? { ...s, enabled: !s.enabled } : s
      )
    );
  }

  function updateSlot(
    dayOfWeek: number,
    field: "startTime" | "endTime",
    value: string
  ) {
    setSlots((prev) =>
      prev.map((s) =>
        s.dayOfWeek === dayOfWeek ? { ...s, [field]: value } : s
      )
    );
  }

  function handleSave() {
    const activeSlots = slots
      .filter((s) => s.enabled)
      .map((s) => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
      }));

    startTransition(async () => {
      await saveAvailability(activeSlots);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {slots.map((slot) => (
        <div
          key={slot.dayOfWeek}
          className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
            slot.enabled
              ? "border-gray-200 bg-white"
              : "border-gray-100 bg-gray-50"
          }`}
        >
          <label className="flex items-center gap-3 w-32 cursor-pointer">
            <input
              type="checkbox"
              checked={slot.enabled}
              onChange={() => toggleDay(slot.dayOfWeek)}
              className="w-4 h-4 rounded border-gray-300 text-[#0891b2] focus:ring-[#0891b2]"
            />
            <span
              className={`text-sm font-medium ${
                slot.enabled ? "text-gray-900" : "text-gray-400"
              }`}
            >
              {DAYS[slot.dayOfWeek]}
            </span>
          </label>

          {slot.enabled ? (
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={slot.startTime}
                onChange={(e) =>
                  updateSlot(slot.dayOfWeek, "startTime", e.target.value)
                }
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
              />
              <span className="text-gray-400 text-sm">to</span>
              <input
                type="time"
                value={slot.endTime}
                onChange={(e) =>
                  updateSlot(slot.dayOfWeek, "endTime", e.target.value)
                }
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
              />
            </div>
          ) : (
            <span className="text-sm text-gray-400">Unavailable</span>
          )}
        </div>
      ))}

      <div className="pt-4">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-[#0e7490] transition-colors text-sm disabled:opacity-50"
        >
          {saved ? (
            <>
              <Check className="w-4 h-4" />
              Saved
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {isPending ? "Saving..." : "Save Availability"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
