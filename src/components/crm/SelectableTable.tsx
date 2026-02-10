"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import BulkActionBar, { type BulkModule } from "./BulkActionBar";

// ============================================
// TYPES
// ============================================

interface SelectableTableProps {
  items: { id: string }[];
  module: BulkModule;
  children: (props: {
    selectedIds: Set<string>;
    toggleItem: (id: string) => void;
    toggleAll: () => void;
    allSelected: boolean;
    someSelected: boolean;
  }) => React.ReactNode;
}

// ============================================
// COMPONENT
// ============================================

export default function SelectableTable({
  items,
  module,
  children,
}: SelectableTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const prevItemsRef = useRef<string>("");

  // Reset selection when items change (e.g. after search, after bulk action revalidates)
  useEffect(() => {
    const key = items.map((i) => i.id).join(",");
    if (prevItemsRef.current && prevItemsRef.current !== key) {
      setSelectedIds(new Set());
    }
    prevItemsRef.current = key;
  }, [items]);

  const allSelected = items.length > 0 && selectedIds.size === items.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  const toggleItem = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === items.length) {
        return new Set();
      }
      return new Set(items.map((i) => i.id));
    });
  }, [items]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleComplete = useCallback(() => {
    setSelectedIds(new Set());
    // The server action already calls revalidatePath, so the page will refresh
  }, []);

  return (
    <>
      {children({
        selectedIds,
        toggleItem,
        toggleAll,
        allSelected,
        someSelected,
      })}

      <BulkActionBar
        selectedIds={Array.from(selectedIds)}
        module={module}
        onClear={clearSelection}
        onComplete={handleComplete}
      />
    </>
  );
}
