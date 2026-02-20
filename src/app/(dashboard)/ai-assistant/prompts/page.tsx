"use client";

import { useEffect, useState } from "react";
import { Bot, RotateCcw } from "lucide-react";

type AgentKey =
  | "chat"
  | "orchestration"
  | "sales"
  | "service"
  | "knowledge"
  | "prospecting";

type PromptVersion = {
  id: string;
  agent: AgentKey;
  version: number;
  label: string;
  prompt: string;
  isActive: boolean;
  createdAt: string;
};

type PromptGroup = {
  agent: AgentKey;
  versions: PromptVersion[];
};

const agentOptions: AgentKey[] = [
  "chat",
  "orchestration",
  "sales",
  "service",
  "knowledge",
  "prospecting",
];

export default function AIPromptGovernancePage() {
  const [groups, setGroups] = useState<PromptGroup[]>([]);
  const [agent, setAgent] = useState<AgentKey>("chat");
  const [label, setLabel] = useState("");
  const [prompt, setPrompt] = useState("Add clear guardrails and keep responses concise.");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/ai/prompts");
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to load prompt versions");
      setGroups(body.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load prompt versions");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function createVersion() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/ai/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent,
          label: label.trim() || undefined,
          prompt,
          activate: true,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to create prompt version");
      setLabel("");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create prompt version");
      setBusy(false);
    }
  }

  async function rollback(agentKey: AgentKey, versionId: string) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/ai/prompts/${agentKey}/rollback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to rollback prompt version");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to rollback prompt version");
      setBusy(false);
    }
  }

  return (
    <div className="p-6 pt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI Prompt Governance</h1>
        <p className="mt-1 text-gray-600">Track versions and rollback active prompt configuration per AI agent.</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Bot className="h-4 w-4 text-[#0891b2]" />
          <p className="text-sm font-semibold text-gray-900">Create Prompt Version</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <select
            value={agent}
            onChange={(event) => setAgent(event.target.value as AgentKey)}
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
          >
            {agentOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <input
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
            placeholder="version label"
          />
        </div>
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          className="mt-3 h-28 w-full rounded-lg border border-gray-200 p-3 text-sm"
          placeholder="Prompt text..."
        />
        <button
          onClick={createVersion}
          disabled={busy || prompt.trim().length < 10}
          className="mt-3 rounded-lg bg-[#0891b2] px-3 py-2 text-sm font-medium text-white hover:bg-[#0e7490] disabled:opacity-50"
        >
          {busy ? "Saving..." : "Save Version"}
        </button>
      </div>

      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.agent} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">{group.agent}</p>
            <div className="space-y-2">
              {group.versions.map((version) => (
                <div key={version.id} className="rounded-lg border border-gray-100 p-3">
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-gray-900">
                      v{version.version} - {version.label}
                    </p>
                    <div className="flex items-center gap-2">
                      {version.isActive ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">active</span>
                      ) : (
                        <button
                          onClick={() => rollback(group.agent, version.id)}
                          disabled={busy}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                        >
                          <RotateCcw className="h-3 w-3" />
                          rollback
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">{new Date(version.createdAt).toLocaleString()}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{version.prompt}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
