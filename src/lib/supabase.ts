import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// 環境変数から取得
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// サーバーサイド用クライアント
export function createClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("Supabase credentials not configured");
  }
  
  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
    },
  });
}

// DB型定義
export interface ScoreRow {
  id: string;
  mode: "endless" | "ta";
  difficulty: "easy" | "mid" | "hard" | null;
  time_ms: number;
  endless_level: number | null;
  miss_count: number;
  created_at: string;
}
