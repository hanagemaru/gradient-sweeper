"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useGame } from "@/hooks/useGame";
import { useTimer } from "@/hooks/useTimer";
import { useI18n } from "@/i18n/useI18n";
import { Board } from "@/components/game/Board";
import { Timer } from "@/components/game/Timer";
import { Lives } from "@/components/game/Lives";
import { BombCounter } from "@/components/game/BombCounter";
import { PauseOverlay } from "@/components/game/PauseOverlay";
import { GameOverModal } from "@/components/game/GameOverModal";
import { ClearedModal } from "@/components/game/ClearedModal";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/Icon";
import { GameMode, Difficulty } from "@/types/game";
import { showRewardedAd } from "@/lib/rewarded-provider";
import { countFlags } from "@/lib/game-logic";

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
    resetExploded,
    nextLevel,
  } = useGame(mode, difficulty);

  const timer = useTimer();

  // 答え合わせ完了フラグ（ローカルstate）
  const [answerDone, setAnswerDone] = useState(false);

  // ゲーム開始時にタイマースタート
  useEffect(() => {
    timer.start();
    return () => timer.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // タイマー制御（統合）：クリア・ゲームオーバー・ポーズで即停止
  useEffect(() => {
    if (state.isGameOver || state.isCleared || state.isPaused) {
      timer.pause();
    } else {
      timer.resume();
    }
  }, [state.isPaused, state.isGameOver, state.isCleared, timer.pause, timer.resume]);

  // 爆弾を踏んだ時のエフェクト後にセルをリセット（エンドレスモードで残機あり時）
  useEffect(() => {
    // exploded 状態のセルがあり、ゲームオーバーでなければ遅延リセット
    if (state.missCount > 0 && !state.isGameOver && !state.isCleared) {
      const timeoutId = setTimeout(() => {
        resetExploded();
      }, 600); // アニメーション時間（0.6s）と合わせる
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.missCount]);

  // クリア後の答え合わせ時間（2.5秒後にモーダル表示）
  useEffect(() => {
    if (state.isCleared) {
      setAnswerDone(false);
      const timeoutId = setTimeout(() => {
        setAnswerDone(true);
      }, 2500);
      return () => clearTimeout(timeoutId);
    } else {
      setAnswerDone(false);
    }
  }, [state.isCleared]);

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
      revives: state.reviveCount.toString(),
      cleared: "false",
    });
    if (difficulty) {
      params.set("difficulty", difficulty);
    }
    router.push(`/result?${params.toString()}`);
  }, [mode, difficulty, timer.elapsedMs, state.level, state.missCount, state.reviveCount, router]);

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
      revives: state.reviveCount.toString(),
      cleared: "true",
    });
    if (difficulty) {
      params.set("difficulty", difficulty);
    }
    router.push(`/result?${params.toString()}`);
  }, [mode, difficulty, timer.elapsedMs, state.level, state.missCount, state.reviveCount, router]);

  return (
    <main className="flex flex-col items-center min-h-screen p-4">
      {/* ヘッダー */}
      <div className="w-full max-w-md flex items-center justify-between mb-4">
        <Timer elapsedMs={timer.elapsedMs} />
        
        <div className="flex items-center gap-4">
          <BombCounter remaining={state.bombCount - countFlags(state.board)} />
          
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
          showAllBombs={state.isCleared && !answerDone}
        />
        
        {state.isPaused && <PauseOverlay onResume={resume} onQuit={handleGiveUp} />}
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
        isOpen={state.isCleared && answerDone}
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
