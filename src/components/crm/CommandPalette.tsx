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
import { COMMAND_PALETTE_OPEN_EVENT } from "@/components/crm/commandPaletteEvents";
import { useI18n } from "@/i18n/I18nProvider";

interface ResultGroup {
  key: keyof GroupedSearchResults;
  label: string;
  icon: React.ElementType;
  items: SearchResult[];
}

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
  const { t } = useI18n();

  const closePalette = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults({ contacts: [], companies: [], deals: [], tickets: [] });
    setHasSearched(false);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (open) {
          closePalette();
        } else {
          setOpen(true);
        }
      }
      if (e.key === "Escape") {
        closePalette();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closePalette, open]);

  useEffect(() => {
    function handleOpenEvent() {
      setOpen(true);
    }

    window.addEventListener(COMMAND_PALETTE_OPEN_EVENT, handleOpenEvent);
    return () => {
      window.removeEventListener(COMMAND_PALETTE_OPEN_EVENT, handleOpenEvent);
    };
  }, []);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleSearch = useCallback((value: string) => {
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
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleOverlayClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) {
      closePalette();
    }
  }, [closePalette]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      closePalette();
      router.push(result.link);
    },
    [closePalette, router]
  );

  const groups: ResultGroup[] = [
    {
      key: "contacts",
      label: t("dashboard.commandPalette.groups.contacts", "Contacts"),
      icon: Users,
      items: results.contacts,
    },
    {
      key: "companies",
      label: t("dashboard.commandPalette.groups.companies", "Companies"),
      icon: Building2,
      items: results.companies,
    },
    {
      key: "deals",
      label: t("dashboard.commandPalette.groups.deals", "Deals"),
      icon: CircleDollarSign,
      items: results.deals,
    },
    {
      key: "tickets",
      label: t("dashboard.commandPalette.groups.tickets", "Tickets"),
      icon: Ticket,
      items: results.tickets,
    },
  ];

  const totalResults = groups.reduce((sum, g) => sum + g.items.length, 0);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[15vh] backdrop-blur-sm"
    >
      <div className="animate-in slide-in-from-top-4 fade-in w-full max-w-xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl duration-200">
        <div className="flex items-center gap-3 border-b border-gray-100 px-4">
          <Search className="h-5 w-5 flex-shrink-0 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={t(
              "dashboard.commandPalette.placeholder",
              "Search contacts, companies, deals, tickets..."
            )}
            className="flex-1 bg-transparent py-4 text-sm text-gray-900 outline-none placeholder:text-gray-400"
          />
          {isPending && (
            <div className="h-4 w-4 flex-shrink-0 animate-spin rounded-full border-2 border-gray-300 border-t-[#0891b2]" />
          )}
          <kbd className="hidden items-center gap-0.5 rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 sm:inline-flex">
            ⌘K
          </kbd>
          <button
            onClick={closePalette}
            className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {hasSearched && totalResults === 0 && (
            <div className="py-12 text-center">
              <Search className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              <p className="text-sm text-gray-500">
                {t(
                  "dashboard.commandPalette.empty.title",
                  "No results found"
                )}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {t(
                  "dashboard.commandPalette.empty.subtitle",
                  "Try a different search term"
                )}
              </p>
            </div>
          )}

          {groups.map((group) => {
            if (group.items.length === 0) return null;
            const Icon = group.icon;

            return (
              <div key={group.key}>
                <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2">
                  <Icon className="h-3.5 w-3.5 text-gray-500" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {group.label}
                  </span>
                  <span className="text-xs text-gray-400">
                    ({group.items.length})
                  </span>
                </div>

                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className="last:border-b-0 flex w-full cursor-pointer items-center gap-3 border-b border-gray-50 px-4 py-3 text-left transition-colors hover:bg-gray-50"
                  >
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
                      <Icon className="h-4 w-4 text-gray-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {item.name}
                      </p>
                      {item.subtitle && (
                        <p className="truncate text-xs text-gray-500">
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

        {!hasSearched && (
          <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
            <p className="text-center text-xs text-gray-400">
              {t(
                "dashboard.commandPalette.hint",
                "Type at least 2 characters to search across your CRM"
              )}
            </p>
          </div>
        )}

        {hasSearched && totalResults > 0 && (
          <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-2.5">
            <p className="text-xs text-gray-400">
              {totalResults === 1
                ? t("dashboard.commandPalette.footer.singular", "{count} result found", {
                    count: totalResults,
                  })
                : t("dashboard.commandPalette.footer.plural", "{count} results found", {
                    count: totalResults,
                  })}
            </p>
            <p className="text-xs text-gray-400">
              <kbd className="rounded border border-gray-200 bg-gray-100 px-1 py-0.5 text-[10px] font-medium">
                esc
              </kbd>{" "}
              {t("dashboard.commandPalette.footer.closeHint", "to close")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
