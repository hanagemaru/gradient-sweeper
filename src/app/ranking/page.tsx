"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/i18n/useI18n";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/Icon";
import { formatTime } from "@/hooks/useTimer";
import { GameMode, Difficulty, LeaderboardEntry } from "@/types/game";

function RankingContent() {
  const searchParams = useSearchParams();
  const { t } = useI18n();

  const initialMode = (searchParams.get("mode") as GameMode) || "endless";
  const initialDifficulty = searchParams.get("difficulty") as Difficulty | undefined;

  const [mode, setMode] = useState<GameMode>(initialMode);
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty || "easy");
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ mode });
        if (mode === "ta") {
          params.set("difficulty", difficulty);
        }

        const res = await fetch(`/api/leaderboard?${params.toString()}`);
        const json = await res.json();

        if (json.success) {
          setData(json.data);
        } else {
          setError(json.error || "Failed to fetch");
        }
      } catch {
        setError("Network error");
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [mode, difficulty]);

  return (
    <main className="flex flex-col items-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-6">{t("ranking.title")}</h1>

      {/* モード切替 */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={mode === "endless" ? "primary" : "ghost"}
          size="sm"
          onClick={() => setMode("endless")}
        >
          {t("ranking.endless")}
        </Button>
        <Button
          variant={mode === "ta" ? "primary" : "ghost"}
          size="sm"
          onClick={() => setMode("ta")}
        >
          {t("ranking.timeAttack")}
        </Button>
      </div>

      {/* 難易度切替（TA時のみ） */}
      {mode === "ta" && (
        <div className="flex gap-2 mb-4">
          {(["easy", "mid", "hard"] as Difficulty[]).map((d) => (
            <Button
              key={d}
              variant={difficulty === d ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setDifficulty(d)}
            >
              {t(`ta.${d}` as const)}
            </Button>
          ))}
        </div>
      )}

      {/* ランキングテーブル */}
      <div className="w-full max-w-md bg-gray-900 rounded-xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-8 text-center text-gray-400">
            {t("common.loading")}
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-400">{error}</div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            {t("ranking.noData")}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="py-3 px-4 text-left text-gray-100">{t("ranking.rank")}</th>
                <th className="py-3 px-4 text-left text-gray-100">{t("ranking.name")}</th>
                <th className="py-3 px-4 text-right text-gray-100">{t("ranking.score")}</th>
                {mode === "endless" && (
                  <th className="py-3 px-4 text-right text-gray-100">{t("ranking.level")}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {data.map((entry) => (
                <tr key={entry.rank} className="border-t border-gray-600">
                  <td className="py-3 px-4 text-white">
                    {entry.rank <= 3 ? (
                      <span className="text-yellow-400">#{entry.rank}</span>
                    ) : (
                      `#${entry.rank}`
                    )}
                  </td>
                  <td className="py-3 px-4 text-white truncate max-w-[100px]">
                    {entry.player_name || "Anonymous"}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-white">
                    {entry.score.toLocaleString()}
                  </td>
                  {mode === "endless" && (
                    <td className="py-3 px-4 text-right font-semibold text-white">
                      {entry.endless_level}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 戻るボタン */}
      <Link href="/" className="mt-6">
        <Button variant="ghost">
          <Icon name="back" />
          {t("ranking.back")}
        </Button>
      </Link>
    </main>
  );
}

export default function RankingPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <RankingContent />
    </Suspense>
  );
}
