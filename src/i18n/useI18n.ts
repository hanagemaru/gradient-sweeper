"use client";

import { useLanguage } from "./LanguageContext";
import type { Translations } from "./ja";

type PathsToStringProps<T> = T extends string
  ? []
  : {
      [K in Extract<keyof T, string>]: [K, ...PathsToStringProps<T[K]>];
    }[Extract<keyof T, string>];

type Join<T extends string[], D extends string> = T extends []
  ? never
  : T extends [infer F]
  ? F
  : T extends [infer F, ...infer R]
  ? F extends string
    ? `${F}${D}${Join<Extract<R, string[]>, D>}`
    : never
  : string;

export type TranslationKey = Join<PathsToStringProps<Translations>, ".">;

export function useI18n() {
  const { translations, language, setLanguage } = useLanguage();

  const t = (key: TranslationKey): string => {
    const keys = key.split(".");
    let value: unknown = translations;

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return key; // フォールバック
      }
    }

    return typeof value === "string" ? value : key;
  };

  return { t, language, setLanguage };
}
