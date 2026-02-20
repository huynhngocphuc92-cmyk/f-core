"use client";

import { useState } from "react";
import { Bot, ShieldCheck, Workflow } from "lucide-react";

type OrchestrationResponse = {
  blocked: boolean;
  guardrailReason: string | null;
  plan: Array<{
    id: string;
    objective: string;
    type: "analysis" | "tool_call";
    toolName?: string;
    toolArgs?: Record<string, unknown>;
  }>;
  executions: Array<{
    stepId: string;
    status: "skipped" | "completed" | "failed";
    toolName?: string;
    output?: unknown;
    error?: string;
  }>;
  memory: {
    conversationId: string;
    intents: string[];
    facts: string[];
    updatedAt: string;
  } | null;
  orchestrationSummary: string;
};

export default function AIOrchestrationPage() {
  const [query, setQuery] = useState("Show me pipeline risk and related contacts for this quarter");
  const [conversationId, setConversationId] = useState("demo-conversation");
  const [allowWriteTools, setAllowWriteTools] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OrchestrationResponse | null>(null);

  async function runOrchestration() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/ai/orchestration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          conversationId,
          policy: {
            allowWriteTools,
            maxSteps: 4,
          },
        }),
      });

      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to run AI orchestration");

      setResult(body.data || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to run AI orchestration");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6 pt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI Orchestration</h1>
        <p className="mt-1 text-gray-600">
          Planner + tools + memory with policy guardrails for multi-step assistant execution.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Bot className="h-4 w-4 text-[#0891b2]" />
          <p className="text-sm font-semibold text-gray-900">Run Planner</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={conversationId}
            onChange={(event) => setConversationId(event.target.value)}
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
            placeholder="conversation id"
          />
          <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 text-sm">
            <input
              type="checkbox"
              checked={allowWriteTools}
              onChange={(event) => setAllowWriteTools(event.target.checked)}
            />
            Allow write tools
          </label>
        </div>

        <textarea
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="mt-3 h-28 w-full rounded-lg border border-gray-200 p-3 text-sm"
          placeholder="Ask assistant..."
        />

        <button
          onClick={runOrchestration}
          disabled={busy || !query.trim()}
          className="mt-3 rounded-lg bg-[#0891b2] px-3 py-2 text-sm font-medium text-white hover:bg-[#0e7490] disabled:opacity-50"
        >
          {busy ? "Running..." : "Run Orchestration"}
        </button>
      </div>

      {result && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Workflow className="h-4 w-4 text-[#0891b2]" />
              <p className="text-sm font-semibold text-gray-900">Plan & Execution</p>
            </div>
            <p className="mb-3 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
              {result.orchestrationSummary}
            </p>
            <div className="space-y-2">
              {result.plan.map((step) => (
                <div key={step.id} className="rounded-lg border border-gray-100 p-3 text-sm">
                  <p className="font-medium text-gray-900">{step.objective}</p>
                  <p className="text-xs text-gray-500">
                    {step.type}
                    {step.toolName ? ` • ${step.toolName}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#0891b2]" />
              <p className="text-sm font-semibold text-gray-900">Guardrails & Memory</p>
            </div>
            <div className="mb-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
              <p>
                blocked: <span className="font-medium">{String(result.blocked)}</span>
              </p>
              <p>
                reason: <span className="font-medium">{result.guardrailReason || "none"}</span>
              </p>
            </div>

            {!result.memory ? (
              <p className="text-sm text-gray-500">No memory recorded.</p>
            ) : (
              <pre className="overflow-auto rounded-lg bg-gray-900 p-3 text-xs text-gray-100">
                {JSON.stringify(result.memory, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
