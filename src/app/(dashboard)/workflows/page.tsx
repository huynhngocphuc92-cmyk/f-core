import { Plus, Search, GitBranch, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { STATUS_COLORS, WORKFLOW_OBJECT_TYPES } from "@/lib/workflow/constants";
import { WorkflowStatusToggle } from "@/components/workflow/WorkflowStatusToggle";

async function getWorkflows(status?: string, search?: string) {
  const where: Record<string, unknown> = { deletedAt: null };
  if (status && status !== "all") where.status = status;
  if (search) where.name = { contains: search, mode: "insensitive" };

  const workflows = await prisma.workflowDefinition.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: {
      _count: {
        select: {
          executions: true,
          enrollments: true,
        },
      },
    },
  });
  return workflows;
}

export default async function WorkflowsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const params = await searchParams;
  const workflows = await getWorkflows(params.status, params.search);
  const activeFilter = params.status || "all";

  const statusTabs = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "paused", label: "Paused" },
    { key: "draft", label: "Draft" },
  ];

  return (
    <div className="p-6 pt-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workflows</h1>
          <p className="text-gray-600 mt-1">
            {workflows.length} workflow{workflows.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/workflows/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-[#0ea5e9] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create workflow
        </Link>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-gray-200">
        {statusTabs.map((tab) => (
          <Link
            key={tab.key}
            href={`/workflows${tab.key !== "all" ? `?status=${tab.key}` : ""}`}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeFilter === tab.key
                ? "border-[#0891b2] text-[#0891b2]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search workflows..."
          defaultValue={params.search || ""}
          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
        />
      </div>

      {/* Workflows Table */}
      {workflows.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Object
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Enrolled
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Last Modified
                </th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {workflows.map((workflow) => {
                const statusStyle = STATUS_COLORS[workflow.status] || STATUS_COLORS.draft;
                const triggerConfig = workflow.triggerConfig as Record<string, unknown> | null;
                const triggerType = (triggerConfig?.type as string) || "manual";

                return (
                  <tr
                    key={workflow.id}
                    className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <WorkflowStatusToggle
                        workflowId={workflow.id}
                        currentStatus={workflow.status}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/workflows/${workflow.id}/builder`}
                        className="text-sm font-medium text-gray-900 hover:text-[#0891b2] transition-colors"
                      >
                        {workflow.name}
                      </Link>
                      {workflow.description && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">
                          {workflow.description}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 capitalize">
                        {triggerType.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                        {workflow.objectType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {workflow._count.enrollments}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">
                        {new Date(workflow.updatedAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <GitBranch className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No workflows yet
          </h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Automate your CRM processes by creating workflows that trigger
            actions based on record changes.
          </p>
          <Link
            href="/workflows/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-[#0ea5e9] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create your first workflow
          </Link>
        </div>
      )}
    </div>
  );
}
