"use client";

import { useCallback, useState, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Node,
  type Edge,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  ArrowLeft,
  Save,
  Play,
  Mail,
  Bell,
  CheckSquare,
  Edit3,
  Clock,
  GitBranch,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  TriggerNode,
  ActionNode,
  DelayNode,
  ConditionNode,
  AddStepNode,
} from "@/components/workflow/nodes/WorkflowNodes";

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  delay: DelayNode,
  condition: ConditionNode,
  addStep: AddStepNode,
};

const defaultEdgeOptions = {
  type: "smoothstep",
  style: { stroke: "#d1d5db", strokeWidth: 2 },
  animated: false,
};

const ACTION_PALETTE = [
  {
    type: "send_email",
    label: "Send email",
    icon: Mail,
    color: "text-cyan-600",
  },
  {
    type: "send_notification",
    label: "Send notification",
    icon: Bell,
    color: "text-blue-600",
  },
  {
    type: "create_task",
    label: "Create task",
    icon: CheckSquare,
    color: "text-green-600",
  },
  {
    type: "update_property",
    label: "Set property value",
    icon: Edit3,
    color: "text-orange-600",
  },
  {
    type: "delay",
    label: "Delay",
    icon: Clock,
    color: "text-purple-600",
  },
  {
    type: "if_then",
    label: "If/then branch",
    icon: GitBranch,
    color: "text-yellow-600",
  },
];

interface WorkflowData {
  id: string;
  name: string;
  description?: string;
  objectType: string;
  status: string;
  steps: unknown[];
  triggerConfig: Record<string, unknown>;
  viewport: { x: number; y: number; zoom: number };
}

function stepsToNodes(steps: unknown[]): Node[] {
  if (!Array.isArray(steps) || steps.length === 0) {
    return [
      {
        id: "trigger",
        type: "trigger",
        position: { x: 250, y: 50 },
        data: { label: "Set enrollment trigger", triggerType: "manual" },
      },
      {
        id: "add-step-1",
        type: "addStep",
        position: { x: 250, y: 180 },
        data: {},
      },
    ];
  }

  const nodes: Node[] = [
    {
      id: "trigger",
      type: "trigger",
      position: { x: 250, y: 50 },
      data: { label: "Enrollment trigger", triggerType: "manual" },
    },
  ];

  (steps as Array<Record<string, unknown>>).forEach((step) => {
    const pos = step.position as { x: number; y: number } | undefined;
    const nodeType =
      step.type === "if_then"
        ? "condition"
        : step.type === "delay"
        ? "delay"
        : "action";

    nodes.push({
      id: step.id as string,
      type: nodeType,
      position: pos || { x: 250, y: nodes.length * 130 + 50 },
      data: {
        label: step.name as string,
        actionType: step.type as string,
        ...(step.config as Record<string, unknown>),
      },
    });
  });

  nodes.push({
    id: "add-step-end",
    type: "addStep",
    position: { x: 250, y: nodes.length * 130 + 50 },
    data: {},
  });

  return nodes;
}

function stepsToEdges(steps: unknown[]): Edge[] {
  if (!Array.isArray(steps) || steps.length === 0) {
    return [
      {
        id: "e-trigger-add",
        source: "trigger",
        target: "add-step-1",
        ...defaultEdgeOptions,
      },
    ];
  }

  const edges: Edge[] = [];
  const stepList = steps as Array<Record<string, unknown>>;

  // Connect trigger to first step
  if (stepList.length > 0) {
    edges.push({
      id: "e-trigger-0",
      source: "trigger",
      target: stepList[0].id as string,
      ...defaultEdgeOptions,
    });
  }

  // Connect steps sequentially
  stepList.forEach((step, i) => {
    const next = step.next as string[] | undefined;
    if (next && next.length > 0) {
      next.forEach((targetId) => {
        edges.push({
          id: `e-${step.id}-${targetId}`,
          source: step.id as string,
          target: targetId,
          ...defaultEdgeOptions,
        });
      });
    } else if (i < stepList.length - 1) {
      edges.push({
        id: `e-${step.id}-${stepList[i + 1].id}`,
        source: step.id as string,
        target: stepList[i + 1].id as string,
        ...defaultEdgeOptions,
      });
    }
  });

  // Connect last step to add-step
  if (stepList.length > 0) {
    edges.push({
      id: `e-${stepList[stepList.length - 1].id}-add`,
      source: stepList[stepList.length - 1].id as string,
      target: "add-step-end",
      ...defaultEdgeOptions,
    });
  }

  return edges;
}

export default function WorkflowBuilderPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const [params, setParams] = useState<{ id: string } | null>(null);
  const [workflow, setWorkflow] = useState<WorkflowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState([] as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as Edge[]);

  useEffect(() => {
    paramsPromise.then(setParams);
  }, [paramsPromise]);

  useEffect(() => {
    if (!params) return;
    fetch(`/api/workflows/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        setWorkflow(data);
        setNodes(stepsToNodes(data.steps));
        setEdges(stepsToEdges(data.steps));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params, setNodes, setEdges]);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const addStep = useCallback(
    (actionType: string) => {
      const newId = `step_${Date.now()}`;
      const lastActionNode = [...nodes]
        .filter((n) => n.type !== "addStep")
        .pop();
      const yPos = lastActionNode
        ? lastActionNode.position.y + 130
        : 180;

      const nodeType =
        actionType === "if_then"
          ? "condition"
          : actionType === "delay"
          ? "delay"
          : "action";

      const newNode: Node = {
        id: newId,
        type: nodeType,
        position: { x: 250, y: yPos },
        data: {
          label: ACTION_PALETTE.find((a) => a.type === actionType)?.label || actionType,
          actionType,
        },
      };

      // Update add-step node position
      const addStepNode = nodes.find((n) => n.type === "addStep");

      setNodes((nds) => {
        const filtered = nds.filter((n) => n.type !== "addStep");
        return [
          ...filtered,
          newNode,
          {
            id: addStepNode?.id || "add-step-end",
            type: "addStep" as const,
            position: { x: 250, y: yPos + 130 },
            data: {},
          },
        ];
      });

      // Update edges
      setEdges((eds) => {
        const filtered = eds.filter(
          (e) => e.target !== (addStepNode?.id || "add-step-end")
        );
        const lastSource = lastActionNode?.id || "trigger";
        return [
          ...filtered,
          {
            id: `e-${lastSource}-${newId}`,
            source: lastSource,
            target: newId,
            ...defaultEdgeOptions,
          },
          {
            id: `e-${newId}-add`,
            source: newId,
            target: addStepNode?.id || "add-step-end",
            ...defaultEdgeOptions,
          },
        ];
      });

      setShowPalette(false);
    },
    [nodes, setNodes, setEdges]
  );

  const saveWorkflow = useCallback(async () => {
    if (!params || !workflow) return;
    setSaving(true);

    const steps = nodes
      .filter((n) => n.type !== "addStep" && n.type !== "trigger")
      .map((n) => ({
        id: n.id,
        type: n.data.actionType || n.type,
        name: n.data.label,
        config: {},
        position: n.position,
      }));

    await fetch(`/api/workflows/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ steps }),
    });

    setSaving(false);
  }, [params, workflow, nodes]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0891b2]" />
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-gray-500">Workflow not found</p>
        <Link href="/workflows" className="text-[#0891b2] hover:underline">
          Back to workflows
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link
            href="/workflows"
            className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">
              {workflow.name}
            </h1>
            <span
              className={cn(
                "text-xs px-1.5 py-0.5 rounded capitalize",
                workflow.status === "active"
                  ? "bg-green-100 text-green-700"
                  : workflow.status === "paused"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-gray-100 text-gray-600"
              )}
            >
              {workflow.status}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={saveWorkflow}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving..." : "Save"}
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-[#0891b2] rounded-lg hover:bg-[#0ea5e9]">
            <Play className="w-3.5 h-3.5" />
            Review & Publish
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          onNodeClick={(_, node) => {
            if (node.type === "addStep") {
              setShowPalette(true);
            }
          }}
          fitView
          fitViewOptions={{ padding: 0.3 }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
          <Controls position="bottom-right" />
          <MiniMap
            position="bottom-left"
            nodeColor={(n) => {
              if (n.type === "trigger") return "#22c55e";
              if (n.type === "condition") return "#eab308";
              if (n.type === "delay") return "#a855f7";
              return "#0891b2";
            }}
          />
        </ReactFlow>

        {/* Action Palette */}
        {showPalette && (
          <div className="absolute top-4 left-4 bg-white rounded-xl shadow-lg border border-gray-200 p-4 w-64 z-10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">
                Add action
              </h3>
              <button
                onClick={() => setShowPalette(false)}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                &times;
              </button>
            </div>
            <div className="space-y-1">
              {ACTION_PALETTE.map((action) => (
                <button
                  key={action.type}
                  onClick={() => addStep(action.type)}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <action.icon className={cn("w-4 h-4", action.color)} />
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
