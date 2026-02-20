"use client";

import { useMemo, useState } from "react";
import { Database, Plus, Sparkles, Trash2 } from "lucide-react";

type TransformOperation =
  | "none"
  | "trim"
  | "lowercase"
  | "uppercase"
  | "prefix"
  | "suffix"
  | "replace"
  | "to_number"
  | "to_iso_date";

type ValidationRule =
  | { type: "required" }
  | { type: "max_length"; value: number }
  | { type: "regex"; value: string }
  | { type: "email" };

type DraftMappingRule = {
  sourceField: string;
  targetField: string;
  transform: {
    operation: TransformOperation;
    argument?: string;
  };
  validations: ValidationRule[];
  defaultValue?: string;
};

type ValidationIssue = {
  sourceField: string;
  targetField: string;
  severity: "warning" | "error";
  message: string;
};

const initialRules: DraftMappingRule[] = [
  {
    sourceField: "email",
    targetField: "Email",
    transform: { operation: "trim" },
    validations: [{ type: "required" }, { type: "email" }],
  },
  {
    sourceField: "company_name",
    targetField: "Company",
    transform: { operation: "uppercase" },
    validations: [{ type: "max_length", value: 120 }],
  },
];

const defaultSampleRecord = {
  email: "  demo@example.com  ",
  company_name: "Acme Labs",
};

export default function DataMappingsPage() {
  const [rules, setRules] = useState<DraftMappingRule[]>(initialRules);
  const [sampleRecordText, setSampleRecordText] = useState(JSON.stringify(defaultSampleRecord, null, 2));
  const [preview, setPreview] = useState<Record<string, string> | null>(null);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [catalog, setCatalog] = useState<{
    transformOperations: string[];
    validationRules: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canValidate = useMemo(
    () => rules.every((rule) => rule.sourceField.trim() && rule.targetField.trim()),
    [rules]
  );

  async function loadCatalog() {
    try {
      const response = await fetch("/api/data/sync/mappings/validate");
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to load mapping catalog");
      setCatalog(body.data || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load mapping catalog");
    }
  }

  async function validateRules() {
    setLoading(true);
    setError(null);
    try {
      const sampleRecord = sampleRecordText.trim() ? JSON.parse(sampleRecordText) : undefined;
      const response = await fetch("/api/data/sync/mappings/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fieldMappings: rules,
          sampleRecord,
        }),
      });

      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to validate mapping rules");

      setIssues(body.data?.issues || []);
      setPreview(body.data?.preview || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to validate mapping rules");
    } finally {
      setLoading(false);
    }
  }

  function updateRule(index: number, updater: (rule: DraftMappingRule) => DraftMappingRule) {
    setRules((prev) => prev.map((rule, i) => (i === index ? updater(rule) : rule)));
  }

  function addRule() {
    setRules((prev) => [
      ...prev,
      {
        sourceField: "",
        targetField: "",
        transform: { operation: "none" },
        validations: [],
      },
    ]);
  }

  function removeRule(index: number) {
    setRules((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="p-6 pt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Field Mapping Studio</h1>
        <p className="mt-1 text-gray-600">
          Define schema mappings with transformation functions and validation rules before running sync jobs.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-[#0891b2]" />
            <p className="text-sm font-semibold text-gray-900">Mapping Rules</p>
          </div>
          <button
            onClick={addRule}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Add field
          </button>
        </div>

        <div className="space-y-3">
          {rules.map((rule, index) => (
            <div key={`${rule.sourceField}-${rule.targetField}-${index}`} className="rounded-lg border border-gray-100 p-3">
              <div className="grid gap-3 md:grid-cols-6">
                <input
                  value={rule.sourceField}
                  onChange={(event) =>
                    updateRule(index, (current) => ({ ...current, sourceField: event.target.value }))
                  }
                  className="h-9 rounded-md border border-gray-200 px-2 text-sm"
                  placeholder="source field"
                />

                <input
                  value={rule.targetField}
                  onChange={(event) =>
                    updateRule(index, (current) => ({ ...current, targetField: event.target.value }))
                  }
                  className="h-9 rounded-md border border-gray-200 px-2 text-sm"
                  placeholder="target field"
                />

                <select
                  value={rule.transform.operation}
                  onChange={(event) =>
                    updateRule(index, (current) => ({
                      ...current,
                      transform: {
                        ...current.transform,
                        operation: event.target.value as TransformOperation,
                      },
                    }))
                  }
                  className="h-9 rounded-md border border-gray-200 px-2 text-sm"
                >
                  {(catalog?.transformOperations || [
                    "none",
                    "trim",
                    "lowercase",
                    "uppercase",
                    "prefix",
                    "suffix",
                    "replace",
                    "to_number",
                    "to_iso_date",
                  ]).map((operation) => (
                    <option key={operation} value={operation}>
                      {operation}
                    </option>
                  ))}
                </select>

                <input
                  value={rule.transform.argument || ""}
                  onChange={(event) =>
                    updateRule(index, (current) => ({
                      ...current,
                      transform: {
                        ...current.transform,
                        argument: event.target.value || undefined,
                      },
                    }))
                  }
                  className="h-9 rounded-md border border-gray-200 px-2 text-sm"
                  placeholder="transform arg"
                />

                <input
                  value={rule.defaultValue || ""}
                  onChange={(event) =>
                    updateRule(index, (current) => ({
                      ...current,
                      defaultValue: event.target.value || undefined,
                    }))
                  }
                  className="h-9 rounded-md border border-gray-200 px-2 text-sm"
                  placeholder="default value"
                />

                <button
                  onClick={() => removeRule(index)}
                  className="inline-flex h-9 items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50"
                  aria-label="Delete mapping rule"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  onClick={() =>
                    updateRule(index, (current) => {
                      const hasRequired = current.validations.some((item) => item.type === "required");
                      return {
                        ...current,
                        validations: hasRequired
                          ? current.validations.filter((item) => item.type !== "required")
                          : [...current.validations, { type: "required" }],
                      };
                    })
                  }
                  className={`rounded-md px-2 py-1 text-xs ${
                    rule.validations.some((item) => item.type === "required")
                      ? "bg-[#cffafe] text-[#155e75]"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  required
                </button>

                <button
                  onClick={() =>
                    updateRule(index, (current) => {
                      const hasEmail = current.validations.some((item) => item.type === "email");
                      return {
                        ...current,
                        validations: hasEmail
                          ? current.validations.filter((item) => item.type !== "email")
                          : [...current.validations, { type: "email" }],
                      };
                    })
                  }
                  className={`rounded-md px-2 py-1 text-xs ${
                    rule.validations.some((item) => item.type === "email")
                      ? "bg-[#cffafe] text-[#155e75]"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  email
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900">Sample Record (JSON)</p>
          <button
            onClick={loadCatalog}
            className="text-xs font-medium text-[#0e7490] hover:underline"
            type="button"
          >
            Load catalog
          </button>
        </div>
        <textarea
          value={sampleRecordText}
          onChange={(event) => setSampleRecordText(event.target.value)}
          className="h-36 w-full rounded-lg border border-gray-200 p-3 font-mono text-xs"
        />

        <button
          onClick={validateRules}
          disabled={loading || !canValidate}
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#0891b2] px-3 py-2 text-sm font-medium text-white hover:bg-[#0e7490] disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" />
          {loading ? "Validating..." : "Validate & Preview"}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="mb-3 text-sm font-semibold text-gray-900">Validation Issues</p>
          {issues.length === 0 ? (
            <p className="text-sm text-gray-500">No validation issues.</p>
          ) : (
            <div className="space-y-2">
              {issues.map((issue, index) => (
                <div
                  key={`${issue.sourceField}-${issue.targetField}-${issue.message}-${index}`}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    issue.severity === "error"
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}
                >
                  <p className="font-medium">
                    {issue.sourceField} → {issue.targetField}
                  </p>
                  <p>{issue.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="mb-3 text-sm font-semibold text-gray-900">Transformation Preview</p>
          {!preview ? (
            <p className="text-sm text-gray-500">Run validation to generate preview values.</p>
          ) : (
            <pre className="overflow-auto rounded-lg bg-gray-900 p-3 text-xs text-gray-100">
              {JSON.stringify(preview, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
