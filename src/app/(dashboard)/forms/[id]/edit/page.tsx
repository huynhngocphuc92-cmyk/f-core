"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Eye,
  Globe,
  Loader2,
  X,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Trash2,
  Type,
  Mail,
  Phone,
  Hash,
  AlignLeft,
  ChevronDownIcon,
  CircleDot,
  CheckSquare,
  Calendar,
  EyeOff,
  LinkIcon,
  Heading,
  Pilcrow,
  Minus,
  MoveVertical,
  Plus,
  AlertCircle,
} from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================

interface FieldOption {
  label: string;
  value: string;
}

interface FormField {
  id: string;
  type: string;
  label: string;
  name: string;
  placeholder: string;
  helpText: string;
  required: boolean;
  width: "full" | "half" | "third";
  options: FieldOption[];
  order: number;
  orderIndex?: number;
}

interface Form {
  id: string;
  name: string;
  description: string;
  status: string;
  fields: FormField[];
}

// =============================================================================
// FIELD PALETTE CONFIG
// =============================================================================

interface FieldTypeConfig {
  type: string;
  label: string;
  icon: React.ElementType;
  group: string;
}

const FIELD_TYPES: FieldTypeConfig[] = [
  // Common
  { type: "text", label: "Text", icon: Type, group: "Common" },
  { type: "email", label: "Email", icon: Mail, group: "Common" },
  { type: "phone", label: "Phone", icon: Phone, group: "Common" },
  { type: "number", label: "Number", icon: Hash, group: "Common" },
  { type: "textarea", label: "Text Area", icon: AlignLeft, group: "Common" },
  // Choice
  { type: "dropdown", label: "Dropdown", icon: ChevronDownIcon, group: "Choice" },
  { type: "radio", label: "Radio", icon: CircleDot, group: "Choice" },
  { type: "checkbox", label: "Checkbox", icon: CheckSquare, group: "Choice" },
  // Advanced
  { type: "date", label: "Date", icon: Calendar, group: "Advanced" },
  { type: "hidden", label: "Hidden", icon: EyeOff, group: "Advanced" },
  { type: "url", label: "URL", icon: LinkIcon, group: "Advanced" },
  // Layout
  { type: "heading", label: "Heading", icon: Heading, group: "Layout" },
  { type: "paragraph", label: "Paragraph", icon: Pilcrow, group: "Layout" },
  { type: "divider", label: "Divider", icon: Minus, group: "Layout" },
  { type: "spacer", label: "Spacer", icon: MoveVertical, group: "Layout" },
];

const GROUPS = ["Common", "Choice", "Advanced", "Layout"];

// =============================================================================
// HELPERS
// =============================================================================

function generateId(): string {
  return `field_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

function labelToName(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function createField(type: string, order: number): FormField {
  const config = FIELD_TYPES.find((f) => f.type === type);
  const label = config?.label || type;
  return {
    id: generateId(),
    type,
    label,
    name: labelToName(label),
    placeholder: "",
    helpText: "",
    required: false,
    width: "full",
    options:
      type === "dropdown" || type === "radio" || type === "checkbox"
        ? [
            { label: "Option 1", value: "option_1" },
            { label: "Option 2", value: "option_2" },
          ]
        : [],
    order,
  };
}

// =============================================================================
// PREVIEW MODAL
// =============================================================================

function PreviewModal({
  fields,
  formName,
  onClose,
}: {
  fields: FormField[];
  formName: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-lg font-semibold text-gray-900">
            Preview: {formName}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          {fields
            .sort((a, b) => a.order - b.order)
            .map((field) => (
              <PreviewField key={field.id} field={field} />
            ))}
          {fields.length === 0 && (
            <p className="text-gray-400 text-center py-8">No fields added yet.</p>
          )}
          {fields.length > 0 && (
            <div className="pt-4">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md bg-[#0891b2] px-6 py-3 text-base font-semibold text-white hover:bg-[#0ea5e9] transition-colors shadow-lg shadow-cyan-500/25"
              >
                Submit
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PreviewField({ field }: { field: FormField }) {
  if (field.type === "heading") {
    return <h3 className="text-xl font-semibold text-gray-900">{field.label}</h3>;
  }
  if (field.type === "paragraph") {
    return <p className="text-sm text-gray-600">{field.label}</p>;
  }
  if (field.type === "divider") {
    return <hr className="border-gray-200" />;
  }
  if (field.type === "spacer") {
    return <div className="h-6" />;
  }
  if (field.type === "hidden") {
    return null;
  }

  const widthClass =
    field.width === "half"
      ? "w-1/2"
      : field.width === "third"
        ? "w-1/3"
        : "w-full";

  return (
    <div className={widthClass}>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {field.label}
        {field.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      {field.type === "textarea" && (
        <textarea
          placeholder={field.placeholder}
          rows={3}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#0891b2] focus:ring-2 focus:ring-cyan-100 outline-none transition-colors resize-none"
        />
      )}

      {field.type === "dropdown" && (
        <select className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#0891b2] focus:ring-2 focus:ring-cyan-100 outline-none transition-colors bg-white">
          <option value="">{field.placeholder || "Select..."}</option>
          {field.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {field.type === "radio" && (
        <div className="space-y-2">
          {field.options.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-sm text-gray-700">
              <input type="radio" name={field.name} value={opt.value} className="text-[#0891b2] focus:ring-[#0891b2]" />
              {opt.label}
            </label>
          ))}
        </div>
      )}

      {field.type === "checkbox" && (
        <div className="space-y-2">
          {field.options.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" value={opt.value} className="rounded text-[#0891b2] focus:ring-[#0891b2]" />
              {opt.label}
            </label>
          ))}
        </div>
      )}

      {["text", "email", "phone", "number", "date", "url"].includes(field.type) && (
        <input
          type={field.type === "phone" ? "tel" : field.type}
          placeholder={field.placeholder}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#0891b2] focus:ring-2 focus:ring-cyan-100 outline-none transition-colors"
        />
      )}

      {field.helpText && (
        <p className="mt-1 text-xs text-gray-400">{field.helpText}</p>
      )}
    </div>
  );
}

// =============================================================================
// MAIN FORM BUILDER PAGE
// =============================================================================

export default function FormBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.id as string;

  const [form, setForm] = useState<Form | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Selected field
  const selectedField = useMemo(
    () => fields.find((f) => f.id === selectedFieldId) || null,
    [fields, selectedFieldId],
  );

  // Load form
  useEffect(() => {
    async function loadForm() {
      try {
        setLoading(true);
        const res = await fetch(`/api/forms/${formId}`);
        if (!res.ok) throw new Error("Failed to load form");
        const data = await res.json();
        setForm(data);
        setFormName(data.name);
        // Map API's orderIndex to local order field
        const mappedFields = (data.fields || []).map((f: FormField & { orderIndex?: number }, i: number) => ({
          ...f,
          order: f.orderIndex ?? f.order ?? i,
        }));
        setFields(mappedFields);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load form");
      } finally {
        setLoading(false);
      }
    }
    loadForm();
  }, [formId]);

  // Add field
  const addField = useCallback(
    (type: string) => {
      const newField = createField(type, fields.length);
      setFields((prev) => [...prev, newField]);
      setSelectedFieldId(newField.id);
    },
    [fields.length],
  );

  // Update field
  const updateField = useCallback(
    (fieldId: string, updates: Partial<FormField>) => {
      setFields((prev) =>
        prev.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)),
      );
    },
    [],
  );

  // Delete field
  const deleteField = useCallback(
    (fieldId: string) => {
      setFields((prev) => {
        const remaining = prev
          .filter((f) => f.id !== fieldId)
          .map((f, i) => ({ ...f, order: i }));
        return remaining;
      });
      if (selectedFieldId === fieldId) {
        setSelectedFieldId(null);
      }
    },
    [selectedFieldId],
  );

  // Move field
  const moveField = useCallback((fieldId: string, direction: "up" | "down") => {
    setFields((prev) => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((f) => f.id === fieldId);
      if (
        (direction === "up" && idx === 0) ||
        (direction === "down" && idx === sorted.length - 1)
      ) {
        return prev;
      }
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      const temp = sorted[idx].order;
      sorted[idx] = { ...sorted[idx], order: sorted[swapIdx].order };
      sorted[swapIdx] = { ...sorted[swapIdx], order: temp };
      return sorted;
    });
  }, []);

  // Save
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSaveSuccess(false);

      // Save form name
      const nameRes = await fetch(`/api/forms/${formId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName }),
      });
      if (!nameRes.ok) throw new Error("Failed to save form name");

      // Save fields - map local order to API's orderIndex
      const fieldsPayload = fields.map((f) => ({
        ...f,
        orderIndex: f.order,
      }));
      const fieldsRes = await fetch(`/api/forms/${formId}/fields`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: fieldsPayload }),
      });
      if (!fieldsRes.ok) throw new Error("Failed to save fields");

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // Publish
  const handlePublish = async () => {
    try {
      setPublishing(true);
      setError(null);

      // Save first
      await handleSave();

      const res = await fetch(`/api/forms/${formId}/publish`, {
        method: "POST",
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to publish form");
      }

      setForm((prev) => (prev ? { ...prev, status: "published" } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish");
    } finally {
      setPublishing(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#0891b2]" />
      </div>
    );
  }

  // Error state
  if (error && !form) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-gray-600">{error}</p>
        <Link
          href="/forms"
          className="text-[#0891b2] hover:text-[#0ea5e9] text-sm font-medium"
        >
          Back to Forms
        </Link>
      </div>
    );
  }

  const sortedFields = [...fields].sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-col h-screen">
      {/* Top Toolbar */}
      <div className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/forms"
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <input
            type="text"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            className="text-lg font-semibold text-gray-900 border-none outline-none bg-transparent focus:ring-0 w-64"
            placeholder="Form name..."
          />
          {form?.status && (
            <span
              className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full capitalize ${
                form.status === "published"
                  ? "bg-green-50 text-green-700"
                  : "bg-yellow-50 text-yellow-700"
              }`}
            >
              {form.status}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {error && (
            <span className="text-sm text-red-500 mr-2">{error}</span>
          )}
          {saveSuccess && (
            <span className="text-sm text-green-600 mr-2">Saved!</span>
          )}
          <button
            onClick={() => setShowPreview(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save
          </button>
          <button
            onClick={handlePublish}
            disabled={publishing || fields.length === 0}
            className="inline-flex items-center gap-2 rounded-md bg-[#0891b2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0ea5e9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {publishing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Globe className="w-4 h-4" />
            )}
            Publish
          </button>
        </div>
      </div>

      {/* Three Panel Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT SIDEBAR - Field Palette */}
        <div className="w-64 border-r border-gray-200 bg-gray-50 overflow-y-auto flex-shrink-0">
          <div className="p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Add Fields
            </h3>
            {GROUPS.map((group) => (
              <div key={group} className="mb-4">
                <h4 className="text-xs font-medium text-gray-400 uppercase mb-2">
                  {group}
                </h4>
                <div className="space-y-1">
                  {FIELD_TYPES.filter((f) => f.group === group).map(
                    (fieldType) => {
                      const Icon = fieldType.icon;
                      return (
                        <button
                          key={fieldType.type}
                          onClick={() => addField(fieldType.type)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-white hover:shadow-sm hover:border-gray-200 border border-transparent transition-all text-left"
                        >
                          <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          {fieldType.label}
                        </button>
                      );
                    },
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER - Builder Canvas */}
        <div className="flex-1 overflow-y-auto bg-gray-100 p-6">
          <div className="max-w-2xl mx-auto">
            {sortedFields.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-300 rounded-2xl bg-white">
                <div className="w-16 h-16 rounded-full bg-cyan-50 flex items-center justify-center mb-4">
                  <Plus className="w-8 h-8 text-[#0891b2]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Drop fields here
                </h3>
                <p className="text-sm text-gray-500">
                  Click a field type from the left panel to add it.
                </p>
              </div>
            )}

            <div className="space-y-3">
              {sortedFields.map((field, idx) => {
                const isSelected = field.id === selectedFieldId;
                const config = FIELD_TYPES.find(
                  (f) => f.type === field.type,
                );
                const Icon = config?.icon || Type;

                return (
                  <div
                    key={field.id}
                    onClick={() => setSelectedFieldId(field.id)}
                    className={`relative bg-white rounded-xl p-4 border-2 cursor-pointer transition-all group ${
                      isSelected
                        ? "border-[#0891b2] shadow-md shadow-cyan-100"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Drag Handle */}
                      <div className="flex flex-col items-center gap-0.5 pt-1 opacity-30 group-hover:opacity-60 flex-shrink-0">
                        <GripVertical className="w-4 h-4 text-gray-400" />
                      </div>

                      {/* Field Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {field.label}
                          </span>
                          {field.required && (
                            <span className="text-red-500 text-sm">*</span>
                          )}
                          <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                            {field.type}
                          </span>
                          {field.width !== "full" && (
                            <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                              {field.width}
                            </span>
                          )}
                        </div>
                        {field.placeholder && (
                          <p className="text-xs text-gray-400 truncate">
                            Placeholder: {field.placeholder}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveField(field.id, "up");
                          }}
                          disabled={idx === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded disabled:opacity-30"
                          title="Move up"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveField(field.id, "down");
                          }}
                          disabled={idx === sortedFields.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded disabled:opacity-30"
                          title="Move down"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteField(field.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-500 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR - Properties Panel */}
        <div className="w-80 border-l border-gray-200 bg-white overflow-y-auto flex-shrink-0">
          {selectedField ? (
            <FieldProperties
              field={selectedField}
              onUpdate={(updates) => updateField(selectedField.id, updates)}
              onClose={() => setSelectedFieldId(null)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <Type className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">
                No field selected
              </p>
              <p className="text-xs text-gray-500">
                Click a field on the canvas to edit its properties.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <PreviewModal
          fields={fields}
          formName={formName}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}

// =============================================================================
// FIELD PROPERTIES PANEL
// =============================================================================

function FieldProperties({
  field,
  onUpdate,
  onClose,
}: {
  field: FormField;
  onUpdate: (updates: Partial<FormField>) => void;
  onClose: () => void;
}) {
  const isLayoutField = ["heading", "paragraph", "divider", "spacer"].includes(
    field.type,
  );
  const hasOptions = ["dropdown", "radio", "checkbox"].includes(field.type);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
          Properties
        </h3>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Label */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Label
          </label>
          <input
            type="text"
            value={field.label}
            onChange={(e) => {
              const label = e.target.value;
              onUpdate({
                label,
                name: labelToName(label),
              });
            }}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#0891b2] focus:ring-2 focus:ring-cyan-100 outline-none transition-colors text-sm"
          />
        </div>

        {/* Name (auto-generated) */}
        {!isLayoutField && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Field Name
            </label>
            <input
              type="text"
              value={field.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#0891b2] focus:ring-2 focus:ring-cyan-100 outline-none transition-colors text-sm font-mono"
            />
            <p className="mt-1 text-xs text-gray-400">
              Auto-generated from label. Used as the field key.
            </p>
          </div>
        )}

        {/* Placeholder */}
        {!isLayoutField && field.type !== "checkbox" && field.type !== "radio" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Placeholder
            </label>
            <input
              type="text"
              value={field.placeholder}
              onChange={(e) => onUpdate({ placeholder: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#0891b2] focus:ring-2 focus:ring-cyan-100 outline-none transition-colors text-sm"
              placeholder="Enter placeholder text..."
            />
          </div>
        )}

        {/* Help Text */}
        {!isLayoutField && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Help Text
            </label>
            <input
              type="text"
              value={field.helpText}
              onChange={(e) => onUpdate({ helpText: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#0891b2] focus:ring-2 focus:ring-cyan-100 outline-none transition-colors text-sm"
              placeholder="Optional help text below the field"
            />
          </div>
        )}

        {/* Required Toggle */}
        {!isLayoutField && (
          <div className="flex items-center justify-between py-2">
            <label className="text-sm font-medium text-gray-700">
              Required
            </label>
            <button
              type="button"
              onClick={() => onUpdate({ required: !field.required })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                field.required ? "bg-[#0891b2]" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  field.required ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        )}

        {/* Width Selector */}
        {!isLayoutField && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Width
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["full", "half", "third"] as const).map((w) => (
                <button
                  key={w}
                  onClick={() => onUpdate({ width: w })}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors capitalize ${
                    field.width === w
                      ? "bg-cyan-50 border-[#0891b2] text-[#0891b2]"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {w === "full" ? "Full" : w === "half" ? "1/2" : "1/3"}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Options (for dropdown, radio, checkbox) */}
        {hasOptions && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Options
            </label>
            <div className="space-y-2">
              {field.options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={opt.label}
                    onChange={(e) => {
                      const newOptions = [...field.options];
                      newOptions[idx] = {
                        label: e.target.value,
                        value: labelToName(e.target.value),
                      };
                      onUpdate({ options: newOptions });
                    }}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 focus:border-[#0891b2] focus:ring-2 focus:ring-cyan-100 outline-none transition-colors text-sm"
                    placeholder={`Option ${idx + 1}`}
                  />
                  <button
                    onClick={() => {
                      const newOptions = field.options.filter(
                        (_, i) => i !== idx,
                      );
                      onUpdate({ options: newOptions });
                    }}
                    disabled={field.options.length <= 1}
                    className="p-1 text-gray-400 hover:text-red-500 rounded disabled:opacity-30"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                onClick={() =>
                  onUpdate({
                    options: [
                      ...field.options,
                      {
                        label: `Option ${field.options.length + 1}`,
                        value: `option_${field.options.length + 1}`,
                      },
                    ],
                  })
                }
                className="w-full flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-[#0891b2] hover:bg-cyan-50 rounded-lg border border-dashed border-gray-300 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add Option
              </button>
            </div>
          </div>
        )}

        {/* Field Type Info */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-400">
            Type: <span className="font-mono">{field.type}</span>
          </p>
          <p className="text-xs text-gray-400">
            ID: <span className="font-mono text-[10px]">{field.id}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
