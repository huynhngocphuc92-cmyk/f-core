export const SUPPORTED_LOCALES = ["en", "vi", "de"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE_NAME = "app_locale";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  vi: "Tiếng Việt",
  de: "Deutsch",
};

const INTL_LOCALE_MAP: Record<Locale, string> = {
  en: "en-US",
  vi: "vi-VN",
  de: "de-DE",
};

export function isSupportedLocale(value: string | null | undefined): value is Locale {
  if (!value) return false;
  return SUPPORTED_LOCALES.includes(value as Locale);
}

export function normalizeLocale(value: string | null | undefined): Locale | null {
  if (!value) return null;
  const candidate = value.toLowerCase();

  if (candidate.startsWith("vi")) return "vi";
  if (candidate.startsWith("de")) return "de";
  if (candidate.startsWith("en")) return "en";

  if (isSupportedLocale(candidate)) return candidate;
  return null;
}

export function toIntlLocale(locale: Locale): string {
  return INTL_LOCALE_MAP[locale];
}
