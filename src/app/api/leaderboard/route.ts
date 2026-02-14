import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

// モックデータ（Supabase未設定時用）- 新スコアリングシステム対応
const mockData = {
  endless: [
    { rank: 1, player_name: "Player1", score: 520000, endless_level: 12, miss_count: 1, revive_count: 0, created_at: "2026-02-01T10:00:00Z" },
    { rank: 2, player_name: "Player2", score: 380000, endless_level: 10, miss_count: 3, revive_count: 1, created_at: "2026-02-01T09:00:00Z" },
    { rank: 3, player_name: "Player3", score: 245000, endless_level: 8, miss_count: 5, revive_count: 2, created_at: "2026-01-31T15:00:00Z" },
  ],
  ta: {
    easy: [
      { rank: 1, player_name: "SpeedRunner", score: 15200, time_ms: 15200, penalty_ms: 0, miss_count: 0, revive_count: 0, created_at: "2026-02-01T10:00:00Z" },
      { rank: 2, player_name: "FastPlayer", score: 48500, time_ms: 18500, penalty_ms: 30000, miss_count: 1, revive_count: 1, created_at: "2026-02-01T09:00:00Z" },
    ],
    mid: [
      { rank: 1, player_name: "ProGamer", score: 35600, time_ms: 35600, penalty_ms: 0, miss_count: 0, revive_count: 0, created_at: "2026-02-01T10:00:00Z" },
    ],
    hard: [
      { rank: 1, player_name: "Expert", score: 72300, time_ms: 72300, penalty_ms: 0, miss_count: 0, revive_count: 0, created_at: "2026-02-01T10:00:00Z" },
    ],
  },
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode");
    const difficulty = searchParams.get("difficulty");

    // バリデーション
    if (!mode || !["endless", "ta"].includes(mode)) {
      return NextResponse.json(
        { success: false, error: "Invalid mode" },
        { status: 400 }
      );
    }

    if (mode === "ta" && (!difficulty || !["easy", "mid", "hard"].includes(difficulty))) {
      return NextResponse.json(
        { success: false, error: "Difficulty required for TA mode" },
        { status: 400 }
      );
    }

    // Supabaseが未設定の場合はモックデータ
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.log("[Mock] Leaderboard requested:", { mode, difficulty });
      
      if (mode === "endless") {
        return NextResponse.json({ success: true, data: mockData.endless });
      } else {
        const diffKey = difficulty as "easy" | "mid" | "hard";
        return NextResponse.json({ success: true, data: mockData.ta[diffKey] });
      }
    }

    const supabase = createClient();

    // Endless: スコア降順（高スコアが上位）
    // TA: スコア昇順（短タイムが上位。scoreには最終タイム(ms)が格納されている）
    const ascending = mode === "ta";

    let query = supabase
      .from("scores")
      .select("player_name, score, time_ms, penalty_ms, endless_level, miss_count, revive_count, created_at")
      .eq("mode", mode)
      .order("score", { ascending })
      .limit(100);

    if (mode === "ta") {
      query = query.eq("difficulty", difficulty);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { success: false, error: "Database error" },
        { status: 500 }
      );
    }

    // rankを付与
    const rankedData = (data || []).map((entry, index) => ({
      rank: index + 1,
      ...entry,
    }));

    return NextResponse.json({ success: true, data: rankedData });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
