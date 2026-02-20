import Link from "next/link";
import {
  ArrowLeft,
  Link2,
  Plus,
  Copy,
  ExternalLink,
  Trash2,
  Clock,
  User,
} from "lucide-react";
import { getMeetingLinks, getMeetingTypes } from "@/app/actions/meetings";
import { MeetingLinksClient } from "./MeetingLinksClient";

export const dynamic = "force-dynamic";

export default async function MeetingLinksPage() {
  const [links, meetingTypes] = await Promise.all([
    getMeetingLinks(),
    getMeetingTypes(),
  ]);

  const serializedLinks = links.map((link) => ({
    id: link.id,
    slug: link.slug,
    isActive: link.isActive,
    createdAt: link.createdAt.toISOString(),
    meetingType: {
      id: link.meetingType.id,
      name: link.meetingType.name,
      duration: link.meetingType.duration,
      color: link.meetingType.color,
    },
    user: link.user
      ? { id: link.user.id, name: link.user.name || link.user.email }
      : null,
  }));

  const serializedTypes = meetingTypes.map((t) => ({
    id: t.id,
    name: t.name,
    duration: t.duration,
    color: t.color,
  }));

  return (
    <div className="p-6 pt-8">
      <Link
        href="/meetings"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Meetings
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Booking Links</h1>
          <p className="text-gray-600 mt-1">
            Create and manage shareable booking links for your meetings
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{serializedLinks.length}</p>
              <p className="text-sm text-gray-500">Active Links</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{serializedTypes.length}</p>
              <p className="text-sm text-gray-500">Meeting Types</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(serializedLinks.map((l) => l.user?.id).filter(Boolean)).size}
              </p>
              <p className="text-sm text-gray-500">Team Members</p>
            </div>
          </div>
        </div>
      </div>

      <MeetingLinksClient links={serializedLinks} meetingTypes={serializedTypes} />
    </div>
  );
}
