import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

// シンプルなレート制限（メモリ内）
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1分
const RATE_LIMIT_MAX = 10; // 1分あたり10回

function isRateLimited(ip: string): boolean {
  const now = Date.now();
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

interface ScoreRequestBody {
  mode: string;
  difficulty?: string;
  // Endless用
  score?: number;
  endless_level?: number;
  // TA用
  time_ms?: number;
  penalty_ms?: number;
  // 共通
  miss_count: number;
  revive_count: number;
  player_name?: string;
}

function isValidScore(body: unknown): body is ScoreRequestBody {
  if (!body || typeof body !== "object") return false;

  const b = body as Record<string, unknown>;

  // mode
  if (!["endless", "ta"].includes(b.mode as string)) return false;

  // difficulty（TAの場合必須）
  if (b.mode === "ta") {
    if (!["easy", "mid", "hard"].includes(b.difficulty as string)) return false;
  }

  // Endless: score と endless_level が必須
  if (b.mode === "endless") {
    if (typeof b.score !== "number" || b.score < 0) return false;
    if (typeof b.endless_level !== "number" || b.endless_level < 1) return false;
  }

  // TA: time_ms が必須
  if (b.mode === "ta") {
    if (typeof b.time_ms !== "number" || b.time_ms < 0 || b.time_ms > 86400000) {
      return false;
    }
  }

  // penalty_ms（TA用、オプション）
  if (b.penalty_ms !== undefined && (typeof b.penalty_ms !== "number" || b.penalty_ms < 0)) {
    return false;
  }

  // miss_count
  if (typeof b.miss_count !== "number" || b.miss_count < 0) return false;

  // revive_count
  if (typeof b.revive_count !== "number" || b.revive_count < 0) return false;

  // player_name (optional)
  if (b.player_name !== undefined && typeof b.player_name !== "string") return false;
  if (typeof b.player_name === "string" && b.player_name.length > 50) return false;

  return true;
}

export async function POST(request: NextRequest) {
  try {
    // レート制限チェック
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { success: false, error: "Rate limited" },
        { status: 429 }
      );
    }

    const body = await request.json();

    // バリデーション
    if (!isValidScore(body)) {
      return NextResponse.json(
        { success: false, error: "Invalid request" },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Supabaseが未設定の場合はモックレスポンス
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.log("[Mock] Score submitted:", body);
      return NextResponse.json(
        { success: true, id: "mock-" + Date.now() },
        { status: 201 }
      );
    }

    // スコア計算
    // Endless: クライアントから受け取った score をそのまま使用
    // TA: 最終タイム = time_ms + penalty_ms をスコアとして保存（ランキング昇順ソート用）
    let dbScore: number;
    if (body.mode === "endless") {
      dbScore = body.score!;
    } else {
      const timeMsVal = body.time_ms || 0;
      const penaltyMsVal = body.penalty_ms || 0;
      dbScore = timeMsVal + penaltyMsVal;
    }

    // DB登録
    const { data, error } = await supabase
      .from("scores")
      .insert({
        mode: body.mode,
        difficulty: body.mode === "ta" ? body.difficulty : null,
        time_ms: body.mode === "ta" ? body.time_ms : null,
        penalty_ms: body.penalty_ms || null,
        endless_level: body.mode === "endless" ? body.endless_level : null,
        miss_count: body.miss_count,
        revive_count: body.revive_count,
        player_name: body.player_name || null,
        score: dbScore,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { success: false, error: "Database error" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: data.id }, { status: 201 });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
