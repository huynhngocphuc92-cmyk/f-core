"use client";

import {
  Search,
  BarChart3,
  Mail,
  CalendarCheck,
  Users,
  CircleDollarSign,
} from "lucide-react";

const prompts = [
  {
    icon: Search,
    label: "Search contacts",
    prompt: "Search for contacts named John",
  },
  {
    icon: CircleDollarSign,
    label: "Pipeline summary",
    prompt: "Show me the pipeline summary for this quarter",
  },
  {
    icon: Users,
    label: "Top deals",
    prompt: "List my top 5 deals by value",
  },
  {
    icon: BarChart3,
    label: "Deal analysis",
    prompt: "How many deals are in each pipeline stage?",
  },
  {
    icon: CalendarCheck,
    label: "Create a task",
    prompt: "Create a follow-up task for tomorrow",
  },
  {
    icon: Mail,
    label: "Draft email",
    prompt: "Help me draft a follow-up email for a prospect",
  },
];

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
}

export function SuggestedPrompts({ onSelect }: SuggestedPromptsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {prompts.map((item) => (
        <button
          key={item.label}
          onClick={() => onSelect(item.prompt)}
          className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-sm text-gray-700 transition-colors hover:border-[#0891b2] hover:bg-[#0891b2]/5"
        >
          <item.icon className="h-4 w-4 flex-shrink-0 text-[#0891b2]" />
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}
