"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Mail, Bell, CheckSquare, Edit3, Clock, GitBranch, Webhook, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const ACTION_ICONS: Record<string, React.ReactNode> = {
  send_email: <Mail className="w-4 h-4" />,
  send_notification: <Bell className="w-4 h-4" />,
  create_task: <CheckSquare className="w-4 h-4" />,
  update_property: <Edit3 className="w-4 h-4" />,
  delay: <Clock className="w-4 h-4" />,
  if_then: <GitBranch className="w-4 h-4" />,
  webhook: <Webhook className="w-4 h-4" />,
};

const ACTION_COLORS: Record<string, { bg: string; text: string }> = {
  send_email: { bg: "bg-cyan-50", text: "text-cyan-600" },
  send_notification: { bg: "bg-blue-50", text: "text-blue-600" },
  create_task: { bg: "bg-green-50", text: "text-green-600" },
  update_property: { bg: "bg-orange-50", text: "text-orange-600" },
  delay: { bg: "bg-purple-50", text: "text-purple-600" },
  if_then: { bg: "bg-yellow-50", text: "text-yellow-600" },
  webhook: { bg: "bg-gray-50", text: "text-gray-600" },
};

interface TriggerNodeData {
  label: string;
  triggerType: string;
  [key: string]: unknown;
}

interface ActionNodeData {
  label: string;
  actionType: string;
  [key: string]: unknown;
}

interface DelayNodeData {
  label: string;
  duration: number;
  unit: string;
  [key: string]: unknown;
}

interface ConditionNodeData {
  label: string;
  [key: string]: unknown;
}

export function TriggerNode({ data, selected }: NodeProps) {
  const nodeData = data as TriggerNodeData;
  return (
    <div
      className={cn(
        "px-4 py-3 rounded-lg border-2 bg-white shadow-sm min-w-[220px]",
        selected ? "border-[#0891b2]" : "border-green-300"
      )}
    >
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded bg-green-50 text-green-600">
          <Zap className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs font-medium text-green-600 uppercase">
            Trigger
          </p>
          <p className="text-sm font-medium text-gray-900">
            {nodeData.label || "Set enrollment trigger"}
          </p>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-green-500 !w-3 !h-3"
      />
    </div>
  );
}

export function ActionNode({ data, selected }: NodeProps) {
  const nodeData = data as ActionNodeData;
  const actionType = nodeData.actionType || "send_email";
  const colors = ACTION_COLORS[actionType] || ACTION_COLORS.send_email;
  const icon = ACTION_ICONS[actionType] || ACTION_ICONS.send_email;

  return (
    <div
      className={cn(
        "px-4 py-3 rounded-lg border-2 bg-white shadow-sm min-w-[220px]",
        selected ? "border-[#0891b2]" : "border-gray-200"
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-gray-400 !w-3 !h-3"
      />
      <div className="flex items-center gap-2">
        <div className={cn("p-1.5 rounded", colors.bg, colors.text)}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">
            {nodeData.label || "Configure action"}
          </p>
          <p className="text-xs text-gray-500 capitalize">
            {actionType.replace(/_/g, " ")}
          </p>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-gray-400 !w-3 !h-3"
      />
    </div>
  );
}

export function DelayNode({ data, selected }: NodeProps) {
  const nodeData = data as DelayNodeData;
  return (
    <div
      className={cn(
        "px-4 py-3 rounded-lg border-2 bg-white shadow-sm min-w-[220px]",
        selected ? "border-[#0891b2]" : "border-purple-200"
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-purple-400 !w-3 !h-3"
      />
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded bg-purple-50 text-purple-600">
          <Clock className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">
            {nodeData.label || "Delay"}
          </p>
          <p className="text-xs text-gray-500">
            {nodeData.duration
              ? `Wait ${nodeData.duration} ${nodeData.unit || "days"}`
              : "Set delay duration"}
          </p>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-purple-400 !w-3 !h-3"
      />
    </div>
  );
}

export function ConditionNode({ data, selected }: NodeProps) {
  const nodeData = data as ConditionNodeData;
  return (
    <div
      className={cn(
        "px-4 py-3 rounded-lg border-2 bg-white shadow-sm min-w-[220px]",
        selected ? "border-[#0891b2]" : "border-yellow-300"
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-yellow-500 !w-3 !h-3"
      />
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded bg-yellow-50 text-yellow-600">
          <GitBranch className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">
            {nodeData.label || "If/then branch"}
          </p>
          <p className="text-xs text-gray-500">Evaluate condition</p>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        style={{ left: "30%" }}
        className="!bg-green-500 !w-3 !h-3"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        style={{ left: "70%" }}
        className="!bg-red-400 !w-3 !h-3"
      />
      <div className="flex justify-between mt-2 text-[10px] text-gray-400 px-1">
        <span>Yes</span>
        <span>No</span>
      </div>
    </div>
  );
}

export function AddStepNode({ data, selected }: NodeProps) {
  return (
    <div className="flex flex-col items-center">
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-gray-300 !w-3 !h-3"
      />
      <button
        className={cn(
          "w-8 h-8 rounded-full border-2 border-dashed flex items-center justify-center transition-colors",
          selected
            ? "border-[#0891b2] text-[#0891b2] bg-cyan-50"
            : "border-gray-300 text-gray-400 hover:border-[#0891b2] hover:text-[#0891b2] hover:bg-cyan-50"
        )}
      >
        <span className="text-lg leading-none">+</span>
      </button>
    </div>
  );
}
