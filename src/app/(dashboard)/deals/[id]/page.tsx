import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import {
  ArrowLeft,
  CircleDollarSign,
  Calendar,
  Users,
  Building2,
  Clock,
  Edit,
  Mail,
  Phone,
  FileText,
  CheckSquare,
  Flag,
  Briefcase,
  TrendingUp,
} from "lucide-react";
import DeleteButton from "@/components/crm/DeleteButton";
import ActivityForm from "@/components/crm/ActivityForm";
import AssociationPicker, { RemoveAssociationButton } from "@/components/crm/AssociationPicker";
import CustomProperties from "@/components/crm/CustomProperties";
import {
  searchContacts,
  searchCompanies,
  addContactToDeal,
  removeContactFromDeal,
  addCompanyToDeal,
  removeCompanyFromDeal,
} from "@/app/actions/crm";
import { getPropertyDefinitions } from "@/app/actions/properties";

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

function formatCurrency(amount: number | null, currency = "USD"): string {
  if (amount === null) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function truncate(text: string | null, maxLength: number) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

function getPriorityStyles(priority: string | null) {
  switch (priority) {
    case "high":
      return { bg: "bg-red-50", text: "text-red-700", label: "High" };
    case "medium":
      return { bg: "bg-amber-50", text: "text-amber-700", label: "Medium" };
    case "low":
      return { bg: "bg-green-50", text: "text-green-700", label: "Low" };
    default:
      return null;
  }
}

interface StageInfo {
  id: string;
  name: string;
  orderIndex: number;
  probability: number;
  color: string | null;
  isClosed: boolean;
  isWon: boolean;
}

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);

  let deal;
  let allStages: StageInfo[] = [];
  try {
    deal = await prisma.deal.findFirst({
      where: { id: decodedId, deletedAt: null },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        pipeline: {
          select: { id: true, name: true },
        },
        stage: {
          select: {
            id: true,
            name: true,
            orderIndex: true,
            probability: true,
            color: true,
            isClosed: true,
            isWon: true,
          },
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
        companies: {
          include: {
            company: {
              select: { id: true, name: true, domain: true },
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

    if (deal) {
      allStages = await prisma.pipelineStage.findMany({
        where: { pipelineId: deal.pipelineId },
        orderBy: { orderIndex: "asc" },
        select: {
          id: true,
          name: true,
          orderIndex: true,
          probability: true,
          color: true,
          isClosed: true,
          isWon: true,
        },
      });
    }
  } catch (error) {
    console.error("Deal detail query error:", error);
    notFound();
  }

  if (!deal) {
    notFound();
  }

  const customPropertyDefs = (await getPropertyDefinitions("deal")).filter(
    (p) => !p.isSystem
  );

  const priority = getPriorityStyles(deal.priority);
  const currentStageIndex = allStages.findIndex((s) => s.id === deal.stageId);
  const openStages = allStages.filter((s) => !s.isClosed);
  const closedStages = allStages.filter((s) => s.isClosed);

  return (
    <div className="p-6 pt-8">
      {/* Back Link */}
      <Link
        href="/deals"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#0891b2] transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Deals
      </Link>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Deal Header Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {deal.name}
                </h1>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xl font-semibold text-[#0891b2]">
                    {formatCurrency(
                      deal.amount ? Number(deal.amount) : null,
                      deal.currency
                    )}
                  </span>
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `${deal.stage.color || "#6b7280"}15`,
                      color: deal.stage.color || "#6b7280",
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor: deal.stage.color || "#6b7280",
                      }}
                    />
                    {deal.stage.name}
                  </span>
                  {priority && (
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${priority.bg} ${priority.text}`}
                    >
                      {priority.label} Priority
                    </span>
                  )}
                </div>
              </div>
            </div>

            {deal.description && (
              <p className="text-sm text-gray-600 mt-4">{deal.description}</p>
            )}

            {/* Stage Progress Bar */}
            <div className="mt-6">
              <div className="flex items-center gap-1">
                {openStages.map((stage, idx) => {
                  const isActive = stage.id === deal.stageId;
                  const isPassed = stage.orderIndex < deal.stage.orderIndex;
                  return (
                    <div key={stage.id} className="flex-1 relative group">
                      <div
                        className={`h-2 rounded-full transition-colors ${
                          isPassed || isActive
                            ? ""
                            : "bg-gray-200"
                        }`}
                        style={
                          isPassed || isActive
                            ? {
                                backgroundColor:
                                  stage.color || "#0891b2",
                              }
                            : undefined
                        }
                      />
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                        <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                          {stage.name} ({stage.probability}%)
                        </div>
                      </div>
                    </div>
                  );
                })}
                {/* Closed stages indicators */}
                {closedStages.map((stage) => {
                  const isActive = stage.id === deal.stageId;
                  return (
                    <div key={stage.id} className="relative group">
                      <div
                        className={`w-6 h-2 rounded-full ${
                          isActive ? "" : "bg-gray-200"
                        }`}
                        style={
                          isActive
                            ? {
                                backgroundColor:
                                  stage.color || "#6b7280",
                              }
                            : undefined
                        }
                      />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                        <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                          {stage.name}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-400">
                  {openStages[0]?.name}
                </span>
                <span className="text-xs text-gray-400">
                  {openStages[openStages.length - 1]?.name}
                </span>
              </div>
            </div>
          </div>

          {/* Properties Section */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Properties
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <CircleDollarSign className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Amount
                  </p>
                  <p className="text-sm text-gray-900">
                    {formatCurrency(
                      deal.amount ? Number(deal.amount) : null,
                      deal.currency
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Close Date
                  </p>
                  <p className="text-sm text-gray-900">
                    {deal.closeDate
                      ? new Date(deal.closeDate).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "-"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <TrendingUp className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Pipeline
                  </p>
                  <p className="text-sm text-gray-900">
                    {deal.pipeline.name}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <TrendingUp className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Stage
                  </p>
                  <p className="text-sm text-gray-900">{deal.stage.name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Flag className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Priority
                  </p>
                  <p className="text-sm text-gray-900">
                    {deal.priority || "-"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Briefcase className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Deal Type
                  </p>
                  <p className="text-sm text-gray-900">
                    {deal.dealType || "-"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <TrendingUp className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Win Probability
                  </p>
                  <p className="text-sm text-gray-900">
                    {deal.stage.probability}%
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
                    {new Date(deal.createdAt).toLocaleDateString()}
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

            {deal.activities.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No activities yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {deal.activities.map((activity) => (
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
                  {deal.owner?.name || "Unassigned"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Pipeline</p>
                <p className="text-sm text-gray-900 mt-0.5">
                  {deal.pipeline.name}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Win Probability</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${deal.stage.probability}%`,
                        backgroundColor: deal.stage.color || "#0891b2",
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {deal.stage.probability}%
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">Created</p>
                <p className="text-sm text-gray-900 mt-0.5">
                  {new Date(deal.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Last Updated</p>
                <p className="text-sm text-gray-900 mt-0.5">
                  {new Date(deal.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Associated Contacts */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Contacts ({deal.contacts.length})
              </h3>
              <AssociationPicker
                associationType="contact"
                existingIds={deal.contacts.map((dc) => dc.contactId)}
                searchAction={searchContacts}
                addAction={async (contactId: string) => {
                  "use server";
                  return addContactToDeal(deal.id, contactId);
                }}
              />
            </div>
            {deal.contacts.length === 0 ? (
              <p className="text-sm text-gray-500">No contacts associated</p>
            ) : (
              <div className="space-y-3">
                {deal.contacts.map((dc) => {
                  const contactName =
                    [dc.contact.firstName, dc.contact.lastName]
                      .filter(Boolean)
                      .join(" ") || "Unnamed";
                  const initials =
                    [
                      dc.contact.firstName?.charAt(0) || "",
                      dc.contact.lastName?.charAt(0) || "",
                    ]
                      .join("")
                      .toUpperCase() || "?";
                  return (
                    <Link
                      key={dc.contactId}
                      href={`/contacts/${dc.contactId}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#0891b2] flex items-center justify-center text-white text-xs font-medium">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {contactName}
                        </p>
                        {dc.role && (
                          <p className="text-xs text-gray-500">{dc.role}</p>
                        )}
                      </div>
                      <RemoveAssociationButton
                        removeAction={async () => {
                          "use server";
                          return removeContactFromDeal(deal.id, dc.contactId);
                        }}
                      />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Associated Companies */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Companies ({deal.companies.length})
              </h3>
              <AssociationPicker
                associationType="company"
                existingIds={deal.companies.map((dc) => dc.companyId)}
                searchAction={searchCompanies}
                addAction={async (companyId: string) => {
                  "use server";
                  return addCompanyToDeal(deal.id, companyId);
                }}
              />
            </div>
            {deal.companies.length === 0 ? (
              <p className="text-sm text-gray-500">No companies associated</p>
            ) : (
              <div className="space-y-3">
                {deal.companies.map((dc) => (
                  <Link
                    key={dc.companyId}
                    href={`/companies/${dc.companyId}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 text-xs font-medium">
                      {dc.company.name?.charAt(0) || "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {dc.company.name}
                      </p>
                      {dc.company.domain && (
                        <p className="text-xs text-gray-500 truncate">
                          {dc.company.domain}
                        </p>
                      )}
                    </div>
                    {dc.isPrimary && (
                      <span className="text-xs bg-[#0891b2]/10 text-[#0891b2] px-1.5 py-0.5 rounded">
                        Primary
                      </span>
                    )}
                    <RemoveAssociationButton
                      removeAction={async () => {
                        "use server";
                        return removeCompanyFromDeal(deal.id, dc.companyId);
                      }}
                    />
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
                href={`/deals/${deal.id}/edit`}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Link>
              <DeleteButton id={deal.id} entityType="deal" entityName={deal.name} />
              <ActivityForm dealId={deal.id} />
            </div>
          </div>

          <CustomProperties
            entityType="deal"
            entityId={deal.id}
            properties={(deal.properties as Record<string, string>) || {}}
            propertyDefs={customPropertyDefs}
          />
        </div>
      </div>
    </div>
  );
}
