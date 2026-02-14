"use client";

import { useReducer, useCallback } from "react";
import {
  GameState,
  GameAction,
  GameMode,
  Difficulty,
  BOMB_COUNTS,
  INITIAL_BOMBS,
  INITIAL_LIVES,
  MAX_BOMBS,
  REVIVE_LIVES,
  MAX_REVIVES_TA,
  SCORE_PER_CELL,
  LEVEL_CLEAR_BONUS,
  MISS_PENALTY,
  TA_REVIVE_PENALTY_MS,
  SPEED_BONUS_THRESHOLD_MS,
  PERFECT_BONUS_MULTIPLIER,
} from "@/types/game";
import {
  generateBoard,
  revealCell,
  toggleFlag,
  checkWin,
  resetExplodedCell,
  cloneBoard,
} from "@/lib/game-logic";

function createInitialState(mode: GameMode, difficulty?: Difficulty): GameState {
  const bombCount =
    mode === "endless"
      ? INITIAL_BOMBS
      : BOMB_COUNTS[difficulty || "easy"];

  return {
    mode,
    difficulty,
    board: generateBoard(bombCount),
    bombCount,
    lives: mode === "endless" ? INITIAL_LIVES : 0,
    missCount: 0,
    reviveCount: 0,
    level: 1,
    isPaused: false,
    isGameOver: false,
    isCleared: false,
    elapsedMs: 0,
    score: 0,
    penaltyMs: 0,
    lastScoreChange: null,
    lastRevealMs: null,
    speedCombo: 0,
    levelMisses: 0,
  };
}

/**
 * スピードボーナスのコンボ倍率を返す
 * この倍率 × 1セル基礎スコアが追加ボーナスとなる
 * 1回: FAST! ×0.5 / 2回: COMBO! ×1.0 / 3回: GREAT! ×1.5 / 4回以上: AMAZING! ×2.0
 */
function getComboRate(combo: number): number {
  if (combo >= 4) return 2.0;
  if (combo >= 3) return 1.5;
  if (combo >= 2) return 1.0;
  return 0.5;
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "REVEAL_CELL": {
      if (state.isPaused || state.isGameOver || state.isCleared) {
        return state;
      }

      const newBoard = cloneBoard(state.board);
      const result = revealCell(newBoard, action.row, action.col);

      if (result.type === "noop") {
        return state;
      }

      if (result.type === "bomb") {
        // 爆弾を踏んだ（エフェクト表示のため exploded 状態を維持）
        if (state.mode === "endless") {
          const newScore = Math.max(0, state.score - MISS_PENALTY);
          const scoreChange = newScore - state.score; // 負の値
          const newLives = state.lives - 1;
          if (newLives > 0) {
            // 残機があれば続行
            return {
              ...state,
              board: newBoard,
              lives: newLives,
              missCount: state.missCount + 1,
              score: newScore,
              lastScoreChange: scoreChange,
              speedCombo: 0,
              lastRevealMs: null,
              levelMisses: state.levelMisses + 1,
            };
          } else {
            // 残機切れ → ゲームオーバー
            return {
              ...state,
              board: newBoard,
              lives: 0,
              missCount: state.missCount + 1,
              isGameOver: true,
              score: newScore,
              lastScoreChange: scoreChange,
              speedCombo: 0,
              lastRevealMs: null,
              levelMisses: state.levelMisses + 1,
            };
          }
        } else {
          // Time Attack: 即ゲームオーバー
          return {
            ...state,
            board: newBoard,
            missCount: state.missCount + 1,
            isGameOver: true,
          };
        }
      }

      // セル開放スコア加算（Endlessのみ）
      let newScore = state.score;
      let scoreChange: number | null = null;
      let newSpeedCombo = 0;

      if (state.mode === "endless" && result.type === "reveal") {
        // 1. 通常スコア（連鎖含む全セル分）
        const cellScore = result.cells.length * SCORE_PER_CELL * state.level;
        newScore = state.score + cellScore;
        scoreChange = cellScore;

        // 2. スピードボーナス判定（1セル分基準）
        if (
          state.lastRevealMs !== null &&
          (action.timestamp - state.lastRevealMs) <= SPEED_BONUS_THRESHOLD_MS
        ) {
          newSpeedCombo = state.speedCombo + 1;
          const speedBonus = Math.floor(SCORE_PER_CELL * state.level * getComboRate(newSpeedCombo));
          newScore += speedBonus;
          scoreChange += speedBonus;
        }
        // 閾値を超えた場合はコンボリセット（newSpeedCombo は 0 のまま）
      }

      // 勝利判定
      // ボーナスはここでは加算しない（ClearedModal演出後にNEXT_LEVELで加算）
      if (checkWin(newBoard)) {
        return {
          ...state,
          board: newBoard,
          isCleared: true,
          score: newScore,
          lastScoreChange: scoreChange,
          lastRevealMs: action.timestamp,
          speedCombo: newSpeedCombo,
        };
      }

      return {
        ...state,
        board: newBoard,
        score: newScore,
        lastScoreChange: scoreChange,
        lastRevealMs: action.timestamp,
        speedCombo: newSpeedCombo,
      };
    }

    case "TOGGLE_FLAG": {
      if (state.isPaused || state.isGameOver || state.isCleared) {
        return state;
      }

      const newBoard = cloneBoard(state.board);
      toggleFlag(newBoard, action.row, action.col);

      return {
        ...state,
        board: newBoard,
      };
    }

    case "PAUSE": {
      return {
        ...state,
        isPaused: true,
      };
    }

    case "RESUME": {
      return {
        ...state,
        isPaused: false,
      };
    }

    case "TICK": {
      if (state.isPaused || state.isGameOver || state.isCleared) {
        return state;
      }
      return {
        ...state,
        elapsedMs: state.elapsedMs + action.deltaMs,
      };
    }

    case "REVIVE": {
      if (state.mode === "endless") {
        // Endless: 残機を回復（復活ペナルティなし）
        resetExplodedCell(state.board);
        return {
          ...state,
          lives: REVIVE_LIVES,
          reviveCount: state.reviveCount + 1, // バグ修正: reviveCount加算
          isGameOver: false,
        };
      } else {
        // Time Attack: 復活回数チェック + タイムペナルティ
        if (state.reviveCount >= MAX_REVIVES_TA) {
          return state;
        }
        const newBoard = cloneBoard(state.board);
        resetExplodedCell(newBoard);
        return {
          ...state,
          board: newBoard,
          reviveCount: state.reviveCount + 1,
          penaltyMs: state.penaltyMs + TA_REVIVE_PENALTY_MS,
          isGameOver: false,
        };
      }
    }

    case "GIVE_UP": {
      return {
        ...state,
        isGameOver: true,
      };
    }

    case "RESET_EXPLODED": {
      // 爆発エフェクト後に exploded セルを hidden に戻す
      const newBoard = cloneBoard(state.board);
      resetExplodedCell(newBoard);
      return {
        ...state,
        board: newBoard,
      };
    }

    case "NEXT_LEVEL": {
      if (state.mode !== "endless" || !state.isCleared) {
        return state;
      }

      // クリアボーナスをここで確定加算（ClearedModal演出後に呼ばれる）
      const clearBonus = LEVEL_CLEAR_BONUS * state.level;
      const perfect = state.levelMisses === 0
        ? LEVEL_CLEAR_BONUS * state.level * PERFECT_BONUS_MULTIPLIER
        : 0;
      const bonusTotal = clearBonus + perfect;

      const newBombCount = Math.min(state.bombCount + 1, MAX_BOMBS);
      const newBoard = generateBoard(newBombCount);

      return {
        ...state,
        score: state.score + bonusTotal,
        board: newBoard,
        bombCount: newBombCount,
        level: state.level + 1,
        isCleared: false,
        lastScoreChange: null,
        lastRevealMs: null,
        speedCombo: 0,
        levelMisses: 0,
      };
    }

    case "RESET": {
      return createInitialState(action.mode, action.difficulty);
    }

    default:
      return state;
  }
}

export function useGame(initialMode: GameMode, initialDifficulty?: Difficulty) {
  const [state, dispatch] = useReducer(
    gameReducer,
    { mode: initialMode, difficulty: initialDifficulty },
    ({ mode, difficulty }) => createInitialState(mode, difficulty)
  );

  const revealCellAction = useCallback((row: number, col: number, timestamp: number) => {
    dispatch({ type: "REVEAL_CELL", row, col, timestamp });
  }, []);

  const toggleFlagAction = useCallback((row: number, col: number) => {
    dispatch({ type: "TOGGLE_FLAG", row, col });
  }, []);

  const pause = useCallback(() => {
    dispatch({ type: "PAUSE" });
  }, []);

  const resume = useCallback(() => {
    dispatch({ type: "RESUME" });
  }, []);

  const revive = useCallback(() => {
    dispatch({ type: "REVIVE" });
  }, []);

  const giveUp = useCallback(() => {
    dispatch({ type: "GIVE_UP" });
  }, []);

  const resetExploded = useCallback(() => {
    dispatch({ type: "RESET_EXPLODED" });
  }, []);

  const nextLevel = useCallback(() => {
    dispatch({ type: "NEXT_LEVEL" });
  }, []);

  const reset = useCallback((mode: GameMode, difficulty?: Difficulty) => {
    dispatch({ type: "RESET", mode, difficulty });
  }, []);

  return {
    state,
    revealCell: revealCellAction,
    toggleFlag: toggleFlagAction,
    pause,
    resume,
    revive,
    giveUp,
    resetExploded,
    nextLevel,
    reset,
  };
}
