"use client";

import { Languages } from "lucide-react";

import { LOCALE_LABELS, type Locale } from "@/i18n/config";
import { useI18n } from "@/i18n/I18nProvider";

type LanguageSwitcherProps = {
  className?: string;
  variant?: "light" | "dark";
};

const LABEL_KEY_BY_LOCALE: Record<Locale, "english" | "vietnamese" | "german"> = {
  en: "english",
  vi: "vietnamese",
  de: "german",
};

export default function LanguageSwitcher({
  className = "",
  variant = "light",
}: LanguageSwitcherProps) {
  const { locale, locales, setLocale, t } = useI18n();

  const wrapperClass =
    variant === "dark"
      ? "rounded-lg border border-gray-700 bg-gray-800 px-3 py-2"
      : "rounded-lg border border-gray-200 bg-white px-3 py-2";

  const labelClass = variant === "dark" ? "text-gray-300" : "text-gray-600";
  const selectClass =
    variant === "dark"
      ? "w-full bg-gray-800 text-white border border-gray-700 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:border-cyan-500"
      : "w-full bg-white text-gray-900 border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:border-cyan-500";

  return (
    <div className={`${wrapperClass} ${className}`}>
      <label className={`flex items-center gap-2 text-xs font-medium mb-2 ${labelClass}`}>
        <Languages className="w-3.5 h-3.5" />
        {t("language.switchLabel", "Language")}
      </label>
      <select
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
        className={selectClass}
        aria-label={t("language.switchLabel", "Language")}
      >
        {locales.map((item) => (
          <option key={item} value={item}>
            {t(`language.${LABEL_KEY_BY_LOCALE[item]}`, LOCALE_LABELS[item])}
          </option>
        ))}
      </select>
    </div>
  );
}
