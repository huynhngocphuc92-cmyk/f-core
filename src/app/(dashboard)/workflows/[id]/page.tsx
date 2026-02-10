import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Zap,
  Users,
  CheckCircle2,
  Clock,
  CalendarDays,
} from "lucide-react";
import { getWorkflow } from "@/app/actions/workflows";
import {
  ToggleButton,
  SimulateButton,
  DeleteButton,
  ActionsEditor,
} from "./WorkflowActions";

export const dynamic = "force-dynamic";

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-600" },
  active: { label: "Active", color: "bg-green-50 text-green-700" },
  paused: { label: "Paused", color: "bg-yellow-50 text-yellow-700" },
};

const triggerLabels: Record<string, string> = {
  contact_created: "Contact Created",
  deal_stage_changed: "Deal Stage Changed",
  form_submitted: "Form Submitted",
  manual: "Manual Trigger",
};

export default async function WorkflowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workflow = await getWorkflow(id);

  if (!workflow) notFound();

  const st = statusConfig[workflow.status] || statusConfig.draft;
  const actions = Array.isArray(workflow.actions)
    ? (workflow.actions as { type: string; config: Record<string, string> }[])
    : [];

  return (
    <div className="p-6 pt-8">
      <Link
        href="/workflows"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#0891b2] transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Workflows
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-5 h-5 text-purple-500" />
                  <h1 className="text-xl font-bold text-gray-900">
                    {workflow.name}
                  </h1>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <span
                    className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${st.color}`}
                  >
                    {st.label}
                  </span>
                  {workflow.owner && (
                    <span className="text-sm text-gray-500">
                      by {workflow.owner.name}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ToggleButton
                  workflowId={workflow.id}
                  isActive={workflow.isActive}
                />
                <DeleteButton workflowId={workflow.id} />
              </div>
            </div>
            {workflow.description && (
              <p className="text-sm text-gray-600 mt-3">
                {workflow.description}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-gray-500">Enrolled</span>
              </div>
              <p className="text-xl font-bold text-gray-900">
                {workflow.enrolledCount.toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-xs text-gray-500">Completed</span>
              </div>
              <p className="text-xl font-bold text-gray-900">
                {workflow.completedCount.toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-purple-500" />
                <span className="text-xs text-gray-500">Steps</span>
              </div>
              <p className="text-xl font-bold text-gray-900">
                {actions.length}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">Completion Rate</span>
              </div>
              <p className="text-xl font-bold text-gray-900">
                {workflow.enrolledCount > 0
                  ? Math.round(
                      (workflow.completedCount / workflow.enrolledCount) * 100
                    )
                  : 0}
                %
              </p>
            </div>
          </div>

          {/* Simulate */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
              Test Workflow
            </h3>
            <p className="text-sm text-gray-500 mb-3">
              Simulate a run to see how many records would be enrolled based on
              the current trigger.
            </p>
            <SimulateButton workflowId={workflow.id} />
          </div>

          {/* Actions Editor */}
          <ActionsEditor workflowId={workflow.id} initialActions={actions} />
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
              Details
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <span
                  className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${st.color}`}
                >
                  {st.label}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500">Trigger</p>
                <p className="text-sm text-gray-700">
                  {triggerLabels[workflow.triggerType] || workflow.triggerType}
                </p>
              </div>
              {workflow.lastTriggeredAt && (
                <div>
                  <p className="text-xs text-gray-500">Last Triggered</p>
                  <p className="flex items-center gap-1.5 text-sm text-gray-700">
                    <Zap className="w-3.5 h-3.5 text-gray-400" />
                    {new Date(workflow.lastTriggeredAt).toLocaleString()}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500">Created</p>
                <p className="flex items-center gap-1.5 text-sm text-gray-700">
                  <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                  {new Date(workflow.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
