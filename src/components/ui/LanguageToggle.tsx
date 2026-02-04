"use client";

import { useI18n } from "@/i18n/useI18n";

export function LanguageToggle() {
  const { language, setLanguage } = useI18n();

  return (
    <button
      onClick={() => setLanguage(language === "ja" ? "en" : "ja")}
      className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors text-sm"
    >
      {language === "ja" ? "EN" : "日本語"}
    </button>
  );
}
