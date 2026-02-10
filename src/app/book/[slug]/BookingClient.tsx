"use client";

import { useState, useTransition, useEffect } from "react";
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { getAvailableSlots, bookMeeting } from "@/app/actions/meetings";

interface BookingData {
  slug: string;
  meetingType: {
    name: string;
    duration: number;
    color: string;
    description: string | null;
    location: string | null;
  };
  user: {
    name: string | null;
    email: string;
    avatarUrl: string | null;
    availability: { dayOfWeek: number }[];
  };
  customMessage: string | null;
}

export default function BookingClient({ data }: { data: BookingData }) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [step, setStep] = useState<"date" | "form" | "confirmed">("date");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const availableDays = new Set(data.user.availability.map((a) => a.dayOfWeek));

  // Load slots when date is selected
  useEffect(() => {
    if (!selectedDate) return;
    setLoadingSlots(true);
    setSelectedTime(null);
    getAvailableSlots(data.slug, selectedDate).then((s) => {
      setSlots(s);
      setLoadingSlots(false);
    });
  }, [selectedDate, data.slug]);

  function handleBook(formData: FormData) {
    if (!selectedDate || !selectedTime) return;
    setError(null);
    startTransition(async () => {
      const result = await bookMeeting({
        linkSlug: data.slug,
        date: selectedDate,
        time: selectedTime,
        guestName: formData.get("name") as string,
        guestEmail: formData.get("email") as string,
        notes: (formData.get("notes") as string) || undefined,
      });
      if (result?.error) {
        setError(result.error);
      } else {
        setStep("confirmed");
      }
    });
  }

  // Calendar rendering
  const daysInMonth = new Date(
    currentMonth.year,
    currentMonth.month + 1,
    0
  ).getDate();
  const firstDayOfWeek = new Date(
    currentMonth.year,
    currentMonth.month,
    1
  ).getDay();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  function isDateAvailable(day: number) {
    const date = new Date(currentMonth.year, currentMonth.month, day);
    if (date < today) return false;
    return availableDays.has(date.getDay());
  }

  function selectDate(day: number) {
    const d = new Date(currentMonth.year, currentMonth.month, day);
    setSelectedDate(d.toISOString().split("T")[0]);
  }

  if (step === "confirmed") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Meeting Booked!
          </h2>
          <p className="text-gray-600 mb-4">
            Your {data.meetingType.name} with {data.user.name} has been
            scheduled.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 space-y-1">
            <p>
              <strong>Date:</strong>{" "}
              {selectedDate &&
                new Date(selectedDate + "T00:00:00").toLocaleDateString(
                  "en-US",
                  {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  }
                )}
            </p>
            <p>
              <strong>Time:</strong> {selectedTime}
            </p>
            <p>
              <strong>Duration:</strong> {data.meetingType.duration} minutes
            </p>
            {data.meetingType.location && (
              <p>
                <strong>Location:</strong> {data.meetingType.location}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden max-w-3xl w-full">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr]">
          {/* Left panel - Meeting info */}
          <div className="p-6 border-b md:border-b-0 md:border-r border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: data.meetingType.color }}
              >
                {(data.user.name || "U")[0]}
              </div>
              <div>
                <p className="text-sm text-gray-500">{data.user.name}</p>
              </div>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {data.meetingType.name}
            </h2>

            <div className="space-y-2 text-sm text-gray-600">
              <p className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                {data.meetingType.duration} minutes
              </p>
              {data.meetingType.location && (
                <p className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {data.meetingType.location}
                </p>
              )}
            </div>

            {data.meetingType.description && (
              <p className="text-sm text-gray-500 mt-4">
                {data.meetingType.description}
              </p>
            )}

            {data.customMessage && (
              <p className="text-sm text-gray-500 mt-4 italic">
                {data.customMessage}
              </p>
            )}
          </div>

          {/* Right panel */}
          <div className="p-6">
            {step === "date" ? (
              <>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Select a Date & Time
                </h3>

                {/* Calendar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={() =>
                        setCurrentMonth((prev) => {
                          const d = new Date(prev.year, prev.month - 1, 1);
                          return {
                            year: d.getFullYear(),
                            month: d.getMonth(),
                          };
                        })
                      }
                      className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(
                        currentMonth.year,
                        currentMonth.month
                      ).toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentMonth((prev) => {
                          const d = new Date(prev.year, prev.month + 1, 1);
                          return {
                            year: d.getFullYear(),
                            month: d.getMonth(),
                          };
                        })
                      }
                      className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center">
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                      <div
                        key={d}
                        className="text-xs font-medium text-gray-400 py-1"
                      >
                        {d}
                      </div>
                    ))}
                    {calendarDays.map((day, i) => {
                      if (day === null)
                        return <div key={`empty-${i}`} />;
                      const available = isDateAvailable(day);
                      const dateStr = new Date(
                        currentMonth.year,
                        currentMonth.month,
                        day
                      )
                        .toISOString()
                        .split("T")[0];
                      const isSelected = selectedDate === dateStr;
                      return (
                        <button
                          key={day}
                          onClick={() => available && selectDate(day)}
                          disabled={!available}
                          className={`w-9 h-9 rounded-full text-sm transition-colors ${
                            isSelected
                              ? "bg-[#0891b2] text-white"
                              : available
                                ? "text-gray-900 hover:bg-[#0891b2]/10"
                                : "text-gray-300 cursor-not-allowed"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time slots */}
                {selectedDate && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                      Available Times
                    </h4>
                    {loadingSlots ? (
                      <p className="text-sm text-gray-400">Loading...</p>
                    ) : slots.length === 0 ? (
                      <p className="text-sm text-gray-400">
                        No available slots for this day
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                        {slots.map((time) => (
                          <button
                            key={time}
                            onClick={() => {
                              setSelectedTime(time);
                              setStep("form");
                            }}
                            className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                              selectedTime === time
                                ? "border-[#0891b2] bg-[#0891b2]/10 text-[#0891b2] font-medium"
                                : "border-gray-200 text-gray-700 hover:border-[#0891b2] hover:bg-[#0891b2]/5"
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => setStep("date")}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#0891b2] mb-4"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>

                <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
                  <p className="font-medium text-gray-900">
                    {selectedDate &&
                      new Date(
                        selectedDate + "T00:00:00"
                      ).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })}
                  </p>
                  <p className="text-gray-600">
                    {selectedTime} - {data.meetingType.duration} min
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-4">
                    {error}
                  </div>
                )}

                <form action={handleBook} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="name"
                      required
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="email"
                      type="email"
                      required
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      name="notes"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2] resize-none"
                      placeholder="Any additional information..."
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full py-2.5 bg-[#0891b2] text-white rounded-lg font-medium text-sm hover:bg-[#0e7490] transition-colors disabled:opacity-50"
                  >
                    {isPending ? "Booking..." : "Confirm Booking"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
