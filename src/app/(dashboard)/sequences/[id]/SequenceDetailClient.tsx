"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Pause, Pencil, Trash2 } from "lucide-react";
import { toggleSequence, deleteSequence } from "@/app/actions/sequences";

interface SequenceDetailClientProps {
  sequenceId: string;
  status: string;
  name: string;
  description: string;
  steps: Record<string, unknown>[];
}

export function SequenceDetailClient({
  sequenceId,
  status,
  name,
  description,
  steps,
}: SequenceDetailClientProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const handleToggle = async () => {
    setBusy("toggle");
    try {
      await toggleSequence(sequenceId, status !== "active");
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this sequence?")) return;
    setBusy("delete");
    try {
      await deleteSequence(sequenceId);
      router.push("/sequences");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleToggle}
        disabled={busy !== null}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
          status === "active"
            ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200"
            : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
        } disabled:opacity-50`}
      >
        {status === "active" ? (
          <>
            <Pause className="w-4 h-4" />
            {busy === "toggle" ? "Pausing..." : "Pause"}
          </>
        ) : (
          <>
            <Play className="w-4 h-4" />
            {busy === "toggle" ? "Activating..." : "Activate"}
          </>
        )}
      </button>
      <button
        onClick={handleDelete}
        disabled={busy !== null}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 border border-red-200 transition-colors disabled:opacity-50"
      >
        <Trash2 className="w-4 h-4" />
        {busy === "delete" ? "Deleting..." : "Delete"}
      </button>
    </div>
  );
}
