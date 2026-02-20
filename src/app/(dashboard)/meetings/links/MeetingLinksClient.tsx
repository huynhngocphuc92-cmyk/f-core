"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Copy,
  ExternalLink,
  Trash2,
  Link2,
  Check,
} from "lucide-react";
import { createMeetingLink, deleteMeetingLink } from "@/app/actions/meetings";

interface MeetingLink {
  id: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  meetingType: {
    id: string;
    name: string;
    duration: number;
    color: string;
  };
  user: { id: string; name: string } | null;
}

interface MeetingType {
  id: string;
  name: string;
  duration: number;
  color: string;
}

interface MeetingLinksClientProps {
  links: MeetingLink[];
  meetingTypes: MeetingType[];
}

export function MeetingLinksClient({ links, meetingTypes }: MeetingLinksClientProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState("");

  const handleCreate = async () => {
    if (!selectedTypeId) return;
    setBusy("create");
    try {
      await createMeetingLink(selectedTypeId);
      setShowCreate(false);
      setSelectedTypeId("");
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deactivate this booking link?")) return;
    setBusy(id);
    try {
      await deleteMeetingLink(id);
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  const handleCopy = (slug: string, id: string) => {
    const url = `${window.location.origin}/book/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <>
      {/* Create New Link */}
      {showCreate ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Create New Booking Link</h3>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Meeting Type
              </label>
              <select
                value={selectedTypeId}
                onChange={(e) => setSelectedTypeId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#0891b2] focus:ring-2 focus:ring-cyan-100 outline-none transition-colors text-sm"
              >
                <option value="">Select a meeting type...</option>
                {meetingTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.duration} min)
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleCreate}
              disabled={!selectedTypeId || busy === "create"}
              className="px-4 py-2.5 bg-[#0891b2] text-white rounded-lg text-sm font-medium hover:bg-[#0e7490] transition-colors disabled:opacity-50"
            >
              {busy === "create" ? "Creating..." : "Create Link"}
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0891b2] text-white rounded-lg text-sm hover:bg-[#0e7490] transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Booking Link
          </button>
        </div>
      )}

      {/* Links List */}
      {links.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm text-center py-12">
          <Link2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-1">No booking links yet</p>
          <p className="text-sm text-gray-400">
            Create a booking link to share with contacts
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Meeting Type
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Link
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Owner
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Created
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {links.map((link) => (
                <tr key={link.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: link.meetingType.color }}
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {link.meetingType.name}
                        </p>
                        <p className="text-xs text-gray-500">{link.meetingType.duration} min</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <code className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                      /book/{link.slug}
                    </code>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm text-gray-700">
                      {link.user?.name || "Unassigned"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm text-gray-500">
                      {new Date(link.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleCopy(link.slug, link.id)}
                        className="p-1.5 text-gray-400 hover:text-[#0891b2] hover:bg-cyan-50 rounded-lg transition-colors"
                        title="Copy link"
                      >
                        {copiedId === link.id ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <a
                        href={`/book/${link.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-gray-400 hover:text-[#0891b2] hover:bg-cyan-50 rounded-lg transition-colors"
                        title="Preview"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => handleDelete(link.id)}
                        disabled={busy === link.id}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Deactivate"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
