"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Play,
  Pause,
  Trash2,
  Zap,
  Plus,
  X,
  GripVertical,
} from "lucide-react";
import {
  toggleWorkflow,
  simulateWorkflow,
  deleteWorkflow,
  updateWorkflowActions,
} from "@/app/actions/workflows";

export function ToggleButton({
  workflowId,
  isActive,
}: {
  workflowId: string;
  isActive: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() =>
        startTransition(() => toggleWorkflow(workflowId, !isActive))
      }
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
          : "bg-green-50 text-green-700 hover:bg-green-100"
      } disabled:opacity-50`}
    >
      {isActive ? (
        <>
          <Pause className="w-4 h-4" /> Pause
        </>
      ) : (
        <>
          <Play className="w-4 h-4" /> Activate
        </>
      )}
    </button>
  );
}

export function SimulateButton({ workflowId }: { workflowId: string }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      <button
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const res = await simulateWorkflow(workflowId);
            if ("enrolled" in res) {
              setResult(`Enrolled ${res.enrolled} records`);
              setTimeout(() => setResult(null), 3000);
            }
          })
        }
        className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors disabled:opacity-50"
      >
        <Zap className="w-4 h-4" />
        {isPending ? "Simulating..." : "Simulate Run"}
      </button>
      {result && (
        <span className="text-sm text-green-600 font-medium">{result}</span>
      )}
    </div>
  );
}

export function DeleteButton({ workflowId }: { workflowId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() => {
        if (!confirm("Delete this workflow?")) return;
        startTransition(async () => {
          await deleteWorkflow(workflowId);
          router.push("/workflows");
        });
      }}
      className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm transition-colors disabled:opacity-50"
    >
      <Trash2 className="w-4 h-4" />
      Delete
    </button>
  );
}

const actionTypes = [
  { value: "send_email", label: "Send Email" },
  { value: "create_task", label: "Create Task" },
  { value: "update_property", label: "Update Property" },
  { value: "add_to_list", label: "Add to List" },
  { value: "wait", label: "Wait / Delay" },
  { value: "if_branch", label: "If/Then Branch" },
];

type WorkflowAction = {
  type: string;
  config: Record<string, string>;
};

export function ActionsEditor({
  workflowId,
  initialActions,
}: {
  workflowId: string;
  initialActions: WorkflowAction[];
}) {
  const [actions, setActions] = useState<WorkflowAction[]>(initialActions);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const addAction = () => {
    setActions([...actions, { type: "send_email", config: {} }]);
  };

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const updateAction = (index: number, field: string, value: string) => {
    const updated = [...actions];
    if (field === "type") {
      updated[index] = { type: value, config: {} };
    } else {
      updated[index] = {
        ...updated[index],
        config: { ...updated[index].config, [field]: value },
      };
    }
    setActions(updated);
  };

  const save = () => {
    startTransition(async () => {
      await updateWorkflowActions(workflowId, actions);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Actions ({actions.length} steps)
        </h3>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-sm text-green-600 font-medium">Saved</span>
          )}
          <button
            onClick={save}
            disabled={isPending}
            className="px-3 py-1.5 bg-[#0891b2] text-white rounded-lg text-xs font-medium hover:bg-[#0e7490] transition-colors disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save Actions"}
          </button>
        </div>
      </div>

      {actions.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No actions yet. Add your first step.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {actions.map((action, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 border border-gray-100 rounded-lg bg-gray-50"
            >
              <GripVertical className="w-4 h-4 text-gray-300 mt-2 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-400 w-6">
                    {i + 1}.
                  </span>
                  <select
                    value={action.type}
                    onChange={(e) => updateAction(i, "type", e.target.value)}
                    className="flex-1 px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#0891b2]"
                  >
                    {actionTypes.map((at) => (
                      <option key={at.value} value={at.value}>
                        {at.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeAction(i)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {action.type === "send_email" && (
                  <input
                    placeholder="Email template name..."
                    value={action.config.template || ""}
                    onChange={(e) =>
                      updateAction(i, "template", e.target.value)
                    }
                    className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#0891b2]"
                  />
                )}
                {action.type === "wait" && (
                  <input
                    placeholder="Delay (e.g. 2 days)..."
                    value={action.config.delay || ""}
                    onChange={(e) => updateAction(i, "delay", e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#0891b2]"
                  />
                )}
                {action.type === "update_property" && (
                  <div className="flex gap-2">
                    <input
                      placeholder="Property name..."
                      value={action.config.property || ""}
                      onChange={(e) =>
                        updateAction(i, "property", e.target.value)
                      }
                      className="flex-1 px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#0891b2]"
                    />
                    <input
                      placeholder="New value..."
                      value={action.config.value || ""}
                      onChange={(e) =>
                        updateAction(i, "value", e.target.value)
                      }
                      className="flex-1 px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#0891b2]"
                    />
                  </div>
                )}
                {action.type === "create_task" && (
                  <input
                    placeholder="Task title..."
                    value={action.config.title || ""}
                    onChange={(e) => updateAction(i, "title", e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#0891b2]"
                  />
                )}
                {action.type === "add_to_list" && (
                  <input
                    placeholder="List name..."
                    value={action.config.list || ""}
                    onChange={(e) => updateAction(i, "list", e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#0891b2]"
                  />
                )}
                {action.type === "if_branch" && (
                  <input
                    placeholder="Condition (e.g. status = active)..."
                    value={action.config.condition || ""}
                    onChange={(e) =>
                      updateAction(i, "condition", e.target.value)
                    }
                    className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#0891b2]"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={addAction}
        className="mt-3 flex items-center gap-2 px-3 py-2 text-sm text-[#0891b2] hover:bg-[#0891b2]/5 rounded-lg transition-colors w-full justify-center border border-dashed border-gray-200"
      >
        <Plus className="w-4 h-4" />
        Add Action Step
      </button>
    </div>
  );
}
