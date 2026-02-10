"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markAllAsRead, markAsRead } from "@/app/actions/notifications";

// =============================================================================
// MARK ALL READ BUTTON
// =============================================================================

export function MarkAllReadButton() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    startTransition(async () => {
      await markAllAsRead();
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#0891b2] bg-[#0891b2]/10 rounded-lg hover:bg-[#0891b2]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isPending ? (
        <>
          <div className="w-3.5 h-3.5 border-2 border-[#0891b2]/30 border-t-[#0891b2] rounded-full animate-spin" />
          Marking...
        </>
      ) : (
        "Mark All Read"
      )}
    </button>
  );
}

// =============================================================================
// MARK READ BUTTON (single notification)
// =============================================================================

export function MarkReadButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    startTransition(async () => {
      await markAsRead(id);
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="text-xs font-medium text-[#0891b2] hover:text-[#0e7490] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
    >
      {isPending ? "Marking..." : "Mark as Read"}
    </button>
  );
}
