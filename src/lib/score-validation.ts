/**
 * スコア投稿のサーバー側検証
 *
 * ## 方針
 *
 * クライアントで計算されたスコアを完全に検証することは原理的にできない。
 * 盤面の乱数もクリック列もサーバーは持っていないため、ここでできるのは
 * 「そのレベル／難易度では物理的にありえない値」を弾くことだけである。
 *
 * したがって次の 2 段階に分ける。
 *
 * - **拒否 (reject)**: 理論上の上限を超える値、または順位を不当に押し上げる方向の矛盾。
 * - **警告 (warning)**: 矛盾はしているが順位には影響しない値。保存はしてログに残すだけ。
 *
 * 誤検知の害のほうが大きいので、上限は理論値そのものではなく、
 * さらに {@link SAFETY_MARGIN} を掛けた値を採用している。
 * 「怪しいが確証がない」値は通してログに残す。
 *
 * ## スコア計算式との関係
 *
 * 計算式そのものは `src/hooks/useGame.ts` の reducer にあり、このファイルからは変更しない。
 * 定数は `src/types/game.ts` から読み込んでいるので、定数が変われば上限も自動で追従する。
 */

import {
  BOMB_COUNTS,
  Difficulty,
  GRID_SIZE,
  GameMode,
  INITIAL_BOMBS,
  INITIAL_LIVES,
  LEVEL_CLEAR_BONUS,
  MAX_BOMBS,
  MAX_REVIVES_TA,
  PERFECT_BONUS_MULTIPLIER,
  REVIVE_LIVES,
  SCORE_PER_CELL,
  TA_REVIVE_PENALTY_MS,
} from "@/types/game";

// ---------------------------------------------------------------------------
// 上限・下限の定数
// ---------------------------------------------------------------------------

/**
 * DB の `score` カラムは PostgreSQL の INTEGER (int4)。
 * これを超える値は insert 時に必ず失敗するので、500 ではなく 422 で返す。
 */
export const MAX_STORED_SCORE = 2147483647;

/**
 * Endless の到達レベル上限。
 *
 * 爆弾は 80 個で頭打ちになり、それ以降は 1 クリックでクリアできる盤面が続くため、
 * レベル自体には理論上の上限がない。あくまで「人間のセッションとしてありえない」線を引く。
 * 1 レベル最短 1 クリックでも 10000 レベルは何時間もかかる。
 */
export const MAX_ENDLESS_LEVEL = 10000;

/** スピードボーナスのコンボ倍率の最大値（useGame の getComboRate の上限）。 */
export const MAX_SPEED_COMBO_RATE = 2.0;

/**
 * 理論上限に掛ける安全係数。
 *
 * 理論上限の計算はすでにかなり甘い（全セルを最大コンボで開き続け、
 * 毎レベル完全ノーミスでクリアする想定）が、計算漏れで正当なプレイヤーを
 * 弾くほうが不正を 1 件通すより害が大きいので、さらに余裕を持たせる。
 */
export const SAFETY_MARGIN = 1.2;

/**
 * Time Attack の最短クリアタイム(ms)。難易度ごと。
 *
 * この値の根拠は「人間の反応速度」であって「上手いプレイヤーのタイム」ではない。
 * 運が良ければ 1 クリックの連鎖で盤面が開ききる可能性があるため、
 * 上級者の記録を基準にすると誤検知する。盤面描画 + 視認 + クリックに
 * 最低限かかる時間だけを下限とし、`time_ms: 0` のような明らかな捏造だけを弾く。
 */
export const TA_MIN_TIME_MS: Record<Difficulty, number> = {
  easy: 500,
  mid: 700,
  hard: 900,
};

/** Time Attack の最長タイム(ms)。24 時間。 */
export const TA_MAX_TIME_MS = 86400000;

/** 理論上限に対してこの比率を超えたら、通した上でログに残す。 */
const SUSPICIOUS_SCORE_RATIO = 0.5;

/** プレイヤー名の最大長（DB の CHECK 制約と合わせる）。 */
const MAX_PLAYER_NAME_LENGTH = 50;

// ---------------------------------------------------------------------------
// 型
// ---------------------------------------------------------------------------

/** 検証を通過した投稿データ。数値はすべて整数に正規化済み。 */
export interface NormalizedSubmission {
  mode: GameMode;
  difficulty: Difficulty | null;
  score: number | null;
  endlessLevel: number | null;
  timeMs: number | null;
  penaltyMs: number;
  missCount: number;
  reviveCount: number;
  playerName: string | null;
}

/** 拒否理由のコード。クライアントはこれを見て文言を出し分けられる。 */
export type RejectionCode =
  | "invalid_request"
  | "level_out_of_range"
  | "score_too_high"
  | "score_exceeds_storage"
  | "time_too_short"
  | "time_out_of_range"
  | "penalty_mismatch";

/** 保存はするがログに残す矛盾。 */
export interface ValidationWarning {
  code: string;
  detail: string;
}

export type ValidationResult =
  | { ok: true; submission: NormalizedSubmission; warnings: ValidationWarning[] }
  | { ok: false; code: RejectionCode; message: string; detail?: string };

// ---------------------------------------------------------------------------
// 理論上限の計算
// ---------------------------------------------------------------------------

/** そのレベルの爆弾数（useGame の NEXT_LEVEL と同じ増え方）。 */
export function bombCountAtLevel(level: number): number {
  return Math.min(INITIAL_BOMBS + (level - 1), MAX_BOMBS);
}

/** そのレベルで開くことのできるセル数（= 爆弾以外の全セル）。 */
export function revealableCellsAtLevel(level: number): number {
  return GRID_SIZE * GRID_SIZE - bombCountAtLevel(level);
}

/**
 * レベル 1 から `level` までを最良の形で駆け抜けた場合の、Endless スコアの上限。
 *
 * 各レベルについて次を足し上げる。
 *
 * - 開放スコア: 爆弾以外の全セル × `SCORE_PER_CELL` × レベル
 * - スピードボーナス: 1 回の開放につき最大 `SCORE_PER_CELL × レベル × 2.0`。
 *   開放操作の回数はセル数を超えないので、セル数 × 最大倍率で上から押さえられる
 *   （連鎖で複数セルが開く場合、操作回数はむしろ減る）
 * - クリアボーナス: `LEVEL_CLEAR_BONUS × レベル`、ノーミスならさらに同額
 *
 * ミスペナルティは減算方向なので上限計算では無視する。
 * 到達レベル L の時点でクリア済みなのは L-1 レベルだが、
 * 余裕を見て L レベル分のクリアボーナスを許容している。
 */
export function theoreticalMaxEndlessScore(level: number): number {
  let total = 0;

  for (let l = 1; l <= level; l++) {
    const cells = revealableCellsAtLevel(l);
    const cellScore = cells * SCORE_PER_CELL * l;
    const speedBonus = cells * SCORE_PER_CELL * l * MAX_SPEED_COMBO_RATE;
    const clearBonus = LEVEL_CLEAR_BONUS * l * (1 + PERFECT_BONUS_MULTIPLIER);
    total += cellScore + speedBonus + clearBonus;
  }

  return Math.floor(total * SAFETY_MARGIN);
}

/** Endless で構造上ありえるミスの最大回数（初期残機 + 復活ごとの回復分）。 */
export function maxEndlessMissCount(reviveCount: number): number {
  return INITIAL_LIVES + REVIVE_LIVES * reviveCount;
}

// ---------------------------------------------------------------------------
// 入力の正規化
// ---------------------------------------------------------------------------

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * 有限数なら整数に丸めて返す。数値でなければ null。
 *
 * 非整数を拒否せず丸めるのは、クライアントの計算誤差で正当なスコアを
 * 落とさないため。`score` カラムが INTEGER なのでどのみち整数化は必要になる。
 */
function toInt(value: unknown): number | null {
  return isFiniteNumber(value) ? Math.round(value) : null;
}

function invalid(detail: string): ValidationResult {
  return { ok: false, code: "invalid_request", message: "Invalid request", detail };
}

/**
 * リクエストボディの形を検証して正規化する。
 * ここで見るのは型・必須・範囲だけで、プレイとの整合は {@link validateScoreSubmission} で見る。
 */
function normalize(body: unknown): ValidationResult {
  if (!body || typeof body !== "object") {
    return invalid("body is not an object");
  }

  const b = body as Record<string, unknown>;

  if (b.mode !== "endless" && b.mode !== "ta") {
    return invalid("unknown mode");
  }
  const mode: GameMode = b.mode;

  let difficulty: Difficulty | null = null;
  if (mode === "ta") {
    if (b.difficulty !== "easy" && b.difficulty !== "mid" && b.difficulty !== "hard") {
      return invalid("difficulty is required for ta mode");
    }
    difficulty = b.difficulty;
  }

  const missCount = toInt(b.miss_count);
  if (missCount === null || missCount < 0) {
    return invalid("miss_count must be a non-negative number");
  }

  const reviveCount = toInt(b.revive_count);
  if (reviveCount === null || reviveCount < 0) {
    return invalid("revive_count must be a non-negative number");
  }

  let penaltyMs = 0;
  if (b.penalty_ms !== undefined && b.penalty_ms !== null) {
    const parsed = toInt(b.penalty_ms);
    if (parsed === null || parsed < 0) {
      return invalid("penalty_ms must be a non-negative number");
    }
    penaltyMs = parsed;
  }

  let score: number | null = null;
  let endlessLevel: number | null = null;
  let timeMs: number | null = null;

  if (mode === "endless") {
    score = toInt(b.score);
    if (score === null || score < 0) {
      return invalid("score must be a non-negative number");
    }

    endlessLevel = toInt(b.endless_level);
    if (endlessLevel === null || endlessLevel < 1) {
      return invalid("endless_level must be 1 or greater");
    }
  } else {
    timeMs = toInt(b.time_ms);
    if (timeMs === null || timeMs < 0) {
      return invalid("time_ms must be a non-negative number");
    }
  }

  if (b.player_name !== undefined && b.player_name !== null) {
    if (typeof b.player_name !== "string") {
      return invalid("player_name must be a string");
    }
    if (b.player_name.length > MAX_PLAYER_NAME_LENGTH) {
      return invalid("player_name is too long");
    }
  }

  const rawName = typeof b.player_name === "string" ? b.player_name.trim() : "";

  return {
    ok: true,
    submission: {
      mode,
      difficulty,
      score,
      endlessLevel,
      timeMs,
      penaltyMs,
      missCount,
      reviveCount,
      playerName: rawName === "" ? null : rawName,
    },
    warnings: [],
  };
}

// ---------------------------------------------------------------------------
// プレイとの整合チェック
// ---------------------------------------------------------------------------

function validateEndless(
  submission: NormalizedSubmission,
  warnings: ValidationWarning[]
): ValidationResult | null {
  const level = submission.endlessLevel as number;
  const score = submission.score as number;

  if (level > MAX_ENDLESS_LEVEL) {
    return {
      ok: false,
      code: "level_out_of_range",
      message: "Reported level is not attainable",
      detail: `level=${level} > ${MAX_ENDLESS_LEVEL}`,
    };
  }

  if (score > MAX_STORED_SCORE) {
    return {
      ok: false,
      code: "score_exceeds_storage",
      message: "Score is out of the storable range",
      detail: `score=${score} > ${MAX_STORED_SCORE}`,
    };
  }

  const maxScore = theoreticalMaxEndlessScore(level);
  if (score > maxScore) {
    return {
      ok: false,
      code: "score_too_high",
      message: "Score exceeds the maximum attainable for the reported level",
      detail: `score=${score} > max=${maxScore} (level=${level})`,
    };
  }

  // ここから下は「順位を不当に上げる方向ではない」矛盾なので、通してログに残す。

  const maxMisses = maxEndlessMissCount(submission.reviveCount);
  if (submission.missCount > maxMisses) {
    warnings.push({
      code: "miss_count_impossible",
      detail: `miss_count=${submission.missCount} > ${maxMisses} (revive_count=${submission.reviveCount})`,
    });
  }

  // ミスが多いのに理論上限に近い、という組み合わせ。
  // ミスペナルティは 0 で下げ止まるため上限計算に織り込めない（織り込むと誤検知する）。
  // 拒否はせず、傾向として記録するだけにとどめる。
  if (submission.missCount > 0 && score > maxScore * SUSPICIOUS_SCORE_RATIO) {
    warnings.push({
      code: "high_score_with_misses",
      detail: `score=${score} is ${((score / maxScore) * 100).toFixed(1)}% of max with miss_count=${submission.missCount}`,
    });
  } else if (score > maxScore * SUSPICIOUS_SCORE_RATIO) {
    warnings.push({
      code: "score_near_max",
      detail: `score=${score} is ${((score / maxScore) * 100).toFixed(1)}% of max=${maxScore}`,
    });
  }

  return null;
}

function validateTimeAttack(
  submission: NormalizedSubmission,
  warnings: ValidationWarning[]
): ValidationResult | null {
  const difficulty = submission.difficulty as Difficulty;
  const timeMs = submission.timeMs as number;
  const finalTimeMs = timeMs + submission.penaltyMs;

  if (timeMs < TA_MIN_TIME_MS[difficulty]) {
    return {
      ok: false,
      code: "time_too_short",
      message: "Reported time is not physically attainable",
      detail: `time_ms=${timeMs} < ${TA_MIN_TIME_MS[difficulty]} (difficulty=${difficulty}, bombs=${BOMB_COUNTS[difficulty]})`,
    };
  }

  if (timeMs > TA_MAX_TIME_MS || finalTimeMs > TA_MAX_TIME_MS) {
    return {
      ok: false,
      code: "time_out_of_range",
      message: "Reported time is out of range",
      detail: `final_time_ms=${finalTimeMs} > ${TA_MAX_TIME_MS}`,
    };
  }

  // 復活すると必ず TA_REVIVE_PENALTY_MS が積まれる。
  // 申告されたペナルティがそれより短いのは、タイムを縮める方向の矛盾なので拒否する。
  const expectedPenaltyMs = submission.reviveCount * TA_REVIVE_PENALTY_MS;
  if (submission.penaltyMs < expectedPenaltyMs) {
    return {
      ok: false,
      code: "penalty_mismatch",
      message: "Penalty time does not match the reported revive count",
      detail: `penalty_ms=${submission.penaltyMs} < expected=${expectedPenaltyMs} (revive_count=${submission.reviveCount})`,
    };
  }

  // 逆に多すぎる分は自分が損をするだけなので通す。
  if (submission.penaltyMs > expectedPenaltyMs) {
    warnings.push({
      code: "penalty_above_expected",
      detail: `penalty_ms=${submission.penaltyMs} > expected=${expectedPenaltyMs}`,
    });
  }

  if (submission.reviveCount > MAX_REVIVES_TA) {
    warnings.push({
      code: "revive_count_impossible",
      detail: `revive_count=${submission.reviveCount} > ${MAX_REVIVES_TA}`,
    });
  }

  // TA は被弾した時点でゲームオーバー。復活のたびに 1 回だけ続行できる。
  if (submission.missCount > submission.reviveCount + 1) {
    warnings.push({
      code: "miss_count_impossible",
      detail: `miss_count=${submission.missCount} > ${submission.reviveCount + 1} (revive_count=${submission.reviveCount})`,
    });
  }

  return null;
}

/**
 * スコア投稿を検証する。
 *
 * @returns 通過した場合は正規化済みデータと警告、拒否する場合は理由コード。
 */
export function validateScoreSubmission(body: unknown): ValidationResult {
  const normalized = normalize(body);
  if (!normalized.ok) {
    return normalized;
  }

  const { submission } = normalized;
  const warnings: ValidationWarning[] = [];

  const rejection =
    submission.mode === "endless"
      ? validateEndless(submission, warnings)
      : validateTimeAttack(submission, warnings);

  if (rejection) {
    return rejection;
  }

  return { ok: true, submission, warnings };
}

/** DB の `score` カラムに入れる値を決める。Endless は素点、TA は最終タイム(ms)。 */
export function toStoredScore(submission: NormalizedSubmission): number {
  if (submission.mode === "endless") {
    return submission.score as number;
  }
  return (submission.timeMs as number) + submission.penaltyMs;
}
