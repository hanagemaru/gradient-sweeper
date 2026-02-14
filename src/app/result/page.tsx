"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useI18n } from "@/i18n/useI18n";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/Icon";
import { formatTime } from "@/hooks/useTimer";
import { GameMode, Difficulty } from "@/types/game";

const PLAYER_NAME_KEY = "gradient_sweeper_player_name";

function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useI18n();

  const mode = searchParams.get("mode") as GameMode;
  const difficulty = searchParams.get("difficulty") as Difficulty | null;
  const level = parseInt(searchParams.get("level") || "1", 10);
  const misses = parseInt(searchParams.get("misses") || "0", 10);
  const revives = parseInt(searchParams.get("revives") || "0", 10);
  const cleared = searchParams.get("cleared") === "true";

  // Endless用: スコア（クライアント算出済み）
  const score = parseInt(searchParams.get("score") || "0", 10);

  // TA用: プレイ時間とペナルティ
  const timeMs = parseInt(searchParams.get("time") || "0", 10);
  const penaltyMs = parseInt(searchParams.get("penaltyMs") || "0", 10);
  const finalTimeMs = timeMs + penaltyMs;

  const [playerName, setPlayerName] = useState("");
  const [isNavigating, setIsNavigating] = useState(false);

  // LocalStorageから名前を読み込み
  useEffect(() => {
    const savedName = localStorage.getItem(PLAYER_NAME_KEY);
    if (savedName) {
      setPlayerName(savedName);
    }
  }, []);

  // スコア登録して即ランキングへ遷移
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNavigating) return;

    const trimmedName = playerName.trim();

    // 名前をLocalStorageに保存
    if (trimmedName) {
      localStorage.setItem(PLAYER_NAME_KEY, trimmedName);
    }

    // API呼び出し（バックグラウンドで実行、完了を待たない）
    if (mode === "endless") {
      fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          endless_level: level,
          miss_count: misses,
          revive_count: revives,
          player_name: trimmedName || undefined,
          score,
        }),
      }).catch((err) => console.error("Failed to submit score:", err));
    } else {
      fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          difficulty,
          time_ms: timeMs,
          penalty_ms: penaltyMs,
          miss_count: misses,
          revive_count: revives,
          player_name: trimmedName || undefined,
        }),
      }).catch((err) => console.error("Failed to submit score:", err));
    }

    // 即座にランキング画面へ遷移
    setIsNavigating(true);
    const rankingUrl = `/ranking?mode=${mode}${difficulty ? `&difficulty=${difficulty}` : ""}`;
    router.push(rankingUrl);
  };

  const handleSkip = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    router.push('/');
  };

  // 遷移中は全画面ローディング表示
  if (isNavigating) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">{t("common.loading")}</p>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 gap-8">
      {mode === "ta" && cleared ? (
        <div className="flex flex-col items-center gap-2">
          <Icon name="star" size="xl" />
          <h1 className="text-3xl font-bold text-yellow-400">{t("cleared.title")}</h1>
        </div>
      ) : (
        <h1 className="text-3xl font-bold">{t("result.title")}</h1>
      )}

      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-xs space-y-4 text-white">
        {mode === "endless" ? (
          <>
            {/* Endless: スコア（メイン）、到達レベル、ミス数 */}
            <div className="flex justify-between">
              <span className="text-gray-400">{t("result.level")}</span>
              <span className="font-semibold">{level}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">{t("result.misses")}</span>
              <span className="font-semibold">{misses}</span>
            </div>
            <div className="flex justify-between border-t border-gray-700 pt-4">
              <span className="text-gray-400 font-bold">{t("result.score")}</span>
              <span className="font-bold text-xl text-yellow-400">{score.toLocaleString()}</span>
            </div>
          </>
        ) : (
          <>
            {/* TA: 最終タイム（メイン）、ペナルティ内訳 */}
            {penaltyMs > 0 && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-400">{t("result.playTime")}</span>
                  <span className="font-mono font-semibold">{formatTime(timeMs)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{t("result.penalty")}</span>
                  <span className="font-mono font-semibold text-red-400">+{formatTime(penaltyMs)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between border-t border-gray-700 pt-4">
              <span className="text-gray-400 font-bold">{t("result.finalTime")}</span>
              <span className="font-bold text-xl text-yellow-400 font-mono">{formatTime(finalTimeMs)}</span>
            </div>
          </>
        )}
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4">
        <div>
          <label htmlFor="playerName" className="block text-sm text-gray-400 mb-2">
            {t("result.playerName")} ({t("common.optional")})
          </label>
          <input
            id="playerName"
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder={t("result.enterName")}
            maxLength={50}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 text-white placeholder:text-gray-400"
          />
        </div>

        <div className="flex flex-col gap-3">
          <Button type="submit" variant="primary" className="w-full">
            {t("result.submit")}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={handleSkip}
          >
            {t("result.skip")}
          </Button>
        </div>
      </form>
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
