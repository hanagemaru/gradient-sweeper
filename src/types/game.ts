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
}

// ゲームアクション
export type GameAction =
  | { type: "REVEAL_CELL"; row: number; col: number }
  | { type: "TOGGLE_FLAG"; row: number; col: number }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "TICK"; deltaMs: number }
  | { type: "REVIVE" }
  | { type: "GIVE_UP" }
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
  time_ms: number;
  endless_level?: number;
  miss_count: number;
}

// ランキングエントリ
export interface LeaderboardEntry {
  rank: number;
  time_ms: number;
  endless_level?: number;
  miss_count: number;
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
