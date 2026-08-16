"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GameMode, Difficulty } from "@/types/game";

const PLAYER_NAME_KEY = "gradient_sweeper_player_name";

export interface ResultSubmissionParams {
  mode: GameMode;
  difficulty: Difficulty | null;
  level: number;
  misses: number;
  revives: number;
  /** Endlessのみ使用 */
  score: number;
  /** TAのみ使用 */
  timeMs: number;
  /** TAのみ使用 */
  penaltyMs: number;
}

/**
 * リザルト画面の「プレイヤー名入力 → スコア送信 → ランキングへ遷移」
 * および「スキップ → ホームへ遷移」ロジック。
 *
 * `/result`（直接URLアクセス時のフルページ表示）と、`/game` 上に重ねる
 * `GameResultOverlay`（通常のプレイ導線）の両方から使う。見た目は呼び出し側
 * それぞれに任せ、ここでは状態と副作用だけを持つ。
 */
export function useResultSubmission({
  mode,
  difficulty,
  level,
  misses,
  revives,
  score,
  timeMs,
  penaltyMs,
}: ResultSubmissionParams) {
  const router = useRouter();

  const [playerName, setPlayerName] = useState("");
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem(PLAYER_NAME_KEY);
    if (savedName) setPlayerName(savedName);
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (isNavigating) return;

    const trimmedName = playerName.trim();
    if (trimmedName) localStorage.setItem(PLAYER_NAME_KEY, trimmedName);

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
      }).catch((error) => console.error("Failed to submit score:", error));
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
      }).catch((error) => console.error("Failed to submit score:", error));
    }

    setIsNavigating(true);
    router.push(`/ranking?mode=${mode}${difficulty ? `&difficulty=${difficulty}` : ""}`);
  };

  const handleSkip = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    router.push("/");
  };

  return { playerName, setPlayerName, handleSubmit, handleSkip, isNavigating };
}
