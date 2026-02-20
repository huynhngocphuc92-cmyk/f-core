"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";

type ObjectType = "contact" | "company";

type QualityRule = {
  objectType: ObjectType;
  requireEmail: boolean;
  requirePhone: boolean;
  requireDomain: boolean;
  minNameLength: number;
  autoMergeExactKey: boolean;
};

type Candidate = {
  objectType: ObjectType;
  key: string;
  reason: string;
  confidence: number;
  records: Array<{
    id: string;
    displayName: string;
    email?: string | null;
    phone?: string | null;
    domain?: string | null;
    updatedAt: string;
  }>;
};

type MergeAudit = {
  id: string;
  objectType: ObjectType;
  primaryId: string;
  duplicateId: string;
  dryRun: boolean;
  createdAt: string;
};

export default function DataQualityPage() {
  const [objectType, setObjectType] = useState<ObjectType>("contact");
  const [rules, setRules] = useState<QualityRule[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [mergeAudit, setMergeAudit] = useState<MergeAudit[]>([]);

  const [mergePrimaryId, setMergePrimaryId] = useState("");
  const [mergeDuplicateId, setMergeDuplicateId] = useState("");
  const [mergeMode, setMergeMode] = useState<"prefer_primary" | "prefer_duplicate" | "custom">(
    "prefer_primary"
  );
  const [dryRun, setDryRun] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeRule = rules.find((rule) => rule.objectType === objectType) || null;

  async function loadAll(nextObjectType = objectType) {
    setLoading(true);
    setError(null);
    try {
      const [rulesResponse, candidatesResponse, auditResponse] = await Promise.all([
        fetch("/api/data/quality/rules"),
        fetch(`/api/data/quality/dedupe/candidates?objectType=${nextObjectType}&limit=100`),
        fetch("/api/data/quality/merge"),
      ]);

      const [rulesBody, candidatesBody, auditBody] = await Promise.all([
        rulesResponse.json(),
        candidatesResponse.json(),
        auditResponse.json(),
      ]);

      if (!rulesResponse.ok) throw new Error(rulesBody.error || "Unable to load quality rules");
      if (!candidatesResponse.ok)
        throw new Error(candidatesBody.error || "Unable to load duplicate candidates");
      if (!auditResponse.ok) throw new Error(auditBody.error || "Unable to load merge audit");

      setRules(rulesBody.data || []);
      setCandidates(candidatesBody.data || []);
      setMergeAudit(auditBody.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load data quality workspace");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function switchObjectType(next: ObjectType) {
    setObjectType(next);
    await loadAll(next);
  }

  async function saveRule(patch: Partial<QualityRule>) {
    if (!activeRule) return;

    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/data/quality/rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...activeRule,
          ...patch,
          objectType,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to save rule");
      await loadAll(objectType);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save rule");
    } finally {
      setSaving(false);
    }
  }

  async function runMerge() {
    if (!mergePrimaryId || !mergeDuplicateId) {
      setError("Enter primary and duplicate IDs");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/data/quality/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objectType,
          primaryId: mergePrimaryId,
          duplicateId: mergeDuplicateId,
          mergeMode,
          dryRun,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to run merge");
      await loadAll(objectType);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to run merge");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 pt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Data Quality & Deduplication</h1>
        <p className="mt-1 text-gray-600">Detect duplicates and run merge workflows with audit history.</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Loading data quality workspace...
        </div>
      ) : (
        <>
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#0891b2]" />
              <p className="text-sm font-semibold text-gray-900">Rules</p>
            </div>

            <div className="mb-3 flex gap-2">
              <button
                onClick={() => switchObjectType("contact")}
                className={`rounded border px-3 py-1 text-xs ${
                  objectType === "contact" ? "border-[#0891b2] text-[#0891b2]" : "border-gray-200 text-gray-600"
                }`}
              >
                Contacts
              </button>
              <button
                onClick={() => switchObjectType("company")}
                className={`rounded border px-3 py-1 text-xs ${
                  objectType === "company" ? "border-[#0891b2] text-[#0891b2]" : "border-gray-200 text-gray-600"
                }`}
              >
                Companies
              </button>
            </div>

            {activeRule && (
              <div className="grid gap-3 md:grid-cols-4">
                <label className="flex items-center gap-2 rounded border border-gray-200 px-3 py-2 text-xs">
                  <input
                    type="checkbox"
                    checked={activeRule.requireEmail}
                    onChange={(event) => saveRule({ requireEmail: event.target.checked })}
                    disabled={saving}
                  />
                  Require email
                </label>
                <label className="flex items-center gap-2 rounded border border-gray-200 px-3 py-2 text-xs">
                  <input
                    type="checkbox"
                    checked={activeRule.requirePhone}
                    onChange={(event) => saveRule({ requirePhone: event.target.checked })}
                    disabled={saving}
                  />
                  Require phone
                </label>
                <label className="flex items-center gap-2 rounded border border-gray-200 px-3 py-2 text-xs">
                  <input
                    type="checkbox"
                    checked={activeRule.requireDomain}
                    onChange={(event) => saveRule({ requireDomain: event.target.checked })}
                    disabled={saving}
                  />
                  Require domain
                </label>
                <label className="flex items-center gap-2 rounded border border-gray-200 px-3 py-2 text-xs">
                  <input
                    type="checkbox"
                    checked={activeRule.autoMergeExactKey}
                    onChange={(event) => saveRule({ autoMergeExactKey: event.target.checked })}
                    disabled={saving}
                  />
                  Auto-merge exact key
                </label>
              </div>
            )}
          </div>

          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-gray-900">Duplicate Candidates</p>
            {candidates.length === 0 ? (
              <p className="text-sm text-gray-500">No duplicate candidates detected.</p>
            ) : (
              <div className="space-y-3">
                {candidates.map((candidate, index) => (
                  <div key={`${candidate.key}-${index}`} className="rounded-lg border border-gray-100 p-3">
                    <p className="text-sm font-medium text-gray-900">
                      {candidate.reason} ({Math.round(candidate.confidence * 100)}%)
                    </p>
                    <p className="text-xs text-gray-500">Key: {candidate.key}</p>
                    <div className="mt-2 space-y-1 text-xs text-gray-600">
                      {candidate.records.map((record) => (
                        <div key={record.id}>
                          {record.id} • {record.displayName} • {record.email || record.domain || "-"}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-gray-900">Merge Workflow</p>
            <div className="grid gap-3 md:grid-cols-4">
              <input
                value={mergePrimaryId}
                onChange={(event) => setMergePrimaryId(event.target.value)}
                className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
                placeholder="Primary ID"
              />
              <input
                value={mergeDuplicateId}
                onChange={(event) => setMergeDuplicateId(event.target.value)}
                className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
                placeholder="Duplicate ID"
              />
              <select
                value={mergeMode}
                onChange={(event) => setMergeMode(event.target.value as any)}
                className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
              >
                <option value="prefer_primary">Prefer primary</option>
                <option value="prefer_duplicate">Prefer duplicate</option>
                <option value="custom">Custom</option>
              </select>
              <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 text-sm">
                <input type="checkbox" checked={dryRun} onChange={(event) => setDryRun(event.target.checked)} />
                Dry run
              </label>
            </div>

            <button
              onClick={runMerge}
              disabled={saving}
              className="mt-3 rounded-lg bg-[#0891b2] px-3 py-2 text-sm font-medium text-white hover:bg-[#0e7490] disabled:opacity-50"
            >
              Execute Merge
            </button>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-gray-900">Merge Audit Trail</p>
            {mergeAudit.length === 0 ? (
              <p className="text-sm text-gray-500">No merge operations yet.</p>
            ) : (
              <div className="space-y-2">
                {mergeAudit.map((item) => (
                  <div key={item.id} className="rounded-lg border border-gray-100 p-3 text-xs text-gray-600">
                    {item.objectType} • primary {item.primaryId} • duplicate {item.duplicateId} • {item.dryRun ? "dry-run" : "applied"}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
