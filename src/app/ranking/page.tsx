"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/i18n/useI18n";
import { GameMode, Difficulty, LeaderboardEntry } from "@/types/game";
import { formatTime } from "@/hooks/useTimer";
import {
  PixelButton,
  PixelButtonGroup,
  PixelMessage,
  PixelPanel,
  PixelScene,
  PixelTable,
  PixelTabs,
} from "@/components/ui/PixelUI";

function RankingLoading() {
  return (
    <PixelScene width="wide">
      <PixelPanel title="RANKING">
        <PixelMessage>Loading...</PixelMessage>
      </PixelPanel>
    </PixelScene>
  );
}

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
        if (mode === "ta") params.set("difficulty", difficulty);

        const response = await fetch(`/api/leaderboard?${params.toString()}`);
        const json = await response.json();

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
    <PixelScene width="wide">
      <PixelPanel title="RANKING">
        <PixelTabs>
          <PixelButton
            variant={mode === "endless" ? "primary" : "tab"}
            size="sm"
            onClick={() => setMode("endless")}
          >
            {t("ranking.endless")}
          </PixelButton>
          <PixelButton
            variant={mode === "ta" ? "primary" : "tab"}
            size="sm"
            onClick={() => setMode("ta")}
          >
            {t("ranking.timeAttack")}
          </PixelButton>
        </PixelTabs>

        {mode === "ta" && (
          <PixelTabs>
            {(["easy", "mid", "hard"] as Difficulty[]).map((item) => (
              <PixelButton
                key={item}
                variant={difficulty === item ? "secondary" : "tab"}
                size="sm"
                onClick={() => setDifficulty(item)}
              >
                {t(`ta.${item}` as const)}
              </PixelButton>
            ))}
          </PixelTabs>
        )}

        {loading ? (
          <PixelMessage>{t("common.loading")}</PixelMessage>
        ) : error ? (
          <PixelMessage error>{error}</PixelMessage>
        ) : data.length === 0 ? (
          <PixelMessage>{t("ranking.noData")}</PixelMessage>
        ) : (
          <PixelTable>
            <thead>
              <tr>
                <th scope="col">{t("ranking.rank")}</th>
                <th scope="col">{t("ranking.name")}</th>
                <th scope="col" data-numeric="true">
                  {mode === "endless" ? t("ranking.score") : t("ranking.finalTime")}
                </th>
                {mode === "endless" && (
                  <th scope="col" data-numeric="true">
                    {t("ranking.level")}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {data.map((entry) => (
                <tr key={entry.rank}>
                  <td data-medal={entry.rank <= 3}>#{entry.rank}</td>
                  <td>{entry.player_name || "Anonymous"}</td>
                  <td data-numeric="true">
                    {mode === "endless"
                      ? entry.score.toLocaleString()
                      : formatTime(entry.score)}
                  </td>
                  {mode === "endless" && (
                    <td data-numeric="true">{entry.endless_level}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </PixelTable>
        )}

        <PixelButtonGroup>
          <PixelButton href="/" variant="ghost" block leading="◀">
            {t("ranking.back")}
          </PixelButton>
        </PixelButtonGroup>
      </PixelPanel>
    </PixelScene>
  );
}

export default function RankingPage() {
  return (
    <Suspense fallback={<RankingLoading />}>
      <RankingContent />
    </Suspense>
  );
}
