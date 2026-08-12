import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import {
  NormalizedSubmission,
  RejectionCode,
  ValidationWarning,
  toStoredScore,
  validateScoreSubmission,
} from "@/lib/score-validation";

// シンプルなレート制限（メモリ内）
//
// 注意: サーバーレス実行では実行インスタンスごとに Map が分かれ、再起動で消える。
// つまりこれは「連打の抑制」であって、本気の攻撃者への対策にはならない。
// 永続化するなら Supabase 側にテーブルを持つか、Netlify のエッジで制限をかける必要がある
// （投稿ごとに追加の書き込みが発生するため、費用と効果を見てから入れる）。
// 不正スコアそのものは、この下の検証で弾く設計にしてある。
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1分
const RATE_LIMIT_MAX = 10; // 1分あたり10回
const RATE_LIMIT_MAX_ENTRIES = 10000; // Map が無制限に膨らまないようにする閾値

/** 期限切れのエントリを掃除する（Map が育ちすぎたときだけ実行）。 */
function sweepRateLimitMap(now: number): void {
  if (rateLimitMap.size < RATE_LIMIT_MAX_ENTRIES) return;

  for (const [key, record] of rateLimitMap) {
    if (now > record.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  sweepRateLimitMap(now);

  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return true;
  }

  record.count++;
  return false;
}

/** 拒否コードに対応する HTTP ステータス。形の不備は 400、内容の矛盾は 422。 */
function statusForRejection(code: RejectionCode): number {
  return code === "invalid_request" ? 400 : 422;
}

/** 個人を特定しうる値（プレイヤー名）を落としたログ用の要約。 */
function logSummary(submission: NormalizedSubmission) {
  return {
    mode: submission.mode,
    difficulty: submission.difficulty,
    score: submission.score,
    endless_level: submission.endlessLevel,
    time_ms: submission.timeMs,
    penalty_ms: submission.penaltyMs,
    miss_count: submission.missCount,
    revive_count: submission.reviveCount,
  };
}

function logWarnings(submission: NormalizedSubmission, warnings: ValidationWarning[]): void {
  if (warnings.length === 0) return;

  // 保存はする。判断に迷う値を弾くより、通してログに残すほうが害が小さい。
  console.warn("[score-validation] accepted with warnings:", {
    ...logSummary(submission),
    warnings: warnings.map((w) => `${w.code}: ${w.detail}`),
  });
}

export async function POST(request: NextRequest) {
  try {
    // レート制限チェック
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { success: false, error: "Rate limited", code: "rate_limited" },
        { status: 429 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid request", code: "invalid_request" },
        { status: 400 }
      );
    }

    // バリデーション（形式 + プレイ内容との整合）
    const validation = validateScoreSubmission(body);

    if (!validation.ok) {
      console.warn("[score-validation] rejected:", {
        code: validation.code,
        detail: validation.detail,
      });
      return NextResponse.json(
        { success: false, error: validation.message, code: validation.code },
        { status: statusForRejection(validation.code) }
      );
    }

    const { submission, warnings } = validation;
    logWarnings(submission, warnings);

    // Supabaseが未設定の場合はモックレスポンス
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.log("[Mock] Score submitted:", logSummary(submission));
      return NextResponse.json(
        { success: true, id: "mock-" + Date.now() },
        { status: 201 }
      );
    }

    const supabase = createClient();

    // スコア計算
    // Endless: 検証を通ったクライアント申告のスコア
    // TA: 最終タイム = time_ms + penalty_ms（ランキング昇順ソート用）
    const dbScore = toStoredScore(submission);

    // DB登録
    const { data, error } = await supabase
      .from("scores")
      .insert({
        mode: submission.mode,
        difficulty: submission.difficulty,
        time_ms: submission.timeMs,
        // Endless ではペナルティ時間の概念がないので、従来どおり NULL のまま入れる
        penalty_ms: submission.mode === "ta" ? submission.penaltyMs : null,
        endless_level: submission.endlessLevel,
        miss_count: submission.missCount,
        revive_count: submission.reviveCount,
        player_name: submission.playerName,
        score: dbScore,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { success: false, error: "Database error", code: "database_error" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: data.id }, { status: 201 });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error", code: "internal_error" },
      { status: 500 }
    );
  }
}
