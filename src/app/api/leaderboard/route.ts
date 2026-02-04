import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

// モックデータ（Supabase未設定時用）
const mockData = {
  endless: [
    { rank: 1, time_ms: 125400, endless_level: 25, miss_count: 3, created_at: "2026-02-01T10:00:00Z" },
    { rank: 2, time_ms: 98200, endless_level: 20, miss_count: 2, created_at: "2026-02-01T09:00:00Z" },
    { rank: 3, time_ms: 156000, endless_level: 18, miss_count: 5, created_at: "2026-01-31T15:00:00Z" },
  ],
  ta: {
    easy: [
      { rank: 1, time_ms: 15200, miss_count: 0, created_at: "2026-02-01T10:00:00Z" },
      { rank: 2, time_ms: 18500, miss_count: 1, created_at: "2026-02-01T09:00:00Z" },
    ],
    mid: [
      { rank: 1, time_ms: 35600, miss_count: 1, created_at: "2026-02-01T10:00:00Z" },
    ],
    hard: [
      { rank: 1, time_ms: 72300, miss_count: 2, created_at: "2026-02-01T10:00:00Z" },
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

    let query = supabase
      .from("scores")
      .select("time_ms, endless_level, miss_count, created_at")
      .eq("mode", mode)
      .limit(100);

    if (mode === "endless") {
      query = query
        .order("endless_level", { ascending: false })
        .order("time_ms", { ascending: true });
    } else {
      query = query
        .eq("difficulty", difficulty)
        .order("time_ms", { ascending: true });
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
