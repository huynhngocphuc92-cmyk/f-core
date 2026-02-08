"use client";

import { useRouter } from "next/navigation";

interface WorkflowStatusToggleProps {
  workflowId: string;
  currentStatus: string;
}

export function WorkflowStatusToggle({
  workflowId,
  currentStatus,
}: WorkflowStatusToggleProps) {
  const router = useRouter();
  const isActive = currentStatus === "active";
  const isDraft = currentStatus === "draft";

  async function toggleStatus() {
    const newStatus = isActive ? "paused" : "active";
    await fetch(`/api/workflows/${workflowId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    router.refresh();
  }

  if (isDraft) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
        Draft
      </span>
    );
  }

  return (
    <button
      onClick={toggleStatus}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        isActive ? "bg-green-500" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
          isActive ? "translate-x-4" : "translate-x-1"
        }`}
      />
    </button>
  );
}
