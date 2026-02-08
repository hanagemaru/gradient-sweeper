import { GameMode } from "@/types/game";

export interface ScoreParams {
  mode: GameMode;
  level: number;
  timeMs: number;
  missCount: number;
  reviveCount: number;
}

/**
 * スコアを計算する
 * 
 * エンドレスモード:
 * - レベルが最重要（1レベル = 20,000点）
 * - タイムは秒単位でマイナス
 * - ミス1回 = 500点ペナルティ
 * - 復活1回 = 1,000点ペナルティ
 * 
 * タイムアタックモード:
 * - タイムが最重要（速いほど高得点）
 * - ミス1回 = 5,000点ペナルティ
 * - 復活1回 = 10,000点ペナルティ
 */
export function calculateScore(params: ScoreParams): number {
  const { mode, level, timeMs, missCount, reviveCount } = params;
  
  if (mode === "endless") {
    // エンドレス: レベル重視
    const levelScore = level * 20000;
    const timePenalty = Math.floor(timeMs / 1000); // 秒単位
    const missPenalty = missCount * 500;
    const revivePenalty = reviveCount * 1000;
    
    return Math.max(0, levelScore - timePenalty - missPenalty - revivePenalty);
  } else {
    // タイムアタック: タイム重視
    const baseScore = 1000000;
    const timePenalty = Math.floor(timeMs / 10); // 10ms単位
    const missPenalty = missCount * 5000;
    const revivePenalty = reviveCount * 10000;
    
    return Math.max(0, baseScore - timePenalty - missPenalty - revivePenalty);
  }
}
