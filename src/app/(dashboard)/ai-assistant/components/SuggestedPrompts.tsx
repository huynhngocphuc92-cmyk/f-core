"use client";

import {
  Search,
  BarChart3,
  Mail,
  CalendarCheck,
  Users,
  CircleDollarSign,
} from "lucide-react";

import { useI18n } from "@/i18n/I18nProvider";

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
}

export function SuggestedPrompts({ onSelect }: SuggestedPromptsProps) {
  const { t } = useI18n();

  const prompts = [
    {
      key: "searchContacts",
      icon: Search,
    },
    {
      key: "pipelineSummary",
      icon: CircleDollarSign,
    },
    {
      key: "topDeals",
      icon: Users,
    },
    {
      key: "dealAnalysis",
      icon: BarChart3,
    },
    {
      key: "createTask",
      icon: CalendarCheck,
    },
    {
      key: "draftEmail",
      icon: Mail,
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {prompts.map((item) => (
        <button
          key={item.key}
          onClick={() =>
            onSelect(
              t(
                `dashboard.aiAssistant.prompts.${item.key}.prompt`,
                "Help me with CRM"
              )
            )
          }
          className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-sm text-gray-700 transition-colors hover:border-[#0891b2] hover:bg-[#0891b2]/5"
        >
          <item.icon className="h-4 w-4 flex-shrink-0 text-[#0891b2]" />
          <span>
            {t(`dashboard.aiAssistant.prompts.${item.key}.label`, "Prompt")}
          </span>
        </button>
      ))}
    </div>
  );
}
