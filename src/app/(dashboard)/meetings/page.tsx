import { Plus, Video, Clock, Users, ExternalLink, Calendar, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import prisma from "@/lib/prisma";

async function getMeetingTypes() {
  return prisma.meetingType.findMany({
    where: { deletedAt: null },
    include: {
      user: { select: { id: true, name: true, email: true } },
      availability: { where: { isActive: true }, orderBy: { dayOfWeek: "asc" } },
      _count: { select: { bookings: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function getUpcomingBookings() {
  return prisma.meetingBooking.findMany({
    where: {
      startTime: { gte: new Date() },
      status: "scheduled",
    },
    include: {
      meetingType: { select: { name: true, duration: true, color: true } },
      contact: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { startTime: "asc" },
    take: 10,
  });
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default async function MeetingsPage() {
  const [meetingTypes, upcomingBookings] = await Promise.all([
    getMeetingTypes(),
    getUpcomingBookings(),
  ]);

  return (
    <div className="p-6 pt-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
          <p className="text-gray-600 mt-1">
            {meetingTypes.length} meeting types &middot; {upcomingBookings.length} upcoming
          </p>
        </div>
        <Link
          href="/meetings/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-[#0ea5e9] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create meeting type
        </Link>
      </div>

      {/* Meeting Types Grid */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Meeting Types</h2>
        {meetingTypes.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Video className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No meeting types yet</h3>
            <p className="text-gray-500 mb-4">Create your first meeting type to start accepting bookings.</p>
            <Link
              href="/meetings/new"
              className="inline-flex items-center gap-2 text-[#0891b2] hover:text-[#0ea5e9] font-medium"
            >
              <Plus className="w-4 h-4" />
              Create meeting type
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {meetingTypes.map((mt) => {
              const availDays = mt.availability
                .map((a) => DAY_NAMES[a.dayOfWeek])
                .filter((v, i, arr) => arr.indexOf(v) === i);

              return (
                <div
                  key={mt.id}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
                >
                  {/* Color bar */}
                  <div
                    className="w-full h-1.5 rounded-full mb-4"
                    style={{ backgroundColor: mt.color || "#0891b2" }}
                  />

                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{mt.name}</h3>
                      {mt.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{mt.description}</p>
                      )}
                    </div>
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        mt.isActive
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {mt.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{mt.duration} min</span>
                      {mt.bufferAfter > 0 && (
                        <span className="text-gray-400">+ {mt.bufferAfter}min buffer</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Video className="w-4 h-4 text-gray-400" />
                      <span className="capitalize">{mt.locationType.replace("_", " ")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{availDays.length > 0 ? availDays.join(", ") : "No availability set"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>{mt._count.bookings} bookings</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <Link
                      href={`/meetings/${mt.id}`}
                      className="flex-1 text-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      Edit
                    </Link>
                    <button
                      className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-[#0891b2] bg-[#0891b2]/5 rounded-lg hover:bg-[#0891b2]/10 transition-colors"
                      title="Copy booking link"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Share
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upcoming Bookings */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Bookings</h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {upcomingBookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No upcoming bookings</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Meeting Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invitee
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="w-12 px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {upcomingBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">
                        {formatDate(booking.startTime)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: booking.meetingType.color || "#0891b2" }}
                        />
                        <span className="text-sm text-gray-900">{booking.meetingType.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">{booking.inviteeName}</div>
                      <div className="text-xs text-gray-500">{booking.inviteeEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {booking.contact
                        ? `${booking.contact.firstName} ${booking.contact.lastName}`
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-50 text-green-700">
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
