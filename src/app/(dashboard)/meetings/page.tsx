import Link from "next/link";
import {
  Calendar,
  Clock,
  Link2,
  Plus,
  Settings,
  User,
  MapPin,
  Search,
} from "lucide-react";
import { getMeetings, getMeetingTypes, getMeetingLinks } from "@/app/actions/meetings";

export const dynamic = "force-dynamic";

function getStatusColor(start: Date | null) {
  if (!start) return "bg-gray-100 text-gray-600";
  const now = new Date();
  if (start > now) return "bg-blue-50 text-blue-600";
  return "bg-green-50 text-green-600";
}

function getStatusLabel(start: Date | null) {
  if (!start) return "No time";
  const now = new Date();
  if (start > now) return "Upcoming";
  return "Completed";
}

export default async function MeetingsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;
  const [meetings, meetingTypes, meetingLinks] = await Promise.all([
    getMeetings(search),
    getMeetingTypes(),
    getMeetingLinks(),
  ]);

  return (
    <div className="p-6 pt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
          <p className="text-gray-600 mt-1">
            Schedule and manage your meetings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/meetings/availability"
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700"
          >
            <Settings className="w-4 h-4" />
            Availability
          </Link>
          <Link
            href="/meetings/types"
            className="flex items-center gap-2 px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-[#0e7490] transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Meeting Types
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{meetings.length}</p>
              <p className="text-sm text-gray-500">Total Meetings</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{meetingTypes.length}</p>
              <p className="text-sm text-gray-500">Meeting Types</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{meetingLinks.length}</p>
              <p className="text-sm text-gray-500">Booking Links</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Booking Links */}
      {meetingLinks.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Active Booking Links
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {meetingLinks.map((link) => (
              <div key={link.id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: link.meetingType.color }}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {link.meetingType.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {link.meetingType.duration} min
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <code className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                    /book/{link.slug}
                  </code>
                  <Link
                    href={`/book/${link.slug}`}
                    className="text-xs text-[#0891b2] hover:underline"
                  >
                    Preview
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <form className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            name="search"
            type="text"
            defaultValue={search || ""}
            placeholder="Search meetings..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
          />
        </div>
      </form>

      {/* Meetings List */}
      {meetings.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm text-center py-12">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-1">No meetings yet</p>
          <p className="text-sm text-gray-400">
            Create a meeting type and share your booking link
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Meeting
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Date & Time
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Contact
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Location
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {meetings.map((meeting) => (
                <tr key={meeting.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium text-gray-900">
                      {meeting.subject || "(no subject)"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {meeting.owner?.name || "Unassigned"}
                    </p>
                  </td>
                  <td className="px-5 py-3">
                    {meeting.meetingStart ? (
                      <div>
                        <p className="text-sm text-gray-900">
                          {new Date(meeting.meetingStart).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(meeting.meetingStart).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {meeting.meetingEnd && (
                            <>
                              {" - "}
                              {new Date(meeting.meetingEnd).toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </>
                          )}
                        </p>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Not scheduled</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {meeting.contact ? (
                      <Link
                        href={`/contacts/${meeting.contact.id}`}
                        className="flex items-center gap-2 text-sm text-gray-700 hover:text-[#0891b2]"
                      >
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        {[meeting.contact.firstName, meeting.contact.lastName]
                          .filter(Boolean)
                          .join(" ")}
                      </Link>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {meeting.meetingLocation ? (
                      <span className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        {meeting.meetingLocation}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(meeting.meetingStart)}`}
                    >
                      {getStatusLabel(meeting.meetingStart)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
