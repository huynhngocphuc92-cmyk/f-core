import { Bot } from "lucide-react";
import { AIAssistantClient } from "./components/AIAssistantClient";

export const dynamic = "force-dynamic";

export default function AIAssistantPage() {
  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0891b2]">
          <Bot className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            F-CORE Copilot
          </h1>
          <p className="text-xs text-gray-500">
            AI-powered CRM assistant
          </p>
        </div>
      </div>

      {/* Chat Area */}
      <AIAssistantClient />
    </div>
  );
}
