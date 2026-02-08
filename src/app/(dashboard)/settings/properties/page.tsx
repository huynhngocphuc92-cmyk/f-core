"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Lock,
  Filter,
  Loader2,
  Settings,
} from "lucide-react";
import PropertyDefinitionForm from "@/components/properties/PropertyDefinitionForm";

interface PropertyDefinition {
  id: string;
  objectType: string;
  name: string;
  label: string;
  description: string | null;
  fieldType: string;
  options: { value: string; label: string }[] | null;
  isRequired: boolean;
  isReadonly: boolean;
  isSystem: boolean;
  groupName: string | null;
  orderIndex: number;
  defaultValue: string | null;
}

const OBJECT_TABS = [
  { id: "contact", label: "Contact Properties" },
  { id: "company", label: "Company Properties" },
  { id: "deal", label: "Deal Properties" },
];

const FIELD_TYPE_LABELS: Record<string, string> = {
  text: "Text",
  number: "Number",
  date: "Date",
  datetime: "Date & Time",
  select: "Dropdown",
  multiselect: "Multi-select",
  checkbox: "Checkbox",
  email: "Email",
  phone: "Phone",
  url: "URL",
};

export default function PropertySettingsPage() {
  const [objectType, setObjectType] = useState("contact");
  const [properties, setProperties] = useState<PropertyDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<PropertyDefinition | undefined>(undefined);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/properties?objectType=${objectType}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setProperties(json.data || []);
    } catch {
      setToast({ message: "Failed to load properties", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [objectType]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleDelete = async (id: string, label: string) => {
    if (!window.confirm(`Are you sure you want to delete the property "${label}"? This action cannot be undone.`)) {
      return;
    }
    setDeleting(id);
    try {
      const res = await fetch(`/api/properties/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      setProperties((prev) => prev.filter((p) => p.id !== id));
      setToast({ message: "Property deleted", type: "success" });
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "Failed to delete",
        type: "error",
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleFormSuccess = () => {
    const wasEditing = !!editData;
    setFormOpen(false);
    setEditData(undefined);
    fetchProperties();
    setToast({
      message: wasEditing ? "Property updated" : "Property created",
      type: "success",
    });
  };

  const openEdit = (prop: PropertyDefinition) => {
    setEditData(prop);
    setFormOpen(true);
  };

  const openCreate = () => {
    setEditData(undefined);
    setFormOpen(true);
  };

  // Filter and search
  const groups = Array.from(new Set(properties.map((p) => p.groupName || "Other")));
  const filtered = properties.filter((p) => {
    if (search) {
      const q = search.toLowerCase();
      if (!p.label.toLowerCase().includes(q) && !p.name.toLowerCase().includes(q)) return false;
    }
    if (filterGroup && (p.groupName || "Other") !== filterGroup) return false;
    return true;
  });

  // Group filtered results
  const groupedProperties: Record<string, PropertyDefinition[]> = {};
  for (const prop of filtered) {
    const group = prop.groupName || "Other";
    if (!groupedProperties[group]) groupedProperties[group] = [];
    groupedProperties[group].push(prop);
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Page header */}
      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3 mb-1">
          <Settings className="w-5 h-5 text-gray-400" />
          <h1 className="text-xl font-bold text-gray-900">Properties</h1>
        </div>
        <p className="text-sm text-gray-500 ml-8">
          Manage the properties that appear on your records. Properties store information about your contacts, companies, and deals.
        </p>
      </div>

      {/* Object type tabs */}
      <div className="px-6 bg-white border-b border-gray-200">
        <div className="flex gap-0">
          {OBJECT_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setObjectType(tab.id);
                setSearch("");
                setFilterGroup(null);
              }}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                objectType === tab.id
                  ? "border-[#0891b2] text-[#0891b2]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-6 py-3 bg-white border-b border-gray-200 flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search properties..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#0891b2] focus:border-[#0891b2]"
          />
        </div>

        {/* Group filter */}
        <div className="relative">
          <select
            value={filterGroup || ""}
            onChange={(e) => setFilterGroup(e.target.value || null)}
            className="pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#0891b2] focus:border-[#0891b2] appearance-none bg-white"
          >
            <option value="">All groups</option>
            {groups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Create button */}
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#0891b2] text-white rounded-md text-sm font-semibold hover:bg-[#0ea5e9] transition-colors ml-auto"
        >
          <Plus className="w-4 h-4" />
          Create property
        </button>
      </div>

      {/* Property list */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Settings className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-1">
              {search ? "No properties match your search" : "No properties defined"}
            </p>
            {!search && (
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-1 mt-2 text-sm text-[#0891b2] hover:text-[#0ea5e9] font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                Create your first property
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedProperties).map(([groupName, groupProps]) => (
              <div key={groupName}>
                {/* Group header */}
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {groupName}
                  </h3>
                  <span className="text-xs text-gray-400">({groupProps.length})</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Properties table */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left">
                        <th className="px-4 py-2.5 font-medium text-gray-500">Label</th>
                        <th className="px-4 py-2.5 font-medium text-gray-500">Internal Name</th>
                        <th className="px-4 py-2.5 font-medium text-gray-500">Type</th>
                        <th className="px-4 py-2.5 font-medium text-gray-500 text-center">Required</th>
                        <th className="px-4 py-2.5 font-medium text-gray-500 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {groupProps.map((prop) => (
                        <tr
                          key={prop.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              {prop.isSystem && (
                                <Lock className="w-3.5 h-3.5 text-gray-400" />
                              )}
                              <span className="font-medium text-gray-900">{prop.label}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-gray-500 font-mono text-xs">
                            {prop.name}
                          </td>
                          <td className="px-4 py-2.5 text-gray-500">
                            {FIELD_TYPE_LABELS[prop.fieldType] || prop.fieldType}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {prop.isRequired && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                                Required
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <div className="flex items-center gap-1 justify-end">
                              <button
                                onClick={() => openEdit(prop)}
                                className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                title="Edit property"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              {!prop.isSystem && (
                                <button
                                  onClick={() => handleDelete(prop.id, prop.label)}
                                  disabled={deleting === prop.id}
                                  className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                                  title="Delete property"
                                >
                                  {deleting === prop.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary bar */}
      <div className="px-6 py-2 bg-white border-t border-gray-200 text-xs text-gray-500">
        {filtered.length} {filtered.length === 1 ? "property" : "properties"}
        {search && ` matching "${search}"`}
        {filterGroup && ` in ${filterGroup}`}
      </div>

      {/* Form */}
      <PropertyDefinitionForm
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditData(undefined);
        }}
        onSuccess={handleFormSuccess}
        editData={editData}
        objectType={objectType}
      />

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-[70] px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
            toast.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
