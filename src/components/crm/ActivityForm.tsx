"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  X,
  FileText,
  Mail,
  Phone,
  Calendar,
  CheckSquare,
} from "lucide-react";
import { createActivity } from "@/app/actions/crm";

const activityTypes = [
  { value: "note", label: "Note", icon: FileText, color: "bg-yellow-100 text-yellow-600" },
  { value: "email", label: "Email", icon: Mail, color: "bg-blue-100 text-blue-600" },
  { value: "call", label: "Call", icon: Phone, color: "bg-green-100 text-green-600" },
  { value: "meeting", label: "Meeting", icon: Calendar, color: "bg-purple-100 text-purple-600" },
  { value: "task", label: "Task", icon: CheckSquare, color: "bg-orange-100 text-orange-600" },
] as const;

export default function ActivityForm({
  contactId,
  companyId,
  dealId,
}: {
  contactId?: string;
  companyId?: string;
  dealId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string>("note");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await createActivity(formData);
    if (result?.error) {
      setError(result.error);
      setPending(false);
    } else {
      setPending(false);
      setOpen(false);
      formRef.current?.reset();
      setType("note");
      router.refresh();
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-white bg-[#0891b2] rounded-lg hover:bg-[#0e7490] transition-colors"
      >
        <Plus className="w-4 h-4" />
        Create activity
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Log Activity
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <form ref={formRef} action={handleSubmit} className="p-6 space-y-4">
              {contactId && <input type="hidden" name="contactId" value={contactId} />}
              {companyId && <input type="hidden" name="companyId" value={companyId} />}
              {dealId && <input type="hidden" name="dealId" value={dealId} />}
              <input type="hidden" name="type" value={type} />

              {/* Type Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activity Type
                </label>
                <div className="flex gap-2">
                  {activityTypes.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        type === t.value
                          ? t.color + " ring-2 ring-offset-1 ring-gray-300"
                          : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      <t.icon className="w-3.5 h-3.5" />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  name="subject"
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
                  placeholder={
                    type === "note" ? "Meeting notes" :
                    type === "email" ? "Follow-up email" :
                    type === "call" ? "Discovery call" :
                    type === "meeting" ? "Product demo" :
                    "Send proposal"
                  }
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {type === "email" ? "Email Body" : "Details"}
                </label>
                <textarea
                  name="body"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2] resize-none"
                  placeholder="Add details..."
                />
              </div>

              {/* Email-specific fields */}
              {type === "email" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                    <input name="emailTo" type="email" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]" placeholder="recipient@example.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CC</label>
                    <input name="emailCc" type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]" placeholder="cc@example.com" />
                  </div>
                </div>
              )}

              {/* Call-specific fields */}
              {type === "call" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Direction</label>
                    <select name="callDirection" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2] bg-white">
                      <option value="outbound">Outbound</option>
                      <option value="inbound">Inbound</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Outcome</label>
                    <select name="callOutcome" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2] bg-white">
                      <option value="">Select...</option>
                      <option value="connected">Connected</option>
                      <option value="left_voicemail">Left Voicemail</option>
                      <option value="no_answer">No Answer</option>
                      <option value="busy">Busy</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
                    <input name="callDuration" type="number" min="0" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]" placeholder="30" />
                  </div>
                </div>
              )}

              {/* Meeting-specific fields */}
              {type === "meeting" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start</label>
                      <input name="meetingStart" type="datetime-local" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End</label>
                      <input name="meetingEnd" type="datetime-local" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input name="meetingLocation" type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]" placeholder="Conference Room / Zoom link" />
                  </div>
                </div>
              )}

              {/* Task-specific fields */}
              {type === "task" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                    <input name="dueDate" type="date" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select name="priority" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2] bg-white">
                      <option value="">None</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#0891b2] rounded-lg hover:bg-[#0e7490] transition-colors disabled:opacity-50"
                >
                  {pending ? "Saving..." : "Log Activity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
