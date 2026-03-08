"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useGame } from "@/hooks/useGame";
import { useTimer } from "@/hooks/useTimer";
import { useScorePopup } from "@/hooks/useScorePopup";
import { useI18n } from "@/i18n/useI18n";
import { Board } from "@/components/game/Board";
import { Timer } from "@/components/game/Timer";
import { ScoreDisplay } from "@/components/game/ScoreDisplay";
import { ScorePopup } from "@/components/game/ScorePopup";
import { Lives } from "@/components/game/Lives";
import { BombCounter } from "@/components/game/BombCounter";
import { PauseOverlay } from "@/components/game/PauseOverlay";
import { GameOverModal } from "@/components/game/GameOverModal";
import { ClearedModal } from "@/components/game/ClearedModal";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/Icon";
import { MilestoneEffect } from "@/components/game/MilestoneEffect";
import { GameMode, Difficulty, MAX_REVIVES_TA, GRID_SIZE, LEVEL_CLEAR_BONUS, PERFECT_BONUS_MULTIPLIER } from "@/types/game";
import { showRewardedAd } from "@/lib/rewarded-provider";
import { countFlags } from "@/lib/game-logic";

/** スピードコンボ数に応じたラベルを返す */
function getComboLabel(combo: number): string {
  if (combo >= 4) return "AMAZING!";
  if (combo >= 3) return "GREAT!";
  if (combo >= 2) return "COMBO!";
  return "FAST!";
}

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

  // タイマー（TAモードのみ使用）
  const timer = useTimer();

  // スコアポップアップ（Endlessのみ使用）
  const { popups, addPopup } = useScorePopup();

  // 最後にクリックしたセル位置の追跡（popup表示用）
  const lastClickPosRef = useRef<{ row: number; col: number }>({ row: 4, col: 4 });

  // 答え合わせ完了フラグ（ローカルstate）
  const [answerDone, setAnswerDone] = useState(false);

  // ゲームオーバーモーダル表示遅延（爆発エフェクト完了後に表示）
  const [showGameOverModal, setShowGameOverModal] = useState(false);

  // TAモード復活時のペナルティポップアップ表示
  const [showPenaltyPopup, setShowPenaltyPopup] = useState(false);
  const [penaltyPopupKey, setPenaltyPopupKey] = useState(0);

  // ゲーム開始時にタイマースタート（TAのみ）
  useEffect(() => {
    if (mode === "ta") {
      timer.start();
      return () => timer.stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // タイマー制御（TAのみ）：クリア・ゲームオーバー・ポーズで即停止
  useEffect(() => {
    if (mode !== "ta") return;
    if (state.isGameOver || state.isCleared || state.isPaused) {
      timer.pause();
    } else {
      timer.resume();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, state.isPaused, state.isGameOver, state.isCleared, timer.pause, timer.resume]);

  // ポップアップ表示（Endlessのみ）
  // - 爆弾ミス時: マイナススコアを数値表示
  // - スピードボーナスコンボ時: ラベル（FAST!/COMBO!/GREAT!/AMAZING!）を表示
  // - 通常セル開放: ポップアップなし
  useEffect(() => {
    if (mode !== "endless" || state.lastScoreChange === null) return;

    const pos = lastClickPosRef.current;
    const x = ((pos.col + 0.5) / GRID_SIZE) * 100;
    const y = ((pos.row + 0.5) / GRID_SIZE) * 100;

    if (state.lastScoreChange < 0) {
      // 爆弾ミス: マイナススコアを表示
      addPopup(state.lastScoreChange, x, y);
    } else if (state.speedCombo > 0) {
      // スピードボーナス発動: コンボラベルを表示
      const label = getComboLabel(state.speedCombo);
      addPopup(0, x, y, label);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.lastScoreChange, state.score, mode]);

  // 爆弾を踏んだ時のエフェクト後にセルをリセット（エンドレスモードで残機あり時）
  useEffect(() => {
    // exploded 状態のセルがあり、ゲームオーバーでなければ遅延リセット
    if (state.missCount > 0 && !state.isGameOver && !state.isCleared) {
      const timeoutId = setTimeout(() => {
        resetExploded();
      }, 600); // アニメーション時間（0.6s）と合わせる
      return () => clearTimeout(timeoutId);
    }
  }, [state.missCount, state.isGameOver, state.isCleared, resetExploded]);

  // ゲームオーバーモーダルを爆発エフェクト後に遅延表示
  useEffect(() => {
    if (state.isGameOver) {
      const timer = setTimeout(() => {
        setShowGameOverModal(true);
      }, 800); // 爆発アニメーション（0.6s）+ 余裕
      return () => clearTimeout(timer);
    } else {
      setShowGameOverModal(false);
    }
  }, [state.isGameOver]);

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

  // セル開放（位置を追跡してからdispatch）
  const handleRevealCell = useCallback((row: number, col: number) => {
    lastClickPosRef.current = { row, col };
    revealCell(row, col, Date.now());
  }, [revealCell]);

  const handleRevive = useCallback(async () => {
    const result = await showRewardedAd();
    if (result === "completed") {
      revive();
      if (mode === "ta") {
        timer.resume();
        // +30s ペナルティポップアップ表示
        setShowPenaltyPopup(true);
        setPenaltyPopupKey((prev) => prev + 1);
        setTimeout(() => setShowPenaltyPopup(false), 1200);
      }
    }
  }, [revive, timer, mode]);

  const handleGiveUp = useCallback(() => {
    // ゲームオーバー時の Give Up → 結果画面へ遷移
    const params = new URLSearchParams({
      mode,
      level: state.level.toString(),
      misses: state.missCount.toString(),
      revives: state.reviveCount.toString(),
      cleared: "false",
    });
    if (mode === "endless") {
      params.set("score", state.score.toString());
    }
    if (mode === "ta") {
      params.set("time", timer.elapsedMs.toString());
      params.set("penaltyMs", state.penaltyMs.toString());
    }
    if (difficulty) {
      params.set("difficulty", difficulty);
    }
    router.push(`/result?${params.toString()}`);
  }, [mode, difficulty, timer.elapsedMs, state.level, state.missCount, state.reviveCount, state.score, state.penaltyMs, router]);

  const handleQuitFromPause = useCallback(() => {
    // ポーズからの Quit → 直接ホームへ（スコア登録なし）
    router.push('/');
  }, [router]);

  // ホームに戻る（TAモードのゲームオーバー時）
  const handleGoHome = useCallback(() => {
    router.push('/');
  }, [router]);

  const handleNextLevel = useCallback(() => {
    nextLevel();
    if (mode === "ta") {
      timer.resume();
    }
  }, [nextLevel, timer, mode]);

  const handleFinish = useCallback(() => {
    // 結果画面へ遷移
    const params = new URLSearchParams({
      mode,
      level: state.level.toString(),
      misses: state.missCount.toString(),
      revives: state.reviveCount.toString(),
      cleared: "true",
    });
    if (mode === "endless") {
      params.set("score", state.score.toString());
    }
    if (mode === "ta") {
      params.set("time", timer.elapsedMs.toString());
      params.set("penaltyMs", state.penaltyMs.toString());
    }
    if (difficulty) {
      params.set("difficulty", difficulty);
    }
    router.push(`/result?${params.toString()}`);
  }, [mode, difficulty, timer.elapsedMs, state.level, state.missCount, state.reviveCount, state.score, state.penaltyMs, router]);

  // TAモード: クリア後の答え合わせ完了で自動的に結果画面へ遷移
  useEffect(() => {
    if (mode === "ta" && state.isCleared && answerDone) {
      handleFinish();
    }
  }, [mode, state.isCleared, answerDone, handleFinish]);

  // ClearedModal 用のボーナススコア（Endless）
  const bonusScore = mode === "endless" ? LEVEL_CLEAR_BONUS * state.level : undefined;
  const perfectBonus = mode === "endless" && state.levelMisses === 0
    ? LEVEL_CLEAR_BONUS * state.level * PERFECT_BONUS_MULTIPLIER
    : undefined;

  return (
    <main className="flex flex-col items-center min-h-screen p-4">
      {/* ヘッダー */}
      <div className="w-full max-w-md flex items-center justify-between mb-4">
        {/* 左側: Endless→スコア / TA→タイマー */}
        {mode === "endless" ? (
          <ScoreDisplay
            score={
              state.isCleared && answerDone
                ? state.score + (bonusScore ?? 0) + (perfectBonus ?? 0)
                : state.score
            }
          />
        ) : (
          <div className="relative">
            <Timer elapsedMs={timer.elapsedMs + state.penaltyMs} />
            {showPenaltyPopup && (
              <div
                key={penaltyPopupKey}
                className="absolute score-float-up text-red-400 font-bold text-lg whitespace-nowrap drop-shadow-lg"
                style={{ left: "50%", top: "-4px" }}
              >
                +30s
              </div>
            )}
          </div>
        )}
        
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
      <div className="relative z-0">
        <Board
          board={state.board}
          onReveal={handleRevealCell}
          onFlag={toggleFlag}
          disabled={state.isPaused || state.isGameOver || state.isCleared}
          showAllBombs={state.isCleared && !answerDone}
          maskCells={state.isPaused && mode === "ta"}
        />
        
        {/* スコアポップアップ（Endlessのみ） */}
        {mode === "endless" && <ScorePopup popups={popups} />}

        {state.isPaused && <PauseOverlay mode={mode} onResume={resume} onQuit={handleQuitFromPause} />}
      </div>

      {/* ポーズ / メニューボタン */}
      <div className="mt-6">
        <Button
          onClick={pause}
          variant="ghost"
          disabled={state.isGameOver || state.isCleared}
        >
          <Icon name={mode === "endless" ? "menu" : "pause"} />
          {mode === "endless" ? t("game.menu") : t("game.pause")}
        </Button>
      </div>

      {/* モーダル */}
      <GameOverModal
        isOpen={showGameOverModal}
        mode={mode}
        reviveCount={state.reviveCount}
        onRevive={handleRevive}
        onGiveUp={handleGiveUp}
        onGoHome={handleGoHome}
      />

      <ClearedModal
        isOpen={state.isCleared && answerDone && mode === "endless"}
        onNext={handleNextLevel}
        currentScore={state.score}
        bonusScore={bonusScore}
        perfectBonus={perfectBonus}
      />

      {/* マイルストーン演出（Endlessのみ） */}
      {mode === "endless" && <MilestoneEffect score={state.score} />}
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
