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
  };
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
        // 爆弾を踏んだ
        if (state.mode === "endless") {
          const newLives = state.lives - 1;
          if (newLives > 0) {
            // 残機があれば続行
            resetExplodedCell(newBoard);
            return {
              ...state,
              board: newBoard,
              lives: newLives,
              missCount: state.missCount + 1,
            };
          } else {
            // 残機切れ → ゲームオーバー
            return {
              ...state,
              board: newBoard,
              lives: 0,
              missCount: state.missCount + 1,
              isGameOver: true,
            };
          }
        } else {
          // Time Attack
          return {
            ...state,
            board: newBoard,
            missCount: state.missCount + 1,
            isGameOver: true,
          };
        }
      }

      // 勝利判定
      if (checkWin(newBoard)) {
        return {
          ...state,
          board: newBoard,
          isCleared: true,
        };
      }

      return {
        ...state,
        board: newBoard,
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
        // Endless: 残機を回復
        resetExplodedCell(state.board);
        return {
          ...state,
          lives: REVIVE_LIVES,
          isGameOver: false,
        };
      } else {
        // Time Attack: 復活回数チェック
        if (state.reviveCount >= MAX_REVIVES_TA) {
          return state;
        }
        const newBoard = cloneBoard(state.board);
        resetExplodedCell(newBoard);
        return {
          ...state,
          board: newBoard,
          reviveCount: state.reviveCount + 1,
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

    case "NEXT_LEVEL": {
      if (state.mode !== "endless" || !state.isCleared) {
        return state;
      }

      const newBombCount = Math.min(state.bombCount + 1, MAX_BOMBS);
      const newBoard = generateBoard(newBombCount);

      return {
        ...state,
        board: newBoard,
        bombCount: newBombCount,
        level: state.level + 1,
        isCleared: false,
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

  const revealCellAction = useCallback((row: number, col: number) => {
    dispatch({ type: "REVEAL_CELL", row, col });
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
    nextLevel,
    reset,
  };
}
