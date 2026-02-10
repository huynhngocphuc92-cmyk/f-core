import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  FileText,
  CheckSquare,
  MapPin,
  Briefcase,
  User,
  Clock,
  Edit,
  Trash2,
  Plus,
} from "lucide-react";

export const dynamic = "force-dynamic";

function getActivityIcon(type: string) {
  switch (type) {
    case "email":
      return <Mail className="w-4 h-4" />;
    case "call":
      return <Phone className="w-4 h-4" />;
    case "meeting":
      return <Calendar className="w-4 h-4" />;
    case "note":
      return <FileText className="w-4 h-4" />;
    case "task":
      return <CheckSquare className="w-4 h-4" />;
    default:
      return <FileText className="w-4 h-4" />;
  }
}

function getActivityIconBg(type: string) {
  switch (type) {
    case "email":
      return "bg-blue-100 text-blue-600";
    case "call":
      return "bg-green-100 text-green-600";
    case "meeting":
      return "bg-purple-100 text-purple-600";
    case "note":
      return "bg-yellow-100 text-yellow-600";
    case "task":
      return "bg-orange-100 text-orange-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

function getLifecycleStageBadge(stage: string | null) {
  const stageValue = stage || "subscriber";
  const styles: Record<string, string> = {
    subscriber: "bg-gray-50 text-gray-700",
    lead: "bg-blue-50 text-blue-700",
    mql: "bg-purple-50 text-purple-700",
    sql: "bg-orange-50 text-orange-700",
    opportunity: "bg-cyan-50 text-cyan-700",
    customer: "bg-green-50 text-green-700",
    evangelist: "bg-pink-50 text-pink-700",
  };

  return (
    <span
      className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
        styles[stageValue] || styles.subscriber
      }`}
    >
      {stageValue}
    </span>
  );
}

function truncate(text: string | null, maxLength: number) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);

  let contact;
  try {
    contact = await prisma.contact.findFirst({
      where: { id: decodedId, deletedAt: null },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            owner: {
              select: { name: true },
            },
          },
        },
        companies: {
          include: {
            company: {
              select: { id: true, name: true, domain: true },
            },
          },
        },
      },
    });
  } catch (error) {
    console.error("Contact detail query error:", error);
    notFound();
  }

  if (!contact) {
    notFound();
  }

  const fullName =
    [contact.firstName, contact.lastName].filter(Boolean).join(" ") ||
    "Unnamed Contact";

  const initials = [
    contact.firstName?.charAt(0) || "",
    contact.lastName?.charAt(0) || "",
  ]
    .join("")
    .toUpperCase() || "?";

  return (
    <div className="p-6 pt-8">
      {/* Back Link */}
      <Link
        href="/contacts"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#0891b2] transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Contacts
      </Link>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Header Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#0891b2] flex items-center justify-center text-white font-semibold text-xl">
                {initials}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
                {contact.email && (
                  <p className="text-gray-500 mt-0.5">{contact.email}</p>
                )}
                <div className="mt-2">
                  {getLifecycleStageBadge(contact.lifecycleStage)}
                </div>
              </div>
            </div>
          </div>

          {/* Properties Section */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Properties
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Email
                  </p>
                  <p className="text-sm text-gray-900">
                    {contact.email || "-"}
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Phone
                  </p>
                  <p className="text-sm text-gray-900">
                    {contact.phone || "-"}
                  </p>
                </div>
              </div>

              {/* Job Title */}
              <div className="flex items-start gap-3">
                <Briefcase className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Job Title
                  </p>
                  <p className="text-sm text-gray-900">
                    {contact.jobTitle || "-"}
                  </p>
                </div>
              </div>

              {/* Lifecycle Stage */}
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Lifecycle Stage
                  </p>
                  <p className="text-sm text-gray-900">
                    {contact.lifecycleStage || "subscriber"}
                  </p>
                </div>
              </div>

              {/* Lead Status */}
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Lead Status
                  </p>
                  <p className="text-sm text-gray-900">
                    {contact.leadStatus || "-"}
                  </p>
                </div>
              </div>

              {/* Source */}
              <div className="flex items-start gap-3">
                <FileText className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Source
                  </p>
                  <p className="text-sm text-gray-900">
                    {(contact.properties as Record<string, string>)?.source ||
                      "-"}
                  </p>
                </div>
              </div>

              {/* City */}
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    City
                  </p>
                  <p className="text-sm text-gray-900">
                    {contact.city || "-"}
                  </p>
                </div>
              </div>

              {/* State */}
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    State
                  </p>
                  <p className="text-sm text-gray-900">
                    {contact.state || "-"}
                  </p>
                </div>
              </div>

              {/* Country */}
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Country
                  </p>
                  <p className="text-sm text-gray-900">
                    {contact.country || "-"}
                  </p>
                </div>
              </div>

              {/* Created */}
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Created
                  </p>
                  <p className="text-sm text-gray-900">
                    {new Date(contact.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Timeline Section */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Activity Timeline
            </h2>

            {contact.activities.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No activities yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {contact.activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {/* Activity Icon */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${getActivityIconBg(
                        activity.type
                      )}`}
                    >
                      {getActivityIcon(activity.type)}
                    </div>

                    {/* Activity Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.subject || `${activity.type} activity`}
                        </p>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {new Date(activity.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {activity.body && (
                        <p className="text-sm text-gray-500 mt-0.5">
                          {truncate(activity.body, 100)}
                        </p>
                      )}
                      {activity.owner?.name && (
                        <p className="text-xs text-gray-400 mt-1">
                          by {activity.owner.name}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          {/* About Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
              About
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Owner</p>
                <p className="text-sm text-gray-900 mt-0.5">
                  {contact.owner?.name || "Unassigned"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Created</p>
                <p className="text-sm text-gray-900 mt-0.5">
                  {new Date(contact.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Last Updated</p>
                <p className="text-sm text-gray-900 mt-0.5">
                  {new Date(contact.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Associated Companies Card */}
          {contact.companies.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
                Companies
              </h3>
              <div className="space-y-2">
                {contact.companies.map((cc) => (
                  <div
                    key={cc.companyId}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Briefcase className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">{cc.company.name}</span>
                    {cc.isPrimary && (
                      <span className="text-xs bg-[#0891b2]/10 text-[#0891b2] px-1.5 py-0.5 rounded">
                        Primary
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
              Actions
            </h3>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 bg-white border border-gray-200 rounded-lg hover:bg-red-50 transition-colors">
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
              <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-white bg-[#0891b2] rounded-lg hover:bg-[#0e7490] transition-colors">
                <Plus className="w-4 h-4" />
                Create activity
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
