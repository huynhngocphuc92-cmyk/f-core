"use client";

import {
  createContext,
  useEffect,
  startTransition,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import {
  LOCALE_COOKIE_NAME,
  SUPPORTED_LOCALES,
  isSupportedLocale,
  type Locale,
} from "@/i18n/config";
import { messages } from "@/i18n/messages";
import {
  translateMessage,
  type MessageDictionary,
  type TranslateValues,
} from "@/i18n/translate";

type I18nContextValue = {
  locale: Locale;
  locales: readonly Locale[];
  setLocale: (nextLocale: Locale) => void;
  t: (key: string, fallback?: string, values?: TranslateValues) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

type I18nProviderProps = {
  initialLocale: Locale;
  children: React.ReactNode;
};

export function I18nProvider({ initialLocale, children }: I18nProviderProps) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") return initialLocale;

    try {
      const stored = window.localStorage.getItem(LOCALE_COOKIE_NAME);
      if (isSupportedLocale(stored)) return stored;
    } catch {
      // Ignore localStorage failures in restricted environments.
    }

    return initialLocale;
  });

  useEffect(() => {
    document.documentElement.lang = locale;
    document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=31536000; samesite=lax`;

    try {
      window.localStorage.setItem(LOCALE_COOKIE_NAME, locale);
    } catch {
      // Ignore localStorage failures in restricted environments.
    }

    if (locale !== initialLocale) {
      startTransition(() => {
        router.refresh();
      });
    }
  }, [initialLocale, locale, router]);

  const setLocale = useCallback(
    (nextLocale: Locale) => {
      if (nextLocale === locale) return;

      document.cookie = `${LOCALE_COOKIE_NAME}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
      document.documentElement.lang = nextLocale;
      try {
        window.localStorage.setItem(LOCALE_COOKIE_NAME, nextLocale);
      } catch {
        // Ignore localStorage failures in restricted environments.
      }

      startTransition(() => {
        setLocaleState(nextLocale);
      });
    },
    [locale]
  );

  const t = useCallback(
    (key: string, fallback?: string, values?: TranslateValues) => {
      return translateMessage(
        messages[locale] as MessageDictionary,
        key,
        fallback,
        values
      );
    },
    [locale]
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      locales: SUPPORTED_LOCALES,
      setLocale,
      t,
    }),
    [locale, setLocale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider");
  }

  return context;
}
