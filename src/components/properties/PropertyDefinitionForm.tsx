"use client";

import { useState, useEffect } from "react";
import { X, Plus, GripVertical, Trash2 } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
}

interface PropertyFormData {
  objectType: string;
  name: string;
  label: string;
  description: string;
  fieldType: string;
  options: SelectOption[];
  isRequired: boolean;
  groupName: string;
  defaultValue: string;
}

interface PropertyDefinitionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: {
    id: string;
    objectType: string;
    name: string;
    label: string;
    description?: string | null;
    fieldType: string;
    options?: SelectOption[] | null;
    isRequired: boolean;
    isSystem: boolean;
    groupName?: string | null;
    defaultValue?: string | null;
  };
  objectType?: string;
}

const FIELD_TYPES = [
  { value: "text", label: "Single-line text", icon: "Aa" },
  { value: "number", label: "Number", icon: "#" },
  { value: "date", label: "Date", icon: "📅" },
  { value: "datetime", label: "Date & Time", icon: "🕐" },
  { value: "select", label: "Dropdown select", icon: "▼" },
  { value: "multiselect", label: "Multiple checkboxes", icon: "☑" },
  { value: "checkbox", label: "Single checkbox", icon: "✓" },
  { value: "email", label: "Email", icon: "@" },
  { value: "phone", label: "Phone number", icon: "☎" },
  { value: "url", label: "URL", icon: "🔗" },
];

const GROUP_OPTIONS = [
  "About",
  "Contact Information",
  "Address",
  "Deal Information",
  "Web Analytics",
  "Custom",
];

export default function PropertyDefinitionForm({
  isOpen,
  onClose,
  onSuccess,
  editData,
  objectType: defaultObjectType,
}: PropertyDefinitionFormProps) {
  const isEdit = !!editData;

  const [form, setForm] = useState<PropertyFormData>({
    objectType: editData?.objectType || defaultObjectType || "contact",
    name: editData?.name || "",
    label: editData?.label || "",
    description: editData?.description || "",
    fieldType: editData?.fieldType || "text",
    options: (editData?.options as SelectOption[]) || [],
    isRequired: editData?.isRequired || false,
    groupName: editData?.groupName || "About",
    defaultValue: editData?.defaultValue || "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form state when editData or isOpen changes
  useEffect(() => {
    if (isOpen) {
      setForm({
        objectType: editData?.objectType || defaultObjectType || "contact",
        name: editData?.name || "",
        label: editData?.label || "",
        description: editData?.description || "",
        fieldType: editData?.fieldType || "text",
        options: (editData?.options as SelectOption[]) || [],
        isRequired: editData?.isRequired || false,
        groupName: editData?.groupName || "About",
        defaultValue: editData?.defaultValue || "",
      });
      setError(null);
    }
  }, [isOpen, editData, defaultObjectType]);

  const handleLabelChange = (label: string) => {
    setForm((prev) => ({
      ...prev,
      label,
      // Auto-generate name from label for new properties
      name: isEdit
        ? prev.name
        : label
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, "_")
            .replace(/_+/g, "_")
            .replace(/^_|_$/g, ""),
    }));
  };

  const addOption = () => {
    setForm((prev) => ({
      ...prev,
      options: [...prev.options, { value: "", label: "" }],
    }));
  };

  const updateOption = (index: number, field: "value" | "label", val: string) => {
    setForm((prev) => {
      const options = [...prev.options];
      options[index] = { ...options[index], [field]: val };
      // Auto-generate value from label
      if (field === "label") {
        options[index].value = val
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, "_")
          .replace(/_+/g, "_");
      }
      return { ...prev, options };
    });
  };

  const removeOption = (index: number) => {
    setForm((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const url = isEdit ? `/api/properties/${editData.id}` : "/api/properties";
      const method = isEdit ? "PATCH" : "POST";

      const body: Record<string, unknown> = {
        label: form.label,
        description: form.description || null,
        groupName: form.groupName,
        isRequired: form.isRequired,
        defaultValue: form.defaultValue || null,
      };

      if (!isEdit) {
        body.objectType = form.objectType;
        body.name = form.name;
        body.fieldType = form.fieldType;
      }

      if (["select", "multiselect"].includes(form.fieldType)) {
        body.options = form.options.filter((o) => o.label.trim() !== "");
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save property");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save property");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const needsOptions = ["select", "multiselect"].includes(form.fieldType);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-lg h-full bg-white shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? "Edit Property" : "Create Property"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Object Type */}
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Object Type</label>
              <select
                value={form.objectType}
                onChange={(e) => setForm((prev) => ({ ...prev, objectType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#0891b2] focus:border-[#0891b2]"
              >
                <option value="contact">Contact</option>
                <option value="company">Company</option>
                <option value="deal">Deal</option>
              </select>
            </div>
          )}

          {/* Label */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Label <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.label}
              onChange={(e) => handleLabelChange(e.target.value)}
              placeholder="e.g. Lead Source"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#0891b2] focus:border-[#0891b2]"
            />
          </div>

          {/* Internal Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Internal Name</label>
            <input
              type="text"
              value={form.name}
              readOnly={isEdit}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-50 text-gray-500"
            />
            <p className="mt-1 text-xs text-gray-400">
              Used in API calls. Auto-generated from label.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={2}
              placeholder="Help text shown to users"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#0891b2] focus:border-[#0891b2] resize-none"
            />
          </div>

          {/* Field Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Field Type <span className="text-red-500">*</span>
            </label>
            {isEdit && editData?.isSystem ? (
              <div className="px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-50 text-gray-500">
                {FIELD_TYPES.find((t) => t.value === form.fieldType)?.label || form.fieldType}
                <span className="ml-2 text-xs text-gray-400">(System property - type cannot be changed)</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {FIELD_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, fieldType: type.value }))}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm text-left transition-colors ${
                      form.fieldType === type.value
                        ? "border-[#0891b2] bg-cyan-50 text-[#0891b2]"
                        : "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-base w-5 text-center">{type.icon}</span>
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Options for select/multiselect */}
          {needsOptions && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
              <div className="space-y-2">
                {form.options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    <input
                      type="text"
                      value={opt.label}
                      onChange={(e) => updateOption(idx, "label", e.target.value)}
                      placeholder={`Option ${idx + 1}`}
                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#0891b2] focus:border-[#0891b2]"
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(idx)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addOption}
                className="flex items-center gap-1 mt-2 text-sm text-[#0891b2] hover:text-[#0ea5e9] font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                Add option
              </button>
            </div>
          )}

          {/* Group */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Group</label>
            <select
              value={form.groupName}
              onChange={(e) => setForm((prev) => ({ ...prev, groupName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#0891b2] focus:border-[#0891b2]"
            >
              {GROUP_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Required */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isRequired}
              onChange={(e) => setForm((prev) => ({ ...prev, isRequired: e.target.checked }))}
              className="rounded border-gray-300 text-[#0891b2] focus:ring-[#0891b2]"
            />
            <span className="text-sm text-gray-700">Required field</span>
          </label>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving || !form.label.trim()}
              className="flex-1 px-4 py-2 bg-[#0891b2] text-white rounded-md text-sm font-semibold hover:bg-[#0ea5e9] transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : isEdit ? "Update Property" : "Create Property"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
