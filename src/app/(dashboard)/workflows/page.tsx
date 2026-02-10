import Link from "next/link";
import {
  Plus,
  Search,
  Zap,
  Play,
  Pause,
  Users,
  CheckCircle2,
} from "lucide-react";
import { getWorkflows, getWorkflowStats } from "@/app/actions/workflows";
import { FilterSelect } from "@/components/crm/FilterSelect";

export const dynamic = "force-dynamic";

const statusConfig: Record<string, { label: string; color: string; icon: typeof Play }> = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-600", icon: Pause },
  active: { label: "Active", color: "bg-green-50 text-green-700", icon: Play },
  paused: { label: "Paused", color: "bg-yellow-50 text-yellow-700", icon: Pause },
};

const triggerLabels: Record<string, string> = {
  contact_created: "Contact Created",
  deal_stage_changed: "Deal Stage Changed",
  form_submitted: "Form Submitted",
  manual: "Manual Trigger",
};

export default async function WorkflowsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const params = await searchParams;
  const [workflows, stats] = await Promise.all([
    getWorkflows({ search: params.search, status: params.status }),
    getWorkflowStats(),
  ]);

  return (
    <div className="p-6 pt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workflows</h1>
          <p className="text-gray-600 mt-1">
            Automate your CRM processes
          </p>
        </div>
        <Link
          href="/workflows/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-[#0e7490] transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          New Workflow
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-purple-500" />
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Workflows</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <Play className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.active}</p>
              <p className="text-xs text-gray-500">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-xl font-bold text-gray-900">
                {stats.totalEnrolled.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">Total Enrolled</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-xl font-bold text-gray-900">
                {stats.totalCompleted.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            name="search"
            type="text"
            defaultValue={params.search || ""}
            placeholder="Search workflows..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
          />
        </div>
        <FilterSelect
          name="status"
          defaultValue={params.status || "all"}
          options={[
            { value: "all", label: "All Statuses" },
            { value: "draft", label: "Draft" },
            { value: "active", label: "Active" },
            { value: "paused", label: "Paused" },
          ]}
        />
      </form>

      {/* Workflows List */}
      {workflows.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm text-center py-12">
          <Zap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-1">No workflows yet</p>
          <p className="text-sm text-gray-400">
            Create your first automation workflow
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workflows.map((workflow) => {
            const st = statusConfig[workflow.status] || statusConfig.draft;
            const actions = Array.isArray(workflow.actions)
              ? workflow.actions
              : [];
            return (
              <Link
                key={workflow.id}
                href={`/workflows/${workflow.id}`}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:border-[#0891b2]/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-purple-500" />
                    <h3 className="text-sm font-semibold text-gray-900">
                      {workflow.name}
                    </h3>
                  </div>
                  <span
                    className={`inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full ${st.color}`}
                  >
                    {st.label}
                  </span>
                </div>

                {workflow.description && (
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                    {workflow.description}
                  </p>
                )}

                <div className="text-xs text-gray-400 space-y-1">
                  <p>
                    Trigger:{" "}
                    <span className="text-gray-600">
                      {triggerLabels[workflow.triggerType] || workflow.triggerType}
                    </span>
                  </p>
                  <p>
                    Actions:{" "}
                    <span className="text-gray-600">{actions.length} steps</span>
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-400 pt-3 mt-3 border-t border-gray-100">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {workflow.enrolledCount} enrolled
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {workflow.completedCount} completed
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
