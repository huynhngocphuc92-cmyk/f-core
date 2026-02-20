import { toIntlLocale } from "@/i18n/config";
import { messages } from "@/i18n/messages";
import { getRequestLocale } from "@/i18n/request-locale";
import {
  translateMessage,
  type MessageDictionary,
  type TranslateValues,
} from "@/i18n/translate";

export async function getServerI18n() {
  const locale = await getRequestLocale();
  const dictionary = messages[locale] as MessageDictionary;

  const t = (key: string, fallback?: string, values?: TranslateValues) =>
    translateMessage(dictionary, key, fallback, values);

  return {
    locale,
    intlLocale: toIntlLocale(locale),
    t,
  };
}
