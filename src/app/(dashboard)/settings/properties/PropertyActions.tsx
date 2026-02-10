"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Pencil, Trash2 } from "lucide-react";
import {
  createPropertyDefinition,
  updatePropertyDefinition,
  deletePropertyDefinition,
} from "@/app/actions/properties";

const fieldTypes = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "select", label: "Dropdown" },
  { value: "multiselect", label: "Multi-select" },
  { value: "checkbox", label: "Checkbox" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "url", label: "URL" },
];

export default function PropertyActions({
  activeTab,
  propertyId,
  propertyName,
  mode = "header",
}: {
  activeTab: string;
  propertyId?: string;
  propertyName?: string;
  mode?: "header" | "row";
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [fieldType, setFieldType] = useState("text");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  if (mode === "row" && propertyId) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => setShowDelete(true)}
          className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded"
          title="Delete property"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        {showDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowDelete(false)} />
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Property</h3>
              <p className="text-sm text-gray-600 mb-4">
                Delete &ldquo;{propertyName}&rdquo;? Existing data using this property will be preserved but no longer visible.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDelete(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  disabled={isPending}
                  onClick={() => {
                    startTransition(async () => {
                      await deletePropertyDefinition(propertyId);
                      setShowDelete(false);
                      router.refresh();
                    });
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {isPending ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Header mode - Create button
  async function handleCreate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createPropertyDefinition(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setShowCreate(false);
        formRef.current?.reset();
        setFieldType("text");
        router.refresh();
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setShowCreate(true)}
        className="flex items-center gap-2 px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-[#0e7490] transition-colors text-sm"
      >
        <Plus className="w-4 h-4" />
        Create property
      </button>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCreate(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Create Property</h2>
              <button onClick={() => setShowCreate(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
            )}

            <form ref={formRef} action={handleCreate} className="p-6 space-y-4">
              <input type="hidden" name="objectType" value={activeTab} />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Object Type
                </label>
                <p className="text-sm text-gray-900 capitalize">{activeTab}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Label <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="label"
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
                    placeholder="e.g. Twitter Handle"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Internal Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="name"
                    type="text"
                    required
                    pattern="^[a-z][a-z0-9_]*$"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
                    placeholder="e.g. twitter_handle"
                  />
                  <p className="text-xs text-gray-400 mt-1">snake_case only</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  name="description"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
                  placeholder="Optional description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Field Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="fieldType"
                    value={fieldType}
                    onChange={(e) => setFieldType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2] bg-white"
                  >
                    {fieldTypes.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Group</label>
                  <input
                    name="groupName"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
                    placeholder="Custom Properties"
                    defaultValue="Custom Properties"
                  />
                </div>
              </div>

              {(fieldType === "select" || fieldType === "multiselect") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Options (one per line)
                  </label>
                  <textarea
                    name="options"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2] resize-none font-mono"
                    placeholder={"option_value|Display Label\noption_2|Option Two"}
                  />
                  <p className="text-xs text-gray-400 mt-1">Format: value|label (or just value)</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Value</label>
                  <input
                    name="defaultValue"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
                    placeholder="Optional"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" name="isRequired" value="true" className="rounded border-gray-300 text-[#0891b2]" />
                    Required field
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#0891b2] rounded-lg hover:bg-[#0e7490] disabled:opacity-50"
                >
                  {isPending ? "Creating..." : "Create Property"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
