"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Database } from "lucide-react";

import { useI18n } from "@/i18n/I18nProvider";

type SyncMapping = {
  id: string;
  integration: "salesforce" | "hubspot" | "netsuite" | "snowflake";
  objectType: "contact" | "company" | "deal";
  direction: "import" | "export" | "bidirectional";
  conflictResolution: "local_wins" | "remote_wins" | "manual_review";
  enabled: boolean;
  fieldMappings: Array<{
    localField: string;
    remoteField: string;
    transform: "none" | "lowercase" | "uppercase" | "trim";
  }>;
  updatedAt: string;
};

type SyncJob = {
  id: string;
  mappingId: string;
  integration: string;
  objectType: string;
  status: "completed" | "completed_with_conflicts";
  processed: number;
  imported: number;
  exported: number;
  skipped: number;
  conflicts: number;
  dryRun: boolean;
  startedAt: string;
};

const sampleRecords = [
  {
    externalId: "ext-1001",
    localUpdatedAt: "2026-02-15T10:00:00.000Z",
    remoteUpdatedAt: "2026-02-15T10:05:00.000Z",
    localExists: true,
    remoteExists: true,
  },
  {
    externalId: "ext-1002",
    localUpdatedAt: "2026-02-15T09:00:00.000Z",
    remoteUpdatedAt: "2026-02-15T09:00:00.000Z",
    localExists: true,
    remoteExists: true,
  },
  {
    externalId: "ext-1003",
    localUpdatedAt: "2026-02-15T08:00:00.000Z",
    localExists: true,
    remoteExists: false,
  },
];

export default function DataSyncPage() {
  const { t } = useI18n();
  const [mappings, setMappings] = useState<SyncMapping[]>([]);
  const [jobs, setJobs] = useState<SyncJob[]>([]);

  const [integration, setIntegration] =
    useState<SyncMapping["integration"]>("salesforce");
  const [objectType, setObjectType] = useState<SyncMapping["objectType"]>("contact");
  const [direction, setDirection] =
    useState<SyncMapping["direction"]>("bidirectional");
  const [conflictResolution, setConflictResolution] =
    useState<SyncMapping["conflictResolution"]>("manual_review");
  const [enabled, setEnabled] = useState(true);
  const [fieldMapText, setFieldMapText] = useState("email:Email,address:BillingStreet");

  const [selectedMappingId, setSelectedMappingId] = useState("");
  const [dryRun, setDryRun] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedMapping = useMemo(
    () => mappings.find((item) => item.id === selectedMappingId) || null,
    [mappings, selectedMappingId]
  );

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [mappingsResponse, jobsResponse] = await Promise.all([
        fetch("/api/data/sync/mappings"),
        fetch("/api/data/sync/jobs"),
      ]);

      const [mappingsBody, jobsBody] = await Promise.all([
        mappingsResponse.json(),
        jobsResponse.json(),
      ]);

      if (!mappingsResponse.ok) {
        throw new Error(
          mappingsBody.error ||
            t("dashboard.dataSync.errors.loadMappings", "Unable to load mappings")
        );
      }
      if (!jobsResponse.ok) {
        throw new Error(
          jobsBody.error ||
            t("dashboard.dataSync.errors.loadJobs", "Unable to load jobs")
        );
      }

      const loadedMappings: SyncMapping[] = mappingsBody.data || [];
      setMappings(loadedMappings);
      setJobs(jobsBody.data || []);

      if (loadedMappings.length > 0 && !selectedMappingId) {
        setSelectedMappingId(loadedMappings[0].id);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("dashboard.dataSync.errors.loadWorkspace", "Unable to load sync workspace")
      );
    } finally {
      setLoading(false);
    }
  }, [selectedMappingId, t]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function upsertMapping() {
    setSaving(true);
    setError(null);
    try {
      const fieldMappings = fieldMapText
        .split(",")
        .map((pair) => pair.trim())
        .filter(Boolean)
        .map((pair) => {
          const [localField, remoteField] = pair.split(":");
          return {
            localField: (localField || "").trim(),
            remoteField: (remoteField || "").trim(),
            transform: "none" as const,
          };
        })
        .filter((item) => item.localField && item.remoteField);

      const response = await fetch("/api/data/sync/mappings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          integration,
          objectType,
          direction,
          conflictResolution,
          enabled,
          fieldMappings,
        }),
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(
          body.error || t("dashboard.dataSync.errors.saveMapping", "Unable to save mapping")
        );
      }

      await loadAll();
      setSelectedMappingId(body.mapping.id);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("dashboard.dataSync.errors.saveMapping", "Unable to save mapping")
      );
    } finally {
      setSaving(false);
    }
  }

  async function runSync() {
    if (!selectedMappingId) {
      setError(
        t(
          "dashboard.dataSync.errors.chooseMapping",
          "Choose a mapping before running sync"
        )
      );
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/data/sync/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mappingId: selectedMappingId,
          dryRun,
          records: sampleRecords,
        }),
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || t("dashboard.dataSync.errors.runSync", "Unable to run sync"));
      }

      await loadAll();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("dashboard.dataSync.errors.runSync", "Unable to run sync")
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 pt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {t("dashboard.dataSync.title", "Data Sync Framework")}
        </h1>
        <p className="mt-1 text-gray-600">
          {t(
            "dashboard.dataSync.subtitle",
            "Configure bi-directional mappings and run conflict-safe sync jobs with dry-run support."
          )}
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          {t("dashboard.dataSync.loading", "Loading sync workspace...")}
        </div>
      ) : (
        <>
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Database className="h-4 w-4 text-[#0891b2]" />
              <p className="text-sm font-semibold text-gray-900">
                {t("dashboard.dataSync.mappingConfig", "Mapping Configuration")}
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <select
                value={integration}
                onChange={(event) =>
                  setIntegration(event.target.value as SyncMapping["integration"])
                }
                className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
              >
                <option value="salesforce">
                  {t("dashboard.dataSync.options.integration.salesforce", "Salesforce")}
                </option>
                <option value="hubspot">
                  {t("dashboard.dataSync.options.integration.hubspot", "HubSpot")}
                </option>
                <option value="netsuite">
                  {t("dashboard.dataSync.options.integration.netsuite", "NetSuite")}
                </option>
                <option value="snowflake">
                  {t("dashboard.dataSync.options.integration.snowflake", "Snowflake")}
                </option>
              </select>

              <select
                value={objectType}
                onChange={(event) =>
                  setObjectType(event.target.value as SyncMapping["objectType"])
                }
                className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
              >
                <option value="contact">
                  {t("dashboard.dataSync.options.objectType.contact", "Contact")}
                </option>
                <option value="company">
                  {t("dashboard.dataSync.options.objectType.company", "Company")}
                </option>
                <option value="deal">
                  {t("dashboard.dataSync.options.objectType.deal", "Deal")}
                </option>
              </select>

              <select
                value={direction}
                onChange={(event) =>
                  setDirection(event.target.value as SyncMapping["direction"])
                }
                className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
              >
                <option value="bidirectional">
                  {t(
                    "dashboard.dataSync.options.direction.bidirectional",
                    "Bi-directional"
                  )}
                </option>
                <option value="import">
                  {t("dashboard.dataSync.options.direction.import", "Import")}
                </option>
                <option value="export">
                  {t("dashboard.dataSync.options.direction.export", "Export")}
                </option>
              </select>

              <select
                value={conflictResolution}
                onChange={(event) =>
                  setConflictResolution(
                    event.target.value as SyncMapping["conflictResolution"]
                  )
                }
                className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
              >
                <option value="manual_review">
                  {t(
                    "dashboard.dataSync.options.conflictResolution.manual_review",
                    "Manual review"
                  )}
                </option>
                <option value="local_wins">
                  {t(
                    "dashboard.dataSync.options.conflictResolution.local_wins",
                    "Local wins"
                  )}
                </option>
                <option value="remote_wins">
                  {t(
                    "dashboard.dataSync.options.conflictResolution.remote_wins",
                    "Remote wins"
                  )}
                </option>
              </select>

              <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 text-sm">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(event) => setEnabled(event.target.checked)}
                />
                {t("dashboard.dataSync.mappingStatus.enabled", "enabled")}
              </label>

              <input
                value={fieldMapText}
                onChange={(event) => setFieldMapText(event.target.value)}
                className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
                placeholder="local:remote,local2:remote2"
              />
            </div>

            <button
              onClick={upsertMapping}
              disabled={saving}
              className="mt-3 rounded-lg bg-[#0891b2] px-3 py-2 text-sm font-medium text-white hover:bg-[#0e7490] disabled:opacity-50"
            >
              {t("dashboard.dataSync.saveMapping", "Save Mapping")}
            </button>
          </div>

          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-gray-900">
              {t("dashboard.dataSync.runSyncJob", "Run Sync Job")}
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              <select
                value={selectedMappingId}
                onChange={(event) => setSelectedMappingId(event.target.value)}
                className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
              >
                <option value="">
                  {t("dashboard.dataSync.selectMapping", "Select mapping")}
                </option>
                {mappings.map((mapping) => (
                  <option key={mapping.id} value={mapping.id}>
                    {mapping.integration}:{mapping.objectType}
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 text-sm">
                <input
                  type="checkbox"
                  checked={dryRun}
                  onChange={(event) => setDryRun(event.target.checked)}
                />
                {t("dashboard.dataSync.dryRun", "Dry run")}
              </label>

              <button
                onClick={runSync}
                disabled={saving || !selectedMappingId}
                className="rounded-lg bg-[#0f766e] px-3 py-2 text-sm font-medium text-white hover:bg-[#115e59] disabled:opacity-50"
              >
                {t("dashboard.dataSync.runSync", "Run Sync")}
              </button>
            </div>

            {selectedMapping && (
              <p className="mt-2 text-xs text-gray-500">
                {t(
                  "dashboard.dataSync.conflictStrategy",
                  "Conflict strategy: {strategy} • direction: {direction}",
                  {
                    strategy: selectedMapping.conflictResolution,
                    direction: selectedMapping.direction,
                  }
                )}
              </p>
            )}
          </div>

          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-gray-900">
              {t("dashboard.dataSync.sections.mappings", "Mappings")}
            </p>
            {mappings.length === 0 ? (
              <p className="text-sm text-gray-500">
                {t("dashboard.dataSync.empty.noMappings", "No mappings yet.")}
              </p>
            ) : (
              <div className="space-y-2">
                {mappings.map((mapping) => (
                  <div
                    key={mapping.id}
                    className="rounded-lg border border-gray-100 p-3 text-sm text-gray-700"
                  >
                    <p className="font-medium text-gray-900">
                      {mapping.integration}:{mapping.objectType}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t(
                        "dashboard.dataSync.mappingSummary",
                        "{direction} • {strategy} • {status}",
                        {
                          direction: mapping.direction,
                          strategy: mapping.conflictResolution,
                          status: mapping.enabled
                            ? t("dashboard.dataSync.mappingStatus.enabled", "enabled")
                            : t("dashboard.dataSync.mappingStatus.disabled", "disabled"),
                        }
                      )}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-gray-900">
              {t("dashboard.dataSync.sections.syncJobs", "Sync Jobs")}
            </p>
            {jobs.length === 0 ? (
              <p className="text-sm text-gray-500">
                {t("dashboard.dataSync.empty.noJobs", "No jobs executed.")}
              </p>
            ) : (
              <div className="space-y-2">
                {jobs.map((job) => (
                  <div key={job.id} className="rounded-lg border border-gray-100 p-3">
                    <p className="text-sm font-medium text-gray-900">
                      {t("dashboard.dataSync.jobTitle", "{integration}:{objectType} • {status}", {
                        integration: job.integration,
                        objectType: job.objectType,
                        status: job.status,
                      })}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t(
                        "dashboard.dataSync.jobSummary",
                        "processed {processed} • imported {imported} • exported {exported} • conflicts {conflicts} • skipped {skipped}",
                        {
                          processed: job.processed,
                          imported: job.imported,
                          exported: job.exported,
                          conflicts: job.conflicts,
                          skipped: job.skipped,
                        }
                      )}
                    </p>
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
