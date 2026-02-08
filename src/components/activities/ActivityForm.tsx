"use client";

import { useState, useEffect } from "react";
import {
  X,
  Mail,
  Phone,
  CalendarDays,
  StickyNote,
  CheckSquare,
} from "lucide-react";

interface ActivityFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultType?: string;
  contactId?: string;
  companyId?: string;
  dealId?: string;
}

const TABS = [
  { type: "note", label: "Note", icon: StickyNote },
  { type: "email", label: "Email", icon: Mail },
  { type: "call", label: "Call", icon: Phone },
  { type: "meeting", label: "Meeting", icon: CalendarDays },
  { type: "task", label: "Task", icon: CheckSquare },
] as const;

export default function ActivityForm({
  isOpen,
  onClose,
  onSuccess,
  defaultType = "note",
  contactId,
  companyId,
  dealId,
}: ActivityFormProps) {
  const [activeType, setActiveType] = useState(defaultType);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Call fields
  const [callDirection, setCallDirection] = useState("outbound");
  const [callOutcome, setCallOutcome] = useState("connected");
  const [callDuration, setCallDuration] = useState("");

  // Meeting fields
  const [meetingStart, setMeetingStart] = useState("");
  const [meetingEnd, setMeetingEnd] = useState("");
  const [meetingLocation, setMeetingLocation] = useState("");

  // Email fields
  const [emailTo, setEmailTo] = useState("");
  const [emailCc, setEmailCc] = useState("");

  // Task fields
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("medium");

  useEffect(() => {
    if (isOpen) {
      setActiveType(defaultType);
      setSubject("");
      setBody("");
      setCallDirection("outbound");
      setCallOutcome("connected");
      setCallDuration("");
      setMeetingStart("");
      setMeetingEnd("");
      setMeetingLocation("");
      setEmailTo("");
      setEmailCc("");
      setDueDate("");
      setPriority("medium");
      setError(null);
    }
  }, [isOpen, defaultType]);

  const handleSubmit = async () => {
    if (activeType === "email" && !emailTo.trim()) {
      setError("Email recipient is required");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        type: activeType,
        subject: subject.trim() || null,
        body: body.trim() || null,
        contactId: contactId || null,
        companyId: companyId || null,
        dealId: dealId || null,
      };

      if (activeType === "call") {
        payload.callDirection = callDirection;
        payload.callOutcome = callOutcome;
        payload.callDuration = callDuration ? parseInt(callDuration) * 60 : null;
      }

      if (activeType === "meeting") {
        payload.meetingStart = meetingStart || null;
        payload.meetingEnd = meetingEnd || null;
        payload.meetingLocation = meetingLocation || null;
      }

      if (activeType === "email") {
        payload.emailTo = emailTo.trim();
        payload.emailCc = emailCc.trim() || null;
      }

      if (activeType === "task") {
        payload.dueDate = dueDate || null;
        payload.priority = priority;
      }

      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to create activity");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create activity");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      <div className="fixed right-0 top-0 h-full w-[480px] max-w-full bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Log Activity</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type Tabs */}
        <div className="flex border-b border-gray-200">
          {TABS.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors ${
                activeType === type
                  ? "text-cyan-700 border-b-2 border-cyan-600 bg-cyan-50/30"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {activeType === "note" ? "Title" : "Subject"}
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={
                activeType === "note"
                  ? "Note title..."
                  : activeType === "email"
                  ? "Email subject..."
                  : activeType === "call"
                  ? "Call with..."
                  : activeType === "meeting"
                  ? "Meeting about..."
                  : "Task description..."
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>

          {/* Type-specific fields */}
          {activeType === "email" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="recipient@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CC</label>
                <input
                  type="text"
                  value={emailCc}
                  onChange={(e) => setEmailCc(e.target.value)}
                  placeholder="cc@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
            </>
          )}

          {activeType === "call" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Direction</label>
                <select
                  value={callDirection}
                  onChange={(e) => setCallDirection(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  <option value="outbound">Outbound</option>
                  <option value="inbound">Inbound</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Outcome</label>
                <select
                  value={callOutcome}
                  onChange={(e) => setCallOutcome(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  <option value="connected">Connected</option>
                  <option value="left_voicemail">Left voicemail</option>
                  <option value="no_answer">No answer</option>
                  <option value="busy">Busy</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  value={callDuration}
                  onChange={(e) => setCallDuration(e.target.value)}
                  placeholder="5"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {activeType === "meeting" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start</label>
                  <input
                    type="datetime-local"
                    value={meetingStart}
                    onChange={(e) => setMeetingStart(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End</label>
                  <input
                    type="datetime-local"
                    value={meetingEnd}
                    onChange={(e) => setMeetingEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={meetingLocation}
                  onChange={(e) => setMeetingLocation(e.target.value)}
                  placeholder="Conference room / Zoom link..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
            </>
          )}

          {activeType === "task" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
          )}

          {/* Body / Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {activeType === "email" ? "Body" : "Notes"}
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={activeType === "note" ? 6 : 4}
              placeholder={
                activeType === "note"
                  ? "Write your note..."
                  : activeType === "email"
                  ? "Email body..."
                  : "Add any details..."
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 bg-[#0891b2] text-white rounded-md text-sm font-semibold hover:bg-[#0ea5e9] transition-colors disabled:opacity-50"
          >
            {submitting ? "Saving..." : `Log ${TABS.find((t) => t.type === activeType)?.label}`}
          </button>
        </div>
      </div>
    </>
  );
}
