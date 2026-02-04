"use client";

import Link from "next/link";
import { Icon } from "@/components/Icon";
import { useI18n } from "@/i18n/useI18n";
import { BOMB_COUNTS, Difficulty } from "@/types/game";

const DIFFICULTIES: { key: Difficulty; gradient: string }[] = [
  { key: "easy", gradient: "from-green-500 to-emerald-500" },
  { key: "mid", gradient: "from-yellow-500 to-orange-500" },
  { key: "hard", gradient: "from-red-500 to-pink-500" },
];

export default function TimeAttackPage() {
  const { t } = useI18n();

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 gap-8">
      <h1 className="text-2xl font-bold">{t("ta.title")}</h1>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        {DIFFICULTIES.map(({ key, gradient }) => (
          <Link
            key={key}
            href={`/game?mode=ta&difficulty=${key}`}
            className={`flex flex-col items-center justify-center bg-gradient-to-r ${gradient} text-white py-4 px-6 rounded-lg font-semibold hover:opacity-90 transition-opacity`}
          >
            <span className="text-xl">{t(`ta.${key}` as const)}</span>
            <span className="text-sm opacity-80">
              {t("ta.bombs")}: {BOMB_COUNTS[key]}
            </span>
          </Link>
        ))}
      </div>

      <Link
        href="/"
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <Icon name="back" />
        {t("ta.back")}
      </Link>
    </main>
  );
}
