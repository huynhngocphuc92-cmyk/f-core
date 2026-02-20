"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Send,
  Loader2,
  Plus,
  Trash2,
  MessageSquare,
  Bot,
} from "lucide-react";

import { useI18n } from "@/i18n/I18nProvider";

import { MessageBubble } from "./MessageBubble";
import { SuggestedPrompts } from "./SuggestedPrompts";

interface Conversation {
  id: string;
  title: string | null;
  createdAt: string;
  _count?: { messages: number };
}

export function AIAssistantClient() {
  const { t } = useI18n();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/ai/chat",
        body: () => ({ conversationId }),
      }),
    [conversationId]
  );

  const { messages, status, sendMessage, setMessages } = useChat({
    transport,
    onError: (err) => {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant" as const,
          parts: [
            {
              type: "text" as const,
              text: t(
                "dashboard.aiAssistant.client.errors.responseFailed",
                "Error: {message}",
                {
                  message:
                    err.message ||
                    t(
                      "dashboard.aiAssistant.client.errors.defaultMessage",
                      "Failed to get response. Check your API key configuration."
                    ),
                }
              ),
            },
          ],
        },
      ]);
    },
  });

  const isLoading = status === "submitted" || status === "streaming";

  const fetchConversations = useCallback(async (): Promise<Conversation[]> => {
    try {
      const res = await fetch("/api/ai/conversations");
      if (res.ok) {
        const data = await res.json();
        return data.data || [];
      }
    } catch {
      // Silently fail: conversation list is not critical.
    }
    return [];
  }, []);

  const loadConversations = useCallback(async () => {
    const nextConversations = await fetchConversations();
    setConversations(nextConversations);
  }, [fetchConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    let active = true;
    void fetchConversations().then((nextConversations) => {
      if (active) {
        setConversations(nextConversations);
      }
    });
    return () => {
      active = false;
    };
  }, [fetchConversations]);

  const createNewConversation = useCallback(async () => {
    try {
      const res = await fetch("/api/ai/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const conv = await res.json();
        setConversationId(conv.id);
        setMessages([]);
        await loadConversations();
      }
    } catch {
      setConversationId(null);
      setMessages([]);
    }
  }, [loadConversations, setMessages]);

  const loadConversation = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/ai/conversations/${id}`);
        if (res.ok) {
          const conv = await res.json();
          setConversationId(conv.id);
          const restored = (conv.messages || []).map(
            (message: { id: string; role: string; content: string }) => ({
              id: message.id,
              role: message.role as "user" | "assistant",
              parts: [{ type: "text" as const, text: message.content }],
            })
          );
          setMessages(restored);
        }
      } catch {
        // Ignore load errors.
      }
    },
    [setMessages]
  );

  const deleteConversation = useCallback(
    async (id: string) => {
      try {
        await fetch(`/api/ai/conversations/${id}`, { method: "DELETE" });
        if (conversationId === id) {
          setConversationId(null);
          setMessages([]);
        }
        await loadConversations();
      } catch {
        // Ignore delete errors.
      }
    },
    [conversationId, loadConversations, setMessages]
  );

  function handleSuggestedPrompt(prompt: string) {
    setInputValue(prompt);
  }

  async function handleFormSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const text = inputValue;
    setInputValue("");
    await sendMessage({ text });
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {sidebarOpen && (
        <div className="flex w-64 flex-col border-r border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between p-3">
            <span className="text-xs font-semibold uppercase text-gray-500">
              {t("dashboard.aiAssistant.client.conversations", "Conversations")}
            </span>
            <button
              onClick={createNewConversation}
              className="rounded-md p-1.5 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
              title={t(
                "dashboard.aiAssistant.client.newConversationTitle",
                "New conversation"
              )}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-0.5 overflow-y-auto px-2">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                  conversationId === conv.id
                    ? "bg-[#0891b2]/10 text-[#0891b2]"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => loadConversation(conv.id)}
              >
                <MessageSquare className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="flex-1 truncate">
                  {conv.title ||
                    t(
                      "dashboard.aiAssistant.client.newConversation",
                      "New conversation"
                    )}
                </span>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    deleteConversation(conv.id);
                  }}
                  className="hidden rounded p-0.5 text-gray-400 hover:text-red-500 group-hover:block"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}

            {conversations.length === 0 && (
              <div className="px-3 py-8 text-center text-xs text-gray-400">
                {t(
                  "dashboard.aiAssistant.client.noConversations",
                  "No conversations yet"
                )}
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 p-2">
            <button
              onClick={() => setSidebarOpen(false)}
              className="w-full rounded-lg px-3 py-2 text-left text-xs text-gray-500 hover:bg-gray-100"
            >
              {t("dashboard.aiAssistant.client.hideSidebar", "Hide sidebar")}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col">
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute left-65 top-20 z-10 rounded-r-lg border border-l-0 border-gray-200 bg-white p-2 text-gray-500 shadow-sm hover:bg-gray-50"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
        )}

        <div className="flex-1 overflow-y-auto p-6">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0891b2]/10">
                <Bot className="h-8 w-8 text-[#0891b2]" />
              </div>
              <h2 className="mb-2 text-xl font-semibold text-gray-900">
                {t("dashboard.aiAssistant.client.welcomeTitle", "How can I help you?")}
              </h2>
              <p className="mb-8 max-w-md text-center text-sm text-gray-500">
                {t(
                  "dashboard.aiAssistant.client.welcomeSubtitle",
                  "I can search contacts, analyze your pipeline, create notes and tasks, draft emails, and more."
                )}
              </p>
              <SuggestedPrompts onSelect={handleSuggestedPrompt} />
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-4">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t("dashboard.aiAssistant.client.thinking", "Thinking...")}</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 bg-white p-4">
          <form
            onSubmit={handleFormSubmit}
            className="mx-auto flex max-w-3xl items-end gap-3"
          >
            <div className="relative flex-1">
              <input
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder={t(
                  "dashboard.aiAssistant.client.inputPlaceholder",
                  "Ask about your CRM data..."
                )}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-12 text-sm focus:border-[#0891b2] focus:outline-none focus:ring-1 focus:ring-[#0891b2]"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0891b2] text-white transition-colors hover:bg-[#0e7490] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>
          <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-gray-400">
            {t(
              "dashboard.aiAssistant.client.disclaimer",
              "F-CORE Copilot can make mistakes. Verify important information."
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
