"use client";

import { useState, useCallback } from "react";
import { ChevronDown, ChevronRight, Pencil, Check, X } from "lucide-react";
import PropertyField from "./PropertyField";

interface PropertyDefinition {
  id: string;
  name: string;
  label: string;
  fieldType: string;
  options?: { value: string; label: string }[] | null;
  isRequired: boolean;
  isReadonly: boolean;
  isSystem: boolean;
  groupName: string | null;
  orderIndex: number;
}

interface PropertyEditorProps {
  objectType: "contact" | "company" | "deal";
  properties: PropertyDefinition[];
  values: Record<string, unknown>;
  onSave?: (name: string, value: unknown) => Promise<void>;
  groups?: Record<string, PropertyDefinition[]>;
}

interface PropertyRowProps {
  property: PropertyDefinition;
  value: unknown;
  onSave?: (name: string, value: unknown) => Promise<void>;
}

function PropertyRow({ property, value, onSave }: PropertyRowProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState<unknown>(value);
  const [saving, setSaving] = useState(false);

  const handleEdit = () => {
    setEditValue(value);
    setEditing(true);
  };

  const handleCancel = () => {
    setEditValue(value);
    setEditing(false);
  };

  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave(property.name, editValue);
      setEditing(false);
    } catch {
      // Keep editing on error
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="group flex items-start gap-2 py-2 px-3 -mx-3 rounded-md hover:bg-gray-50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-gray-500 mb-0.5">{property.label}</div>
        <div className="min-h-[24px] flex items-center">
          <PropertyField
            name={property.name}
            label={property.label}
            fieldType={property.fieldType}
            value={editValue as string | number | boolean | string[] | null}
            options={property.options}
            isRequired={property.isRequired}
            isReadonly={property.isReadonly}
            onChange={(v) => setEditValue(v)}
            editMode={editing}
          />
        </div>
      </div>

      {/* Edit controls */}
      {!property.isReadonly && onSave && (
        <div className="flex-shrink-0 mt-4">
          {editing ? (
            <div className="flex items-center gap-1">
              <button
                onClick={handleSave}
                disabled={saving}
                className="p-1 rounded text-green-600 hover:bg-green-50 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="p-1 rounded text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleEdit}
              className="p-1 rounded text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-all"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function PropertyGroup({
  name,
  properties,
  values,
  onSave,
  defaultExpanded = false,
}: {
  name: string;
  properties: PropertyDefinition[];
  values: Record<string, unknown>;
  onSave?: (name: string, value: unknown) => Promise<void>;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full py-2.5 px-3 text-left hover:bg-gray-50 transition-colors"
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {name}
        </span>
        <span className="text-xs text-gray-400">({properties.length})</span>
      </button>

      {expanded && (
        <div className="px-3 pb-2">
          {properties.map((prop) => (
            <PropertyRow
              key={prop.id}
              property={prop}
              value={values[prop.name] ?? null}
              onSave={onSave}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PropertyEditor({
  objectType,
  properties,
  values,
  onSave,
  groups: groupsProp,
}: PropertyEditorProps) {
  // Group properties by groupName
  const groups = groupsProp || (() => {
    const g: Record<string, PropertyDefinition[]> = {};
    for (const prop of properties) {
      const group = prop.groupName || "Other";
      if (!g[group]) g[group] = [];
      g[group].push(prop);
    }
    return g;
  })();

  const groupNames = Object.keys(groups);

  const handleSave = useCallback(
    async (name: string, value: unknown) => {
      if (onSave) {
        await onSave(name, value);
      }
    },
    [onSave]
  );

  const objectLabel = objectType === "contact" ? "Contact" : objectType === "company" ? "Company" : "Deal";

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">About this {objectLabel}</h3>
      </div>

      <div className="divide-y divide-gray-100">
        {groupNames.map((groupName, idx) => (
          <PropertyGroup
            key={groupName}
            name={groupName}
            properties={groups[groupName]}
            values={values}
            onSave={handleSave}
            defaultExpanded={idx === 0}
          />
        ))}
      </div>

      {properties.length === 0 && (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-gray-500">No properties defined</p>
        </div>
      )}
    </div>
  );
}
