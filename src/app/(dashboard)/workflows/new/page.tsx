"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, Building2, Briefcase } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const OBJECT_TYPES = [
  {
    value: "contact",
    label: "Contact",
    icon: Users,
    description: "Trigger based on contact properties",
  },
  {
    value: "company",
    label: "Company",
    icon: Building2,
    description: "Trigger based on company properties",
  },
  {
    value: "deal",
    label: "Deal",
    icon: Briefcase,
    description: "Trigger based on deal properties",
  },
];

export default function NewWorkflowPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [objectType, setObjectType] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (!name.trim() || !objectType) return;
    setCreating(true);

    const res = await fetch("/api/workflows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, objectType }),
    });

    if (res.ok) {
      const workflow = await res.json();
      router.push(`/workflows/${workflow.id}/builder`);
    } else {
      setCreating(false);
    }
  }

  return (
    <div className="p-6 pt-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/workflows"
          className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          Create workflow
        </h1>
      </div>

      {/* Step 1: Object Type */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">
          Choose object type
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {OBJECT_TYPES.map((obj) => (
            <button
              key={obj.value}
              onClick={() => setObjectType(obj.value)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                objectType === obj.value
                  ? "border-[#0891b2] bg-cyan-50"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              )}
            >
              <obj.icon
                className={cn(
                  "w-6 h-6",
                  objectType === obj.value
                    ? "text-[#0891b2]"
                    : "text-gray-400"
                )}
              />
              <span className="text-sm font-medium text-gray-900">
                {obj.label}
              </span>
              <span className="text-xs text-gray-500 text-center">
                {obj.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Name & Description */}
      <div className="space-y-4 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Workflow name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Welcome new contacts"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this workflow do?"
            rows={3}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2] resize-none"
          />
        </div>
      </div>

      {/* Create Button */}
      <button
        onClick={handleCreate}
        disabled={!name.trim() || !objectType || creating}
        className={cn(
          "w-full py-2.5 rounded-lg text-sm font-medium transition-colors",
          name.trim() && objectType && !creating
            ? "bg-[#0891b2] text-white hover:bg-[#0ea5e9]"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
        )}
      >
        {creating ? "Creating..." : "Create workflow"}
      </button>
    </div>
  );
}
