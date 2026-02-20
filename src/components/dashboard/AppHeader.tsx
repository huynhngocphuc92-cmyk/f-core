"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronDown, Plus, Search } from "lucide-react";

import { COMMAND_PALETTE_OPEN_EVENT } from "@/components/crm/commandPaletteEvents";
import { useI18n } from "@/i18n/I18nProvider";

type CreateOption = {
  key: string;
  fallback: string;
  href: string;
};

const createOptions: CreateOption[] = [
  {
    key: "dashboard.header.createMenu.contact",
    fallback: "Contact",
    href: "/contacts/new",
  },
  {
    key: "dashboard.header.createMenu.company",
    fallback: "Company",
    href: "/companies/new",
  },
  {
    key: "dashboard.header.createMenu.deal",
    fallback: "Deal",
    href: "/deals/new",
  },
  {
    key: "dashboard.header.createMenu.ticket",
    fallback: "Ticket",
    href: "/tickets/new",
  },
  {
    key: "dashboard.header.createMenu.workflow",
    fallback: "Workflow",
    href: "/workflows/new",
  },
];

const sectionLabelMap: Record<string, { key: string; fallback: string }> = {
  dashboard: { key: "sidebar.navigation.dashboard", fallback: "Dashboard" },
  contacts: { key: "sidebar.navigation.contacts", fallback: "Contacts" },
  companies: { key: "sidebar.navigation.companies", fallback: "Companies" },
  deals: { key: "sidebar.navigation.deals", fallback: "Deals" },
  quotes: { key: "sidebar.navigation.quotes", fallback: "Quotes" },
  tickets: { key: "sidebar.navigation.tickets", fallback: "Tickets" },
  reports: { key: "sidebar.navigation.reports", fallback: "Reports" },
  workflows: { key: "sidebar.navigation.workflows", fallback: "Workflows" },
  service: { key: "sidebar.navigation.serviceInbox", fallback: "Service" },
  marketing: { key: "sidebar.navigation.marketing", fallback: "Marketing" },
  content: { key: "sidebar.navigation.contentBlog", fallback: "Content" },
  data: { key: "sidebar.navigation.dataSync", fallback: "Data" },
  settings: { key: "sidebar.bottom.settings", fallback: "Settings" },
  "ai-assistant": { key: "sidebar.navigation.aiCopilot", fallback: "AI Copilot" },
  commerce: { key: "sidebar.navigation.revenue", fallback: "Commerce" },
  sales: { key: "sidebar.navigation.salesForecast", fallback: "Sales" },
  "knowledge-base": {
    key: "sidebar.navigation.knowledgeBase",
    fallback: "Knowledge Base",
  },
};

function formatSegment(segment: string): string {
  return segment
    .split("-")
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

export default function AppHeader() {
  const pathname = usePathname();
  const { t } = useI18n();
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  const { sectionLabel, subSectionLabel } = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const section = segments[0] || "dashboard";
    const sectionConfig = sectionLabelMap[section];
    const resolvedSection = sectionConfig
      ? t(sectionConfig.key, sectionConfig.fallback)
      : formatSegment(section);
    const second = segments[1];
    return {
      sectionLabel: resolvedSection,
      subSectionLabel: second ? formatSegment(second) : null,
    };
  }, [pathname, t]);

  const openCommandPalette = () => {
    window.dispatchEvent(new Event(COMMAND_PALETTE_OPEN_EVENT));
  };

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-4 px-6">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            {t("dashboard.header.workspaceLabel", "Workspace")}
          </p>
          <p className="truncate text-sm font-semibold text-gray-900">
            {sectionLabel}
            {subSectionLabel ? (
              <span className="text-gray-500"> / {subSectionLabel}</span>
            ) : null}
          </p>
        </div>

        <button
          type="button"
          onClick={openCommandPalette}
          className="flex h-10 min-w-[220px] flex-1 items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 text-left text-sm text-gray-500 transition-colors hover:border-cyan-300 hover:bg-white hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-100"
          aria-label={t(
            "dashboard.header.search.ariaLabel",
            "Open global search"
          )}
        >
          <span className="flex items-center gap-2 overflow-hidden">
            <Search className="h-4 w-4 flex-shrink-0 text-gray-400" />
            <span className="truncate">
              {t(
                "dashboard.header.search.prompt",
                "Search contacts, companies, deals..."
              )}
            </span>
          </span>
          <kbd className="hidden rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-500 sm:inline-flex">
            ⌘K
          </kbd>
        </button>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCreateMenu((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0891b2] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0e7490]"
            >
              <Plus className="h-4 w-4" />
              {t("dashboard.header.createMenu.title", "Create")}
              <ChevronDown className="h-4 w-4" />
            </button>

            {showCreateMenu && (
              <>
                <button
                  type="button"
                  aria-label="close create menu"
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setShowCreateMenu(false)}
                />
                <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                  {createOptions.map((option) => (
                    <Link
                      key={option.key}
                      href={option.href}
                      onClick={() => setShowCreateMenu(false)}
                      className="block border-b border-gray-100 px-4 py-2.5 text-sm text-gray-700 transition-colors last:border-b-0 hover:bg-gray-50"
                    >
                      {t(option.key, option.fallback)}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            className="relative rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label={t(
              "dashboard.header.notifications",
              "View notifications"
            )}
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
          </button>

          <button
            type="button"
            className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-gray-100"
            aria-label={t("dashboard.header.profile", "Open profile menu")}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0891b2] text-sm font-semibold text-white">
              A
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
