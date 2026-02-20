"use client";

import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Inbox,
  Mail,
  MessageCircle,
  MessageSquare,
  PhoneCall,
  Search,
  Ticket,
} from "lucide-react";

import { toIntlLocale } from "@/i18n/config";
import { useI18n } from "@/i18n/I18nProvider";

type InboxChannel =
  | "ticket"
  | "chat"
  | "email"
  | "phone"
  | "sms"
  | "whatsapp"
  | "facebook"
  | "custom";

type InboxItem = {
  id: string;
  type: InboxChannel;
  channel: InboxChannel;
  subject: string;
  status: string;
  priority: string | null;
  assignee: { id: string; name: string | null } | null;
  contact: { id: string; name: string; email: string | null } | null;
  updatedAt: string;
  createdAt: string;
};

const channelIcons: Record<InboxChannel, LucideIcon> = {
  ticket: Ticket,
  chat: MessageCircle,
  email: Mail,
  phone: PhoneCall,
  sms: MessageSquare,
  whatsapp: MessageCircle,
  facebook: MessageSquare,
  custom: Inbox,
};

export default function ServiceInboxPage() {
  const { locale, t } = useI18n();
  const intlLocale = toIntlLocale(locale);
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState("all");

  const channelOptions = useMemo(
    () => [
      { value: "all", label: t("dashboard.serviceInbox.channels.all", "All Channels") },
      { value: "ticket", label: t("dashboard.serviceInbox.channels.ticket", "Tickets") },
      { value: "chat", label: t("dashboard.serviceInbox.channels.chat", "Chats") },
      { value: "email", label: t("dashboard.serviceInbox.channels.email", "Email") },
      { value: "phone", label: t("dashboard.serviceInbox.channels.phone", "Phone") },
      { value: "sms", label: t("dashboard.serviceInbox.channels.sms", "SMS") },
      {
        value: "whatsapp",
        label: t("dashboard.serviceInbox.channels.whatsapp", "WhatsApp"),
      },
      {
        value: "facebook",
        label: t("dashboard.serviceInbox.channels.facebook", "Facebook"),
      },
      { value: "custom", label: t("dashboard.serviceInbox.channels.custom", "Custom") },
    ],
    [t]
  );

  const channelLabels = useMemo<Record<InboxChannel, string>>(
    () => ({
      ticket: t("dashboard.serviceInbox.channels.ticket", "Tickets"),
      chat: t("dashboard.serviceInbox.channels.chat", "Chats"),
      email: t("dashboard.serviceInbox.channels.email", "Email"),
      phone: t("dashboard.serviceInbox.channels.phone", "Phone"),
      sms: t("dashboard.serviceInbox.channels.sms", "SMS"),
      whatsapp: t("dashboard.serviceInbox.channels.whatsapp", "WhatsApp"),
      facebook: t("dashboard.serviceInbox.channels.facebook", "Facebook"),
      custom: t("dashboard.serviceInbox.channels.custom", "Custom"),
    }),
    [t]
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const params = new URLSearchParams({
        page: "1",
        limit: "50",
        channel,
      });

      if (search.trim()) {
        params.set("search", search.trim());
      }

      const response = await fetch(`/api/service/inbox?${params.toString()}`);
      const data = await response.json();
      if (!cancelled) {
        setItems(data.data || []);
        setLoading(false);
      }
    }

    load().catch(() => {
      if (!cancelled) {
        setItems([]);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [search, channel]);

  const title = useMemo(() => {
    if (channel !== "all") {
      const selected = channelLabels[channel as InboxChannel];
      if (selected) {
        return t("dashboard.serviceInbox.titleByChannel", "{channel} Inbox", {
          channel: selected,
        });
      }
    }

    return t("dashboard.serviceInbox.titleDefault", "Service Inbox");
  }, [channel, channelLabels, t]);

  const subtitle = useMemo(() => {
    if (channel === "all") {
      return t(
        "dashboard.serviceInbox.subtitleDefault",
        "Unified queue for tickets, chat, and external conversation channels"
      );
    }

    const selectedLabel =
      channelOptions.find((option) => option.value === channel)?.label || channel;

    return t(
      "dashboard.serviceInbox.subtitleByChannel",
      "Queue filtered to {channel} conversations",
      { channel: selectedLabel }
    );
  }, [channel, channelOptions, t]);

  return (
    <div className="p-6 pt-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="mt-1 text-gray-600">{subtitle}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t(
              "dashboard.serviceInbox.searchPlaceholder",
              "Search conversations..."
            )}
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-4 text-sm focus:border-[#0891b2] focus:outline-none"
          />
        </div>
        <select
          value={channel}
          onChange={(event) => setChannel(event.target.value)}
          className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-[#0891b2] focus:outline-none"
        >
          {channelOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500 shadow-sm">
          {t("dashboard.serviceInbox.loading", "Loading inbox...")}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <Inbox className="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <p className="mb-1 text-gray-500">
            {t(
              "dashboard.serviceInbox.emptyTitle",
              "No conversations or tickets found"
            )}
          </p>
          <p className="text-sm text-gray-400">
            {t(
              "dashboard.serviceInbox.emptySubtitle",
              "Try changing filters or wait for new customer activity"
            )}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white shadow-sm">
          {items.map((item) => {
            const ItemIcon = channelIcons[item.channel] || Inbox;

            return (
              <div key={`${item.type}-${item.id}`} className="px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex items-center gap-2">
                    <ItemIcon className="h-4 w-4 flex-shrink-0 text-[#0891b2]" />
                    <p className="truncate text-sm font-medium text-gray-900">
                      {item.subject}
                    </p>
                  </div>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize text-gray-600">
                    {item.status.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500">
                  <span>
                    {t("dashboard.serviceInbox.meta.channel", "Channel: {value}", {
                      value: channelLabels[item.channel] || item.channel,
                    })}
                  </span>
                  <span>
                    {t("dashboard.serviceInbox.meta.assignee", "Assignee: {value}", {
                      value:
                        item.assignee?.name ||
                        t("dashboard.common.unassigned", "Unassigned"),
                    })}
                  </span>
                  <span>
                    {t("dashboard.serviceInbox.meta.updated", "Updated: {value}", {
                      value: new Date(item.updatedAt).toLocaleDateString(
                        intlLocale,
                        {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      ),
                    })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
