import { Bot } from "lucide-react";
import { AIAssistantClient } from "./components/AIAssistantClient";
import { getServerI18n } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function AIAssistantPage() {
  const { t } = await getServerI18n();

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0891b2]">
          <Bot className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            {t("dashboard.aiAssistant.title", "F-CORE Copilot")}
          </h1>
          <p className="text-xs text-gray-500">
            {t("dashboard.aiAssistant.subtitle", "AI-powered CRM assistant")}
          </p>
        </div>
      </div>

      {/* Chat Area */}
      <AIAssistantClient />
    </div>
  );
}
