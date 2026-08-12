/**
 * `/api/score` へのスコア投稿クライアント。
 *
 * サーバー側の検証（`src/lib/score-validation.ts`）が投稿を拒否したとき、
 * 呼び出し側が「通信に失敗した」のか「値が拒否された」のかを区別できるようにする。
 *
 * 現在 `src/app/result/page.tsx` は fetch の結果を見ずにランキングへ遷移しているため、
 * 拒否されたスコアは黙って消える。文言の出し分けはレーンBの担当だが、
 * その差し替えが 1 行で済むようにここに寄せてある。
 *
 * ```ts
 * const result = await submitScore(payload);
 * if (result.status === "rejected") {
 *   // result.code に応じて文言を出す
 * }
 * ```
 */

import { ScoreRequest } from "@/types/game";

/** サーバーが返す拒否理由コード。文言はクライアント側で用意する。 */
export type ScoreSubmissionCode =
  | "invalid_request"
  | "level_out_of_range"
  | "score_too_high"
  | "score_exceeds_storage"
  | "time_too_short"
  | "time_out_of_range"
  | "penalty_mismatch"
  | "rate_limited"
  | "database_error"
  | "internal_error";

export type ScoreSubmissionResult =
  /** 登録できた。 */
  | { status: "accepted"; id: string }
  /** 値が検証に引っかかった。再送しても同じ結果になる。 */
  | { status: "rejected"; code: ScoreSubmissionCode; message: string }
  /** 短時間に投稿しすぎた。時間をおけば通る。 */
  | { status: "rate_limited"; message: string }
  /** サーバー側の不具合、または通信断。再送する価値がある。 */
  | { status: "error"; message: string };

interface ScoreApiResponse {
  success?: boolean;
  id?: string;
  error?: string;
  code?: ScoreSubmissionCode;
}

export async function submitScore(payload: ScoreRequest): Promise<ScoreSubmissionResult> {
  let response: Response;

  try {
    response = await fetch("/api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "Network error" };
  }

  let body: ScoreApiResponse = {};
  try {
    body = (await response.json()) as ScoreApiResponse;
  } catch {
    // 本文が読めなくてもステータスコードだけで判断を続ける
  }

  if (response.ok && body.success && body.id) {
    return { status: "accepted", id: body.id };
  }

  if (response.status === 429) {
    return { status: "rate_limited", message: body.error || "Rate limited" };
  }

  // 400（形の不備）と 422（プレイ内容との矛盾）はどちらも再送しても通らない
  if (response.status === 400 || response.status === 422) {
    return {
      status: "rejected",
      code: body.code || "invalid_request",
      message: body.error || "Score rejected",
    };
  }

  return { status: "error", message: body.error || `Request failed (${response.status})` };
}
