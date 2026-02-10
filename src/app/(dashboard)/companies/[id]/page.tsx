import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import {
  ArrowLeft,
  Building2,
  Globe,
  Phone,
  MapPin,
  Users,
  Briefcase,
  Clock,
  Edit,
  Mail,
  FileText,
  Calendar,
  CheckSquare,
  CircleDollarSign,
  ExternalLink,
} from "lucide-react";
import DeleteButton from "@/components/crm/DeleteButton";
import ActivityForm from "@/components/crm/ActivityForm";

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

function formatCurrency(amount: number | null): string {
  if (amount === null) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function truncate(text: string | null, maxLength: number) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);

  let company;
  try {
    company = await prisma.company.findFirst({
      where: { id: decodedId, deletedAt: null },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        contacts: {
          include: {
            contact: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                jobTitle: true,
              },
            },
          },
        },
        deals: {
          include: {
            deal: {
              select: {
                id: true,
                name: true,
                amount: true,
                stage: { select: { name: true, color: true } },
              },
            },
          },
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            owner: { select: { name: true } },
          },
        },
      },
    });
  } catch (error) {
    console.error("Company detail query error:", error);
    notFound();
  }

  if (!company) {
    notFound();
  }

  const initial = company.name?.charAt(0)?.toUpperCase() || "?";

  return (
    <div className="p-6 pt-8">
      {/* Back Link */}
      <Link
        href="/companies"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#0891b2] transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Companies
      </Link>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Header Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-[#0891b2] flex items-center justify-center text-white font-semibold text-xl">
                {initial}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {company.name}
                </h1>
                {company.domain && (
                  <p className="text-gray-500 mt-0.5 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5" />
                    {company.domain}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  {company.industry && (
                    <span className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700">
                      {company.industry}
                    </span>
                  )}
                  {company.type && (
                    <span className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-purple-50 text-purple-700">
                      {company.type}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {company.description && (
              <p className="text-sm text-gray-600 mt-4">
                {company.description}
              </p>
            )}
          </div>

          {/* Properties Section */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Properties
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Globe className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Domain
                  </p>
                  <p className="text-sm text-gray-900">
                    {company.domain || "-"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Briefcase className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Industry
                  </p>
                  <p className="text-sm text-gray-900">
                    {company.industry || "-"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Building2 className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Type
                  </p>
                  <p className="text-sm text-gray-900">
                    {company.type || "-"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Company Size
                  </p>
                  <p className="text-sm text-gray-900">
                    {company.size ? `${company.size} employees` : "-"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CircleDollarSign className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Annual Revenue
                  </p>
                  <p className="text-sm text-gray-900">
                    {company.annualRevenue
                      ? formatCurrency(Number(company.annualRevenue))
                      : "-"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Phone
                  </p>
                  <p className="text-sm text-gray-900">
                    {company.phone || "-"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <ExternalLink className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Website
                  </p>
                  <p className="text-sm text-gray-900">
                    {company.website || "-"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Location
                  </p>
                  <p className="text-sm text-gray-900">
                    {[company.city, company.state, company.country]
                      .filter(Boolean)
                      .join(", ") || "-"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Created
                  </p>
                  <p className="text-sm text-gray-900">
                    {new Date(company.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Activity Timeline
            </h2>

            {company.activities.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No activities yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {company.activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${getActivityIconBg(
                        activity.type
                      )}`}
                    >
                      {getActivityIcon(activity.type)}
                    </div>
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
                  {company.owner?.name || "Unassigned"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Lifecycle Stage</p>
                <p className="text-sm text-gray-900 mt-0.5">
                  {company.lifecycleStage || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Created</p>
                <p className="text-sm text-gray-900 mt-0.5">
                  {new Date(company.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Last Updated</p>
                <p className="text-sm text-gray-900 mt-0.5">
                  {new Date(company.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Associated Contacts */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
              Contacts ({company.contacts.length})
            </h3>
            {company.contacts.length === 0 ? (
              <p className="text-sm text-gray-500">No contacts associated</p>
            ) : (
              <div className="space-y-3">
                {company.contacts.map((cc) => {
                  const contactName =
                    [cc.contact.firstName, cc.contact.lastName]
                      .filter(Boolean)
                      .join(" ") || "Unnamed";
                  const initials =
                    [
                      cc.contact.firstName?.charAt(0) || "",
                      cc.contact.lastName?.charAt(0) || "",
                    ]
                      .join("")
                      .toUpperCase() || "?";
                  return (
                    <Link
                      key={cc.contactId}
                      href={`/contacts/${cc.contactId}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#0891b2] flex items-center justify-center text-white text-xs font-medium">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {contactName}
                        </p>
                        {cc.contact.jobTitle && (
                          <p className="text-xs text-gray-500 truncate">
                            {cc.contact.jobTitle}
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Associated Deals */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
              Deals ({company.deals.length})
            </h3>
            {company.deals.length === 0 ? (
              <p className="text-sm text-gray-500">No deals associated</p>
            ) : (
              <div className="space-y-3">
                {company.deals.map((dc) => (
                  <Link
                    key={dc.dealId}
                    href={`/deals/${dc.dealId}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <CircleDollarSign className="w-5 h-5 text-[#0891b2] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {dc.deal.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {dc.deal.amount
                            ? formatCurrency(Number(dc.deal.amount))
                            : "$0"}
                        </span>
                        {dc.deal.stage && (
                          <span
                            className="inline-flex items-center gap-1 text-xs font-medium"
                            style={{ color: dc.deal.stage.color || "#6b7280" }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{
                                backgroundColor:
                                  dc.deal.stage.color || "#6b7280",
                              }}
                            />
                            {dc.deal.stage.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Actions Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
              Actions
            </h3>
            <div className="space-y-2">
              <Link
                href={`/companies/${company.id}/edit`}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Link>
              <DeleteButton id={company.id} entityType="company" entityName={company.name} />
              <ActivityForm companyId={company.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
