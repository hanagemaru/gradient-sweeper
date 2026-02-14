// セルの状態
export type CellState = "hidden" | "revealed" | "flagged" | "exploded";

// 爆弾の種類
export type BombType = "red" | "blue";

// セル
export interface Cell {
  row: number;
  col: number;
  state: CellState;
  hasBomb: boolean;
  bombType: BombType | null;
  adjacentRed: number;
  adjacentBlue: number;
}

// 盤面
export interface Board {
  cells: Cell[][];
  bombCount: number;
}

// ゲームモード
export type GameMode = "endless" | "ta";

// 難易度（Time Attack用）
export type Difficulty = "easy" | "mid" | "hard";

// ゲーム状態
export interface GameState {
  mode: GameMode;
  difficulty?: Difficulty;
  board: Board;
  bombCount: number;
  lives: number;
  missCount: number;
  reviveCount: number;
  level: number;
  isPaused: boolean;
  isGameOver: boolean;
  isCleared: boolean;
  elapsedMs: number;
  score: number;                    // Endless用リアルタイムスコア
  penaltyMs: number;               // TA用累積ペナルティ時間
  lastScoreChange: number | null;   // 直前のスコア変動（popup表示用）
  lastRevealMs: number | null;      // 直前のセル開放タイムスタンプ（スピードボーナス用）
  speedCombo: number;               // 連続スピードボーナス回数
  levelMisses: number;              // 現レベルでのミス数（パーフェクトボーナス判定用）
}

// ゲームアクション
export type GameAction =
  | { type: "REVEAL_CELL"; row: number; col: number; timestamp: number }
  | { type: "TOGGLE_FLAG"; row: number; col: number }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "TICK"; deltaMs: number }
  | { type: "REVIVE" }
  | { type: "GIVE_UP" }
  | { type: "RESET_EXPLODED" }
  | { type: "NEXT_LEVEL" }
  | { type: "RESET"; mode: GameMode; difficulty?: Difficulty };

// セルを開いた結果
export type RevealResult =
  | { type: "noop" }
  | { type: "reveal"; cells: Cell[] }
  | { type: "bomb"; cell: Cell };

// スコア登録リクエスト
export interface ScoreRequest {
  mode: GameMode;
  difficulty?: Difficulty;
  time_ms?: number;          // TA用プレイ時間
  penalty_ms?: number;       // TA用ペナルティ時間
  endless_level?: number;
  miss_count: number;
  revive_count: number;
  player_name?: string;
  score?: number;            // Endless用クライアント算出スコア
}

// ランキングエントリ
export interface LeaderboardEntry {
  rank: number;
  player_name?: string;
  score: number;
  time_ms?: number;
  penalty_ms?: number;
  endless_level?: number;
  miss_count: number;
  revive_count: number;
  created_at: string;
}

// 難易度ごとの爆弾数
export const BOMB_COUNTS: Record<Difficulty, number> = {
  easy: 10,
  mid: 20,
  hard: 30,
};

// グリッドサイズ
export const GRID_SIZE = 9;

// 最大爆弾数（Endless）
export const MAX_BOMBS = 80;

// 初期爆弾数（Endless）
export const INITIAL_BOMBS = 3;

// 初期残機（Endless）
export const INITIAL_LIVES = 3;

// 復活回復残機数
export const REVIVE_LIVES = 3;

// 最大復活回数（Time Attack）
export const MAX_REVIVES_TA = 2;

// スコア定数（Endless）
export const SCORE_PER_CELL = 100;         // セル1個あたりの基礎スコア
export const LEVEL_CLEAR_BONUS = 1000;     // レベルクリアボーナス基礎値
export const MISS_PENALTY = 10000;         // ミスペナルティ
export const SPEED_BONUS_THRESHOLD_MS = 1000; // スピードボーナス判定閾値（1秒）
export const PERFECT_BONUS_MULTIPLIER = 1; // パーフェクトボーナス = クリアボーナスと同額

// TA復活ペナルティ（30秒）
export const TA_REVIVE_PENALTY_MS = 30000;
