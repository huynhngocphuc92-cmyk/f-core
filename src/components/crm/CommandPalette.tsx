"use client";

import { useState, useEffect, useRef, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Users,
  Building2,
  CircleDollarSign,
  Ticket,
  X,
} from "lucide-react";
import {
  globalSearch,
  type GroupedSearchResults,
  type SearchResult,
} from "@/app/actions/search";

// =============================================================================
// TYPES
// =============================================================================

interface ResultGroup {
  key: keyof GroupedSearchResults;
  label: string;
  icon: React.ElementType;
  items: SearchResult[];
}

// =============================================================================
// COMMAND PALETTE COMPONENT
// =============================================================================

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GroupedSearchResults>({
    contacts: [],
    companies: [],
    deals: [],
    tickets: [],
  });
  const [hasSearched, setHasSearched] = useState(false);
  const [isPending, startTransition] = useTransition();

  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  // ---------------------------------------------------------------------------
  // Keyboard shortcut: Cmd+K to open, Escape to close
  // ---------------------------------------------------------------------------
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ---------------------------------------------------------------------------
  // Auto-focus input when modal opens
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (open) {
      // Small delay to ensure the modal is rendered before focusing
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    } else {
      // Reset state when closing
      setQuery("");
      setResults({ contacts: [], companies: [], deals: [], tickets: [] });
      setHasSearched(false);
    }
  }, [open]);

  // ---------------------------------------------------------------------------
  // Debounced search
  // ---------------------------------------------------------------------------
  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      if (value.trim().length < 2) {
        setResults({ contacts: [], companies: [], deals: [], tickets: [] });
        setHasSearched(false);
        return;
      }

      debounceRef.current = setTimeout(() => {
        startTransition(async () => {
          const data = await globalSearch(value);
          setResults(data);
          setHasSearched(true);
        });
      }, 300);
    },
    []
  );

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Click outside to close
  // ---------------------------------------------------------------------------
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === overlayRef.current) {
        setOpen(false);
      }
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Navigate to result
  // ---------------------------------------------------------------------------
  const handleSelect = useCallback(
    (result: SearchResult) => {
      setOpen(false);
      router.push(result.link);
    },
    [router]
  );

  // ---------------------------------------------------------------------------
  // Build grouped results for rendering
  // ---------------------------------------------------------------------------
  const groups: ResultGroup[] = [
    {
      key: "contacts",
      label: "Contacts",
      icon: Users,
      items: results.contacts,
    },
    {
      key: "companies",
      label: "Companies",
      icon: Building2,
      items: results.companies,
    },
    {
      key: "deals",
      label: "Deals",
      icon: CircleDollarSign,
      items: results.deals,
    },
    {
      key: "tickets",
      label: "Tickets",
      icon: Ticket,
      items: results.tickets,
    },
  ];

  const totalResults = groups.reduce((sum, g) => sum + g.items.length, 0);

  // ---------------------------------------------------------------------------
  // Don't render anything if not open
  // ---------------------------------------------------------------------------
  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm"
    >
      <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 border-b border-gray-100">
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search contacts, companies, deals, tickets..."
            className="flex-1 py-4 text-sm text-gray-900 placeholder:text-gray-400 outline-none bg-transparent"
          />
          {isPending && (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-[#0891b2] rounded-full animate-spin flex-shrink-0" />
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200 text-[10px] font-medium text-gray-500">
            ⌘K
          </kbd>
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {hasSearched && totalResults === 0 && (
            <div className="py-12 text-center">
              <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No results found</p>
              <p className="text-xs text-gray-400 mt-1">
                Try a different search term
              </p>
            </div>
          )}

          {groups.map((group) => {
            if (group.items.length === 0) return null;
            const Icon = group.icon;

            return (
              <div key={group.key}>
                {/* Group Header */}
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100">
                  <Icon className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {group.label}
                  </span>
                  <span className="text-xs text-gray-400">
                    ({group.items.length})
                  </span>
                </div>

                {/* Group Items */}
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left cursor-pointer border-b border-gray-50 last:border-b-0"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.name}
                      </p>
                      {item.subtitle && (
                        <p className="text-xs text-gray-500 truncate">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            );
          })}
        </div>

        {/* Footer Hint */}
        {!hasSearched && (
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-400 text-center">
              Type at least 2 characters to search across your CRM
            </p>
          </div>
        )}

        {hasSearched && totalResults > 0 && (
          <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {totalResults} result{totalResults !== 1 ? "s" : ""} found
            </p>
            <p className="text-xs text-gray-400">
              <kbd className="px-1 py-0.5 rounded bg-gray-100 border border-gray-200 text-[10px] font-medium">
                esc
              </kbd>{" "}
              to close
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
