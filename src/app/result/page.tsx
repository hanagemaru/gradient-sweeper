"use client";

import { useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/i18n/useI18n";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/Icon";
import { formatTime } from "@/hooks/useTimer";
import { GameMode, Difficulty } from "@/types/game";

function ResultContent() {
  const searchParams = useSearchParams();
  const { t } = useI18n();

  const mode = searchParams.get("mode") as GameMode;
  const difficulty = searchParams.get("difficulty") as Difficulty | undefined;
  const timeMs = parseInt(searchParams.get("time") || "0", 10);
  const level = parseInt(searchParams.get("level") || "1", 10);
  const misses = parseInt(searchParams.get("misses") || "0", 10);
  const cleared = searchParams.get("cleared") === "true";

  // スコア登録
  useEffect(() => {
    const submitScore = async () => {
      // TAは クリア時のみ、Endlessは常に登録
      if (mode === "ta" && !cleared) {
        return;
      }

      try {
        await fetch("/api/score", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mode,
            difficulty: mode === "ta" ? difficulty : undefined,
            time_ms: timeMs,
            endless_level: mode === "endless" ? level : undefined,
            miss_count: misses,
          }),
        });
      } catch (error) {
        console.error("Failed to submit score:", error);
      }
    };

    submitScore();
  }, [mode, difficulty, timeMs, level, misses, cleared]);

  const getModeText = () => {
    if (mode === "endless") return t("ranking.endless");
    return t("ranking.timeAttack");
  };

  const getDifficultyText = () => {
    if (!difficulty) return "";
    return t(`ta.${difficulty}` as const);
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 gap-8">
      <h1 className="text-3xl font-bold">{t("result.title")}</h1>

      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-xs space-y-4">
        <div className="flex justify-between">
          <span className="text-gray-400">{t("result.mode")}</span>
          <span className="font-semibold">{getModeText()}</span>
        </div>

        {mode === "ta" && difficulty && (
          <div className="flex justify-between">
            <span className="text-gray-400">{t("result.difficulty")}</span>
            <span className="font-semibold">{getDifficultyText()}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span className="text-gray-400">{t("result.time")}</span>
          <span className="font-mono font-semibold">{formatTime(timeMs)}</span>
        </div>

        {mode === "endless" && (
          <div className="flex justify-between">
            <span className="text-gray-400">{t("result.level")}</span>
            <span className="font-semibold">{level}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span className="text-gray-400">{t("result.misses")}</span>
          <span className="font-semibold">{misses}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link href={`/ranking?mode=${mode}${difficulty ? `&difficulty=${difficulty}` : ""}`}>
          <Button variant="primary" className="w-full">
            <Icon name="trophy" />
            {t("result.toRanking")}
          </Button>
        </Link>

        <Link href="/">
          <Button variant="secondary" className="w-full">
            <Icon name="home" />
            {t("result.toHome")}
          </Button>
        </Link>
      </div>
    </main>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <ResultContent />
    </Suspense>
  );
}
