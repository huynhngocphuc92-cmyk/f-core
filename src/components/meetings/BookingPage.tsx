"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Clock, Video, Phone, MapPin, Check } from "lucide-react";

interface MeetingTypeData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  duration: number;
  color: string | null;
  locationType: string;
  minNotice: number;
  maxAdvance: number;
  user: { id: string; name: string | null; avatarUrl: string | null };
  availability: { dayOfWeek: number; startTime: string; endTime: string; timezone: string }[];
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

interface BookingPageProps {
  meetingType: MeetingTypeData;
  userId: string;
}

const LOCATION_ICONS: Record<string, typeof Video> = {
  video: Video,
  phone: Phone,
  in_person: MapPin,
};

function formatSlotTime(isoString: string, timezone: string) {
  return new Date(isoString).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: timezone,
  });
}

export default function BookingPage({ meetingType, userId }: BookingPageProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [step, setStep] = useState<"calendar" | "form" | "confirmed">("calendar");
  const [timezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone);

  // Form fields
  const [inviteeName, setInviteeName] = useState("");
  const [inviteeEmail, setInviteeEmail] = useState("");
  const [inviteeCompany, setInviteeCompany] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const brandColor = meetingType.color || "#0891b2";
  const LocationIcon = LOCATION_ICONS[meetingType.locationType] || Video;

  // Available days of week
  const availableDays = new Set(meetingType.availability.map((a) => a.dayOfWeek));

  // Fetch slots when date is selected
  const fetchSlots = useCallback(async (date: Date) => {
    setLoadingSlots(true);
    setSlots([]);
    setSelectedSlot(null);

    const dateStr = date.toISOString().split("T")[0];
    try {
      const res = await fetch(
        `/api/book/${userId}/${meetingType.slug}/slots?date=${dateStr}&timezone=${timezone}`
      );
      const data = await res.json();
      setSlots(data.data || []);
    } catch (error) {
      console.error("Error fetching slots:", error);
    } finally {
      setLoadingSlots(false);
    }
  }, [userId, meetingType.slug, timezone]);

  useEffect(() => {
    if (selectedDate) {
      fetchSlots(selectedDate);
    }
  }, [selectedDate, fetchSlots]);

  // Calendar generation
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay();
    const days: (Date | null)[] = [];

    for (let i = 0; i < startPad; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }

    return days;
  };

  const isDateAvailable = (date: Date) => {
    const now = new Date();
    const minNoticeDate = new Date(now.getTime() + meetingType.minNotice * 60000);
    const maxAdvanceDate = new Date(now.getTime() + meetingType.maxAdvance * 24 * 60 * 60 * 1000);

    if (date < new Date(now.getFullYear(), now.getMonth(), now.getDate())) return false;
    if (date < new Date(minNoticeDate.getFullYear(), minNoticeDate.getMonth(), minNoticeDate.getDate())) return false;
    if (date > maxAdvanceDate) return false;

    return availableDays.has(date.getDay());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/book/${userId}/${meetingType.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startTime: selectedSlot.startTime,
          timezone,
          inviteeName,
          inviteeEmail,
          inviteeCompany: inviteeCompany || undefined,
          notes: notes || undefined,
        }),
      });

      if (res.ok) {
        setStep("confirmed");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to book meeting");
      }
    } catch (error) {
      console.error("Error booking meeting:", error);
      alert("Failed to book meeting. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const days = getDaysInMonth(currentMonth);
  const monthLabel = currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // Confirmed state
  if (step === "confirmed") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: brandColor + "20" }}
          >
            <Check className="w-8 h-8" style={{ color: brandColor }} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirmed!</h2>
          <p className="text-gray-600 mb-6">
            Your {meetingType.name} with {meetingType.user.name || "the host"} has been scheduled.
          </p>
          {selectedSlot && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
              <div className="text-sm text-gray-600 space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>
                    {new Date(selectedSlot.startTime).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="ml-6">
                  {formatSlotTime(selectedSlot.startTime, timezone)} -{" "}
                  {formatSlotTime(selectedSlot.endTime, timezone)}
                </div>
                <div className="flex items-center gap-2">
                  <LocationIcon className="w-4 h-4 text-gray-400" />
                  <span className="capitalize">{meetingType.locationType.replace("_", " ")}</span>
                </div>
              </div>
            </div>
          )}
          <p className="text-sm text-gray-500">
            A confirmation email has been sent to {inviteeEmail}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden max-w-4xl w-full flex flex-col md:flex-row">
        {/* Left Panel - Meeting Info */}
        <div className="w-full md:w-72 p-6 border-b md:border-b-0 md:border-r border-gray-200">
          {/* Host */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
              style={{ backgroundColor: brandColor }}
            >
              {meetingType.user.name?.charAt(0) || "?"}
            </div>
            <div>
              <div className="text-sm text-gray-500">{meetingType.user.name}</div>
            </div>
          </div>

          {/* Meeting name */}
          <h1 className="text-xl font-bold text-gray-900 mb-2">{meetingType.name}</h1>
          {meetingType.description && (
            <p className="text-sm text-gray-600 mb-4">{meetingType.description}</p>
          )}

          {/* Details */}
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>{meetingType.duration} min</span>
            </div>
            <div className="flex items-center gap-2">
              <LocationIcon className="w-4 h-4 text-gray-400" />
              <span className="capitalize">{meetingType.locationType.replace("_", " ")}</span>
            </div>
          </div>

          {/* Selected date/time summary */}
          {selectedSlot && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="text-sm font-medium text-gray-900">
                {selectedDate?.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </div>
              <div className="text-sm text-gray-600">
                {formatSlotTime(selectedSlot.startTime, timezone)} -{" "}
                {formatSlotTime(selectedSlot.endTime, timezone)}
              </div>
              <div className="text-xs text-gray-400 mt-1">{timezone}</div>
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="flex-1 p-6">
          {step === "calendar" ? (
            <div className="flex flex-col md:flex-row gap-6">
              {/* Calendar */}
              <div className="flex-1">
                <h2 className="text-sm font-medium text-gray-900 mb-3">Select a Date</h2>
                {/* Month navigation */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={prevMonth}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm font-semibold text-gray-900">{monthLabel}</span>
                  <button
                    onClick={nextMonth}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                    <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Days */}
                <div className="grid grid-cols-7 gap-1">
                  {days.map((day, i) => {
                    if (!day) {
                      return <div key={`empty-${i}`} className="p-2" />;
                    }

                    const available = isDateAvailable(day);
                    const isSelected =
                      selectedDate &&
                      day.toDateString() === selectedDate.toDateString();
                    const isToday = day.toDateString() === new Date().toDateString();

                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => available && setSelectedDate(day)}
                        disabled={!available}
                        className={`p-2 text-sm rounded-lg transition-colors ${
                          isSelected
                            ? "text-white font-semibold"
                            : available
                            ? "text-gray-900 hover:bg-gray-100 font-medium"
                            : "text-gray-300 cursor-not-allowed"
                        } ${isToday && !isSelected ? "ring-1 ring-gray-300" : ""}`}
                        style={isSelected ? { backgroundColor: brandColor } : undefined}
                      >
                        {day.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots */}
              {selectedDate && (
                <div className="w-full md:w-48">
                  <h2 className="text-sm font-medium text-gray-900 mb-3">
                    {selectedDate.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </h2>
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {loadingSlots ? (
                      <div className="text-center py-8">
                        <div className="w-6 h-6 border-2 border-gray-200 border-t-[#0891b2] rounded-full animate-spin mx-auto" />
                      </div>
                    ) : slots.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No available slots</p>
                    ) : (
                      slots.map((slot) => {
                        const isSelected = selectedSlot?.startTime === slot.startTime;
                        return (
                          <button
                            key={slot.startTime}
                            onClick={() => {
                              setSelectedSlot(slot);
                              setStep("form");
                            }}
                            className={`w-full px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                              isSelected
                                ? "border-transparent text-white"
                                : "border-gray-200 hover:border-gray-400 text-gray-900"
                            }`}
                            style={isSelected ? { backgroundColor: brandColor } : undefined}
                          >
                            {formatSlotTime(slot.startTime, timezone)}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Booking Form */
            <div>
              <button
                onClick={() => setStep("calendar")}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Details</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={inviteeName}
                    onChange={(e) => setInviteeName(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={inviteeEmail}
                    onChange={(e) => setInviteeEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <input
                    type="text"
                    value={inviteeCompany}
                    onChange={(e) => setInviteeCompany(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes / Questions
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2] resize-none"
                    placeholder="Anything you'd like to discuss?"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting || !inviteeName || !inviteeEmail}
                  className="w-full px-6 py-2.5 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: brandColor }}
                >
                  {submitting ? "Scheduling..." : "Schedule Meeting"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
