"use client";

import { useState, useRef } from "react";
import { Download, Upload, FileSpreadsheet, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface ImportResult {
  total: number;
  created: number;
  skipped: number;
  errors: number;
  errorDetails?: { row: number; message: string }[];
}

interface ImportExportButtonsProps {
  module: "contacts" | "companies";
}

export default function ImportExportButtons({ module }: ImportExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---- Export ----
  async function handleExport() {
    setIsExporting(true);
    setError(null);

    try {
      const res = await fetch(`/api/${module}/export`);

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `Export failed (${res.status})`);
      }

      // Create a download from the response blob
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${module}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setIsExporting(false);
    }
  }

  // ---- Import ----
  function openFilePicker() {
    setError(null);
    setImportResult(null);
    fileInputRef.current?.click();
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset the input so the same file can be re-selected
    e.target.value = "";

    if (!file.name.endsWith(".csv")) {
      setError("Please select a CSV file.");
      return;
    }

    setIsImporting(true);
    setError(null);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/${module}/import`, {
        method: "POST",
        body: formData,
      });

      const body = await res.json();

      if (!res.ok) {
        throw new Error(body?.error || `Import failed (${res.status})`);
      }

      setImportResult(body as ImportResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setIsImporting(false);
    }
  }

  function dismissToast() {
    setImportResult(null);
    setError(null);
  }

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* Import button */}
      <button
        onClick={openFilePicker}
        disabled={isImporting}
        className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isImporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Upload className="w-4 h-4" />
        )}
        {isImporting ? "Importing..." : "Import"}
      </button>

      {/* Export button */}
      <button
        onClick={handleExport}
        disabled={isExporting}
        className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        {isExporting ? "Exporting..." : "Export"}
      </button>

      {/* Toast notification */}
      {(importResult || error) && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-in slide-in-from-bottom-4">
          <div
            className={`rounded-xl border shadow-lg p-4 ${
              error
                ? "bg-red-50 border-red-200"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="flex items-start gap-3">
              {error ? (
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              )}

              <div className="flex-1 min-w-0">
                {error ? (
                  <>
                    <p className="text-sm font-medium text-red-800">
                      Error
                    </p>
                    <p className="text-sm text-red-600 mt-0.5">{error}</p>
                  </>
                ) : importResult ? (
                  <>
                    <p className="text-sm font-medium text-gray-900">
                      Import Complete
                    </p>
                    <div className="mt-1 space-y-0.5">
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        {importResult.total} rows processed
                      </p>
                      <p className="text-sm text-green-600">
                        {importResult.created} created
                      </p>
                      {importResult.skipped > 0 && (
                        <p className="text-sm text-amber-600">
                          {importResult.skipped} skipped (duplicate email)
                        </p>
                      )}
                      {importResult.errors > 0 && (
                        <p className="text-sm text-red-600">
                          {importResult.errors} errors
                        </p>
                      )}
                    </div>
                  </>
                ) : null}
              </div>

              <button
                onClick={dismissToast}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
