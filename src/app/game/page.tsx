"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useGame } from "@/hooks/useGame";
import { TimerDisplay } from "@/components/game/TimerDisplay";
import { useScorePopup } from "@/hooks/useScorePopup";
import { useI18n } from "@/i18n/useI18n";
import { Board } from "@/components/game/Board";
import { ScoreDisplay } from "@/components/game/ScoreDisplay";
import { ScorePopup } from "@/components/game/ScorePopup";
import { PauseOverlay } from "@/components/game/PauseOverlay";
import { GameOverModal } from "@/components/game/GameOverModal";
import { ClearedModal } from "@/components/game/ClearedModal";
import {
  PixelButton,
  PixelDivider,
  PixelMessage,
  PixelPanel,
  PixelScene,
} from "@/components/ui/PixelUI";
import { MilestoneEffect } from "@/components/game/MilestoneEffect";
import { GameResultOverlay } from "@/app/result/GameResultOverlay";
import { RankingOverlay } from "@/app/ranking/RankingOverlay";
import { GameMode, Difficulty, MAX_REVIVES_TA, GRID_SIZE, LEVEL_CLEAR_BONUS, PERFECT_BONUS_MULTIPLIER } from "@/types/game";
import { showRewardedAd } from "@/lib/rewarded-provider";
import { countFlags } from "@/lib/game-logic";
import styles from "./game.module.css";

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

  // 経過時間（TAモードのみ使用）。
  // 100ms ごとの更新で盤面まで再描画されないよう、state ではなく ref で持ち、
  // 表示は TimerDisplay の中に閉じ込めている。
  const elapsedRef = useRef(0);

  // スコアポップアップ（Endlessのみ使用）
  const { popups, addPopup } = useScorePopup();

  // 最後にクリックしたセル位置の追跡（popup表示用）
  const lastClickPosRef = useRef<{ row: number; col: number }>({ row: 4, col: 4 });

  // 答え合わせ完了フラグ（ローカルstate）
  const [answerDone, setAnswerDone] = useState(false);

  // ゲームオーバーモーダル表示遅延（爆発エフェクト完了後に表示）
  const [showGameOverModal, setShowGameOverModal] = useState(false);

  // 結果画面（旧: /result への遷移）を盤面の上にオーバーレイ表示するための
  // スナップショット。null のときは非表示。elapsedRef は ref のため、
  // Give Up / Finish が呼ばれた瞬間の値をここへ固定コピーする。
  const [resultSnapshot, setResultSnapshot] = useState<{
    cleared: boolean;
    level: number;
    misses: number;
    revives: number;
    score: number;
    timeMs: number;
    penaltyMs: number;
  } | null>(null);

  // スコア登録が終わったら、リザルトの上にさらにランキングを重ねる。
  // ここでも遷移しないので、盤面は最後までアンマウントされない。
  const [showRanking, setShowRanking] = useState(false);

  // TAモード復活時のペナルティポップアップ表示
  const [showPenaltyPopup, setShowPenaltyPopup] = useState(false);
  const [penaltyPopupKey, setPenaltyPopupKey] = useState(0);

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
        // +30s ペナルティポップアップ表示
        setShowPenaltyPopup(true);
        setPenaltyPopupKey((prev) => prev + 1);
        setTimeout(() => setShowPenaltyPopup(false), 1200);
      }
    }
  }, [revive, mode]);

  const handleGiveUp = useCallback(() => {
    // ゲームオーバー時の Give Up → 結果画面を盤面の上にオーバーレイ表示
    setResultSnapshot({
      cleared: false,
      level: state.level,
      misses: state.missCount,
      revives: state.reviveCount,
      score: state.score,
      timeMs: elapsedRef.current,
      penaltyMs: state.penaltyMs,
    });
  }, [state.level, state.missCount, state.reviveCount, state.score, state.penaltyMs]);

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
  }, [nextLevel]);

  const handleFinish = useCallback(() => {
    // 結果画面を盤面の上にオーバーレイ表示
    setResultSnapshot({
      cleared: true,
      level: state.level,
      misses: state.missCount,
      revives: state.reviveCount,
      score: state.score,
      timeMs: elapsedRef.current,
      penaltyMs: state.penaltyMs,
    });
  }, [state.level, state.missCount, state.reviveCount, state.score, state.penaltyMs]);

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

  const displayedScore = state.isCleared && answerDone
    ? state.score + (bonusScore ?? 0) + (perfectBonus ?? 0)
    : state.score;
  const remainingBombs = state.bombCount - countFlags(state.board);

  return (
    <PixelScene layout="full" scenery="game">
      <div className={styles.shell}>
        <header className={styles.hud}>
          <h1 className={styles.hudTitle}>{mode === "endless" ? "ENDLESS" : "TIME ATTACK"}</h1>
          <div className={styles.hudDivider}>
            <PixelDivider />
          </div>

          <div className={styles.statusGrid}>
            <div className={`${styles.statusCard} ${styles.primaryCard}`}>
              <span>{mode === "endless" ? "SCORE" : "TIME"}</span>
              {mode === "endless" ? (
                <ScoreDisplay
                  score={displayedScore}
                  renderScore={(value, colorClass) => (
                    <strong className={colorClass}>{value.toLocaleString()}</strong>
                  )}
                />
              ) : (
                <TimerDisplay
                  running={!state.isPaused && !state.isGameOver && !state.isCleared}
                  penaltyMs={state.penaltyMs}
                  elapsedRef={elapsedRef}
                />
              )}
              {mode === "ta" && showPenaltyPopup && (
                <em key={penaltyPopupKey} className="score-float-up">+30s</em>
              )}
            </div>

            <div className={`${styles.statusCard} ${styles.redCard}`}>
              <span>BOMBS</span>
              <strong>{remainingBombs}</strong>
            </div>

            <div className={`${styles.statusCard} ${styles.blueCard}`}>
              <span>{mode === "endless" ? "LIVES" : "REVIVES"}</span>
              <strong>{mode === "endless" ? state.lives : `${state.reviveCount}/${MAX_REVIVES_TA}`}</strong>
            </div>

            {/*
              TAモードでの4枚目は以前「MODE / TA」だったが、モード名は HUD の
              タイトルが名乗るようになったので、代わりに難易度を出す。
              未指定のときの既定は useGame の createInitialState と同じ easy。
            */}
            <div className={`${styles.statusCard} ${styles.levelCard}`}>
              <span>{mode === "endless" ? "LEVEL" : "DIFF"}</span>
              <strong>
                {mode === "endless" ? state.level : (difficulty ?? "easy").toUpperCase()}
              </strong>
            </div>
          </div>
        </header>

        <div className={styles.boardFrame}>
          <div className={styles.boardArea}>
            <Board
              board={state.board}
              onReveal={handleRevealCell}
              onFlag={toggleFlag}
              disabled={state.isPaused || state.isGameOver || state.isCleared}
              showAllBombs={state.isCleared && !answerDone}
              maskCells={state.isPaused && mode === "ta"}
            />

            {mode === "endless" && <ScorePopup popups={popups} />}
          </div>
        </div>

        <div className={styles.controls}>
          <PixelButton
            onClick={pause}
            size="lg"
            leading="||"
            disabled={state.isGameOver || state.isCleared}
          >
            {mode === "endless" ? t("game.menu") : t("game.pause")}
          </PixelButton>
        </div>

        <PauseOverlay
          isOpen={state.isPaused}
          mode={mode}
          onResume={resume}
          onQuit={handleQuitFromPause}
        />

        <GameOverModal
          isOpen={showGameOverModal && !resultSnapshot}
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

        {mode === "endless" && <MilestoneEffect score={state.score} />}

        <GameResultOverlay
          isOpen={resultSnapshot !== null && !showRanking}
          mode={mode}
          difficulty={difficulty ?? null}
          level={resultSnapshot?.level ?? 0}
          misses={resultSnapshot?.misses ?? 0}
          revives={resultSnapshot?.revives ?? 0}
          cleared={resultSnapshot?.cleared ?? false}
          score={resultSnapshot?.score ?? 0}
          timeMs={resultSnapshot?.timeMs ?? 0}
          penaltyMs={resultSnapshot?.penaltyMs ?? 0}
          onSubmitted={() => setShowRanking(true)}
        />

        <RankingOverlay
          isOpen={showRanking}
          initialMode={mode}
          initialDifficulty={difficulty ?? undefined}
          onBack={() => router.push("/")}
        />
      </div>
    </PixelScene>
  );
}

export default function GamePage() {
  return (
    <Suspense
      fallback={
        <PixelScene scenery="game">
          <PixelPanel title="LOADING" compact>
            <PixelMessage>Loading...</PixelMessage>
          </PixelPanel>
        </PixelScene>
      }
    >
      <GameContent />
    </Suspense>
  );
}
