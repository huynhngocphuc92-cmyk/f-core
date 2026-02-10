"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Search, Loader2 } from "lucide-react";

type SearchResult = { id: string; label: string; subtitle?: string };

export default function AssociationPicker({
  associationType,
  existingIds,
  searchAction,
  addAction,
}: {
  associationType: "contact" | "company" | "deal";
  existingIds: string[];
  searchAction: (query: string) => Promise<SearchResult[]>;
  addAction: (targetId: string) => Promise<{ error?: string; success?: boolean }>;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const debounceRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
        setResults([]);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  function handleSearch(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 1) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const res = await searchAction(value);
      setResults(res.filter((r) => !existingIds.includes(r.id)));
      setSearching(false);
    }, 250);
  }

  function handleAdd(targetId: string) {
    startTransition(async () => {
      await addAction(targetId);
      setOpen(false);
      setQuery("");
      setResults([]);
      router.refresh();
    });
  }

  const label = associationType === "contact" ? "contact" : associationType === "company" ? "company" : "deal";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        disabled={isPending}
        className="inline-flex items-center gap-1 text-xs text-[#0891b2] hover:text-[#0e7490] font-medium transition-colors disabled:opacity-50"
      >
        <Plus className="w-3.5 h-3.5" />
        Add
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-72 bg-white rounded-lg border border-gray-200 shadow-lg z-20">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={`Search ${label}s...`}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#0891b2]"
              />
              {searching && (
                <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 animate-spin" />
              )}
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {results.length === 0 && query.length > 0 && !searching ? (
              <p className="text-xs text-gray-500 p-3 text-center">No results found</p>
            ) : (
              results.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleAdd(r.id)}
                  disabled={isPending}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-gray-900 truncate">{r.label}</p>
                    {r.subtitle && (
                      <p className="text-xs text-gray-500 truncate">{r.subtitle}</p>
                    )}
                  </div>
                </button>
              ))
            )}
            {query.length === 0 && (
              <p className="text-xs text-gray-400 p-3 text-center">Type to search</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function RemoveAssociationButton({
  removeAction,
}: {
  removeAction: () => Promise<{ error?: string; success?: boolean }>;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleRemove(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      await removeAction();
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleRemove}
      disabled={isPending}
      className="p-1 text-gray-300 hover:text-red-500 transition-colors rounded opacity-0 group-hover:opacity-100 disabled:opacity-50 ml-auto shrink-0"
      title="Remove"
    >
      <X className="w-3.5 h-3.5" />
    </button>
  );
}
