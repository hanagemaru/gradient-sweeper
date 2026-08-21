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
  /**
   * スコア送信後の後始末。渡さない場合は従来どおり `/ranking` へ遷移する。
   *
   * `/game` はここでランキングをオーバーレイ表示するため、ページ遷移を
   * させたくない。遷移するかどうかは呼び出し側の事情なので、このフックは
   * 送信だけを担当して行き先の判断を外へ出している。
   */
  onSubmitted?: () => void;
}

/**
 * リザルト画面の「プレイヤー名入力 → スコア送信 → ランキングへ」
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
  onSubmitted,
}: ResultSubmissionParams) {
  const router = useRouter();

  const [playerName, setPlayerName] = useState("");
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem(PLAYER_NAME_KEY);
    if (savedName) setPlayerName(savedName);
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isNavigating) return;

    const trimmedName = playerName.trim();
    if (trimmedName) localStorage.setItem(PLAYER_NAME_KEY, trimmedName);

    const body =
      mode === "endless"
        ? {
            mode,
            endless_level: level,
            miss_count: misses,
            revive_count: revives,
            player_name: trimmedName || undefined,
            score,
          }
        : {
            mode,
            difficulty,
            time_ms: timeMs,
            penalty_ms: penaltyMs,
            miss_count: misses,
            revive_count: revives,
            player_name: trimmedName || undefined,
          };

    // 二重送信の防止も兼ねているので、遷移しない場合でも立てておく。
    setIsNavigating(true);

    /*
     * 送信の完了を待ってから次へ進む。
     *
     * ここを待たずに進めると、ランキング側の一覧取得が登録の書き込みを
     * 追い越し、いま出したばかりのスコアが載らない。以前は次がページ遷移
     * だったので、その読み込み時間が偶然この競合を隠していた。オーバーレイは
     * 即座に開くぶん、待たないと必ず追い越す。
     *
     * 失敗しても先へは進める（記録できなかったことで操作を止めない）のは従来どおり。
     */
    await fetch("/api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch((error) => console.error("Failed to submit score:", error));

    if (onSubmitted) {
      onSubmitted();
      return;
    }

    router.push(`/ranking?mode=${mode}${difficulty ? `&difficulty=${difficulty}` : ""}`);
  };

  const handleSkip = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    router.push("/");
  };

  return { playerName, setPlayerName, handleSubmit, handleSkip, isNavigating };
}
