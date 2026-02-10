"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, Check, X } from "lucide-react";
import { updateEntityProperties } from "@/app/actions/properties";

type PropertyDef = {
  id: string;
  name: string;
  label: string;
  fieldType: string;
  options: unknown;
  isRequired: boolean;
  groupName: string | null;
  description: string | null;
  defaultValue: string | null;
};

export default function CustomProperties({
  entityType,
  entityId,
  properties,
  propertyDefs,
}: {
  entityType: "contact" | "company" | "deal";
  entityId: string;
  properties: Record<string, string>;
  propertyDefs: PropertyDef[];
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (propertyDefs.length === 0) return null;

  function startEdit(name: string, currentValue: string) {
    setEditing(name);
    setEditValue(currentValue);
  }

  function cancelEdit() {
    setEditing(null);
    setEditValue("");
  }

  function saveEdit(name: string) {
    startTransition(async () => {
      await updateEntityProperties(entityType, entityId, name, editValue || null);
      setEditing(null);
      setEditValue("");
      router.refresh();
    });
  }

  function renderInput(def: PropertyDef) {
    const options = def.options as { value: string; label: string }[] | null;

    switch (def.fieldType) {
      case "select":
        return (
          <select
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#0891b2] bg-white"
          >
            <option value="">-- None --</option>
            {options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );
      case "multiselect":
        return (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#0891b2]"
            placeholder="Comma-separated values"
          />
        );
      case "checkbox":
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={editValue === "true"}
              onChange={(e) => setEditValue(e.target.checked ? "true" : "false")}
              className="rounded border-gray-300 text-[#0891b2]"
            />
            <span className="text-sm text-gray-700">
              {editValue === "true" ? "Yes" : "No"}
            </span>
          </label>
        );
      case "number":
        return (
          <input
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#0891b2]"
          />
        );
      case "date":
        return (
          <input
            type="date"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#0891b2]"
          />
        );
      default:
        return (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#0891b2]"
            placeholder={def.defaultValue || ""}
          />
        );
    }
  }

  function formatValue(def: PropertyDef, value: string | undefined) {
    if (!value) return "-";
    if (def.fieldType === "checkbox") return value === "true" ? "Yes" : "No";
    if (def.fieldType === "select") {
      const options = def.options as { value: string; label: string }[] | null;
      return options?.find((o) => o.value === value)?.label || value;
    }
    return value;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <SlidersHorizontal className="w-4 h-4 text-[#0891b2]" />
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Custom Properties
        </h3>
      </div>
      <div className="space-y-3">
        {propertyDefs.map((def) => {
          const value = properties[def.name];
          const isEditing = editing === def.name;

          return (
            <div key={def.id}>
              <p className="text-xs text-gray-500">{def.label}</p>
              {isEditing ? (
                <div className="flex items-center gap-1 mt-1">
                  <div className="flex-1">{renderInput(def)}</div>
                  <button
                    onClick={() => saveEdit(def.name)}
                    disabled={isPending}
                    className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="p-1 text-gray-400 hover:bg-gray-50 rounded"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <p
                  className="text-sm text-gray-900 mt-0.5 cursor-pointer hover:text-[#0891b2] transition-colors"
                  onClick={() => startEdit(def.name, value || "")}
                  title="Click to edit"
                >
                  {formatValue(def, value)}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
