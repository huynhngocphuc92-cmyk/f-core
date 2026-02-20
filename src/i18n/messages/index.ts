import type { Locale } from "@/i18n/config";
import { deMessages } from "@/i18n/messages/de";
import { enMessages } from "@/i18n/messages/en";
import { viMessages } from "@/i18n/messages/vi";

export type MessageSchema = typeof enMessages;

export const messages = {
  en: enMessages,
  vi: viMessages,
  de: deMessages,
} as const satisfies Record<Locale, Record<string, unknown>>;
