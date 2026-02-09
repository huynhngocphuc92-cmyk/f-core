import Link from "next/link";
import prisma from "@/lib/prisma";
import { ArrowLeft, Settings2 } from "lucide-react";

async function getPipelines() {
  const tenant = await prisma.tenant.findFirst({
    where: { domain: "demo.f-core.com" },
    select: { id: true },
  });
  if (!tenant) return [];

  return prisma.ticketPipeline.findMany({
    where: { tenantId: tenant.id, deletedAt: null },
    include: {
      stages: {
        where: { deletedAt: null },
        orderBy: { displayOrder: "asc" },
        include: { _count: { select: { tickets: true } } },
      },
      _count: { select: { tickets: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

const stageTypeLabels: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  waiting: "Waiting",
  resolved: "Resolved",
  closed: "Closed",
};

export default async function TicketPipelinesPage() {
  const pipelines = await getPipelines();

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
            <Settings2 className="w-6 h-6" />
            Ticket Pipelines
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your ticket pipelines and stages
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {pipelines.map((pipeline) => (
          <div
            key={pipeline.id}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {pipeline.name}
                  </h2>
                  {pipeline.isDefault && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-[#0891b2]/10 text-[#0891b2] rounded">
                      Default
                    </span>
                  )}
                </div>
                {pipeline.description && (
                  <p className="text-sm text-gray-500 mt-0.5">{pipeline.description}</p>
                )}
              </div>
              <span className="text-sm text-gray-500">
                {pipeline._count.tickets} ticket{pipeline._count.tickets !== 1 ? "s" : ""}
              </span>
            </div>

            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stage
                  </th>
                  <th className="px-6 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Color
                  </th>
                  <th className="px-6 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tickets
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pipeline.stages.map((stage) => (
                  <tr key={stage.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: stage.color || "#6B7280" }}
                        />
                        <span className="text-sm font-medium text-gray-900">
                          {stage.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-sm text-gray-600">
                        {stageTypeLabels[stage.type] || stage.type}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded border border-gray-200"
                          style={{ backgroundColor: stage.color || "#6B7280" }}
                        />
                        <span className="text-xs text-gray-400 font-mono">
                          {stage.color || "#6B7280"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right text-sm text-gray-600">
                      {stage._count.tickets}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        {pipelines.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500">No pipelines configured</p>
          </div>
        )}
      </div>
    </div>
  );
}
