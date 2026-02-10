"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteContact, deleteCompany, deleteDeal } from "@/app/actions/crm";

const deleteFns = {
  contact: deleteContact,
  company: deleteCompany,
  deal: deleteDeal,
} as const;

export default function DeleteButton({
  id,
  entityType,
  entityName,
}: {
  id: string;
  entityType: "contact" | "company" | "deal";
  entityName: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    setPending(true);
    await deleteFns[entityType](id);
  }

  if (confirming) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-gray-600">
          Delete <strong>{entityName}</strong>? This cannot be undone.
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            disabled={pending}
            className="flex-1 px-3 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {pending ? "Deleting..." : "Confirm"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            disabled={pending}
            className="flex-1 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 bg-white border border-gray-200 rounded-lg hover:bg-red-50 transition-colors"
    >
      <Trash2 className="w-4 h-4" />
      Delete
    </button>
  );
}
