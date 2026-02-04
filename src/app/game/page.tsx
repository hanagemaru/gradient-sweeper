"use client";

import { useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useGame } from "@/hooks/useGame";
import { useTimer } from "@/hooks/useTimer";
import { useI18n } from "@/i18n/useI18n";
import { Board } from "@/components/game/Board";
import { Timer } from "@/components/game/Timer";
import { Lives } from "@/components/game/Lives";
import { PauseOverlay } from "@/components/game/PauseOverlay";
import { GameOverModal } from "@/components/game/GameOverModal";
import { ClearedModal } from "@/components/game/ClearedModal";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/Icon";
import { GameMode, Difficulty } from "@/types/game";
import { showRewardedAd } from "@/lib/rewarded-provider";

function GameContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useI18n();

  const mode = (searchParams.get("mode") as GameMode) || "endless";
  const difficulty = searchParams.get("difficulty") as Difficulty | undefined;

  const {
    state,
    revealCell,
    toggleFlag,
    pause,
    resume,
    revive,
    nextLevel,
  } = useGame(mode, difficulty);

  const timer = useTimer();

  // ゲーム開始時にタイマースタート
  useEffect(() => {
    timer.start();
    return () => timer.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ポーズ時のタイマー制御
  useEffect(() => {
    if (state.isPaused) {
      timer.pause();
    } else if (!state.isGameOver && !state.isCleared) {
      timer.resume();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isPaused, state.isGameOver, state.isCleared]);

  // ゲーム終了時のタイマー停止
  useEffect(() => {
    if (state.isGameOver || state.isCleared) {
      timer.pause();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isGameOver, state.isCleared]);

  const handleRevive = useCallback(async () => {
    const result = await showRewardedAd();
    if (result === "completed") {
      revive();
      timer.resume();
    }
  }, [revive, timer]);

  const handleGiveUp = useCallback(() => {
    // 結果画面へ遷移
    const params = new URLSearchParams({
      mode,
      time: timer.elapsedMs.toString(),
      level: state.level.toString(),
      misses: state.missCount.toString(),
      cleared: "false",
    });
    if (difficulty) {
      params.set("difficulty", difficulty);
    }
    router.push(`/result?${params.toString()}`);
  }, [mode, difficulty, timer.elapsedMs, state.level, state.missCount, router]);

  const handleNextLevel = useCallback(() => {
    nextLevel();
    timer.resume();
  }, [nextLevel, timer]);

  const handleFinish = useCallback(() => {
    // 結果画面へ遷移
    const params = new URLSearchParams({
      mode,
      time: timer.elapsedMs.toString(),
      level: state.level.toString(),
      misses: state.missCount.toString(),
      cleared: "true",
    });
    if (difficulty) {
      params.set("difficulty", difficulty);
    }
    router.push(`/result?${params.toString()}`);
  }, [mode, difficulty, timer.elapsedMs, state.level, state.missCount, router]);

  return (
    <main className="flex flex-col items-center min-h-screen p-4">
      {/* ヘッダー */}
      <div className="w-full max-w-md flex items-center justify-between mb-4">
        <Timer elapsedMs={timer.elapsedMs} />
        
        <div className="flex items-center gap-4">
          {mode === "endless" && <Lives lives={state.lives} />}
          
          {mode === "endless" && (
            <div className="text-lg font-semibold">
              {t("game.level")}: {state.level}
            </div>
          )}
        </div>
      </div>

      {/* 盤面 */}
      <div className="relative">
        <Board
          board={state.board}
          onReveal={revealCell}
          onFlag={toggleFlag}
          disabled={state.isPaused || state.isGameOver || state.isCleared}
        />
        
        {state.isPaused && <PauseOverlay onResume={resume} />}
      </div>

      {/* ポーズボタン */}
      <div className="mt-6">
        <Button
          onClick={pause}
          variant="ghost"
          disabled={state.isGameOver || state.isCleared}
        >
          <Icon name="pause" />
          {t("game.pause")}
        </Button>
      </div>

      {/* モーダル */}
      <GameOverModal
        isOpen={state.isGameOver}
        mode={mode}
        reviveCount={state.reviveCount}
        onRevive={handleRevive}
        onGiveUp={handleGiveUp}
      />

      <ClearedModal
        isOpen={state.isCleared}
        mode={mode}
        onNext={handleNextLevel}
        onFinish={handleFinish}
      />
    </main>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <GameContent />
    </Suspense>
  );
}
