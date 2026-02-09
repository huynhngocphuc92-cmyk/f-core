import Link from "next/link";
import prisma from "@/lib/prisma";
import { ArrowLeft, Shield, Clock } from "lucide-react";

async function getSLAPolicies() {
  const tenant = await prisma.tenant.findFirst({
    where: { domain: "demo.f-core.com" },
    select: { id: true },
  });
  if (!tenant) return [];

  return prisma.ticketSLAPolicy.findMany({
    where: { tenantId: tenant.id, deletedAt: null },
    include: {
      _count: { select: { tickets: true } },
    },
    orderBy: [
      { priority: "asc" },
    ],
  });
}

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (hours < 24) return remaining ? `${hours}h ${remaining}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours ? `${days}d ${remainingHours}h` : `${days}d`;
}

const priorityConfig: Record<string, { color: string; bg: string }> = {
  urgent: { color: "text-red-700", bg: "bg-red-50 border-red-200" },
  high: { color: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
  medium: { color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  low: { color: "text-gray-600", bg: "bg-gray-50 border-gray-200" },
};

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function SLAPoliciesPage() {
  const policies = await getSLAPolicies();

  // Sort by priority order
  const priorityOrder = ["urgent", "high", "medium", "low"];
  const sorted = [...policies].sort(
    (a, b) => priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority)
  );

  return (
    <div className="p-6 pt-8 max-w-4xl">
      <Link
        href="/tickets"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to tickets
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6" />
            SLA Policies
          </h1>
          <p className="text-gray-600 mt-1">
            Service Level Agreement targets by priority
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sorted.map((policy) => {
          const config = priorityConfig[policy.priority] || priorityConfig.medium;
          return (
            <div
              key={policy.id}
              className={`bg-white rounded-xl border border-gray-200 overflow-hidden`}
            >
              <div className={`px-5 py-3 border-b ${config.bg} border`}>
                <div className="flex items-center justify-between">
                  <h3 className={`font-semibold ${config.color} capitalize`}>
                    {policy.priority} Priority
                  </h3>
                  <span className="text-xs text-gray-500">
                    {policy._count.tickets} ticket{policy._count.tickets !== 1 ? "s" : ""}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{policy.name}</p>
              </div>

              <div className="p-5 space-y-4">
                {/* SLA Targets */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Clock className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                    <p className="text-lg font-bold text-gray-900">
                      {formatTime(policy.firstResponseTime)}
                    </p>
                    <p className="text-[11px] text-gray-500">First Response</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Clock className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                    <p className="text-lg font-bold text-gray-900">
                      {policy.nextResponseTime ? formatTime(policy.nextResponseTime) : "-"}
                    </p>
                    <p className="text-[11px] text-gray-500">Next Response</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Clock className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                    <p className="text-lg font-bold text-gray-900">
                      {formatTime(policy.resolutionTime)}
                    </p>
                    <p className="text-[11px] text-gray-500">Resolution</p>
                  </div>
                </div>

                {/* Business Hours */}
                <div className="text-sm">
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Business Hours</span>
                    <span className="font-medium">
                      {policy.businessHoursOnly
                        ? `${policy.businessHoursStart} - ${policy.businessHoursEnd}`
                        : "24/7"}
                    </span>
                  </div>
                  {policy.businessHoursOnly && (
                    <div className="flex items-center justify-between text-gray-600 mt-1">
                      <span>Business Days</span>
                      <span className="font-medium">
                        {policy.businessDays.map((d) => dayNames[d]).join(", ")}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-gray-600 mt-1">
                    <span>Timezone</span>
                    <span className="font-medium">{policy.timezone}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {policies.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500">No SLA policies configured</p>
        </div>
      )}
    </div>
  );
}
