"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/useI18n";
import { GameMode, Difficulty, LeaderboardEntry } from "@/types/game";
import { formatTime } from "@/hooks/useTimer";
import {
  PixelButton,
  PixelButtonGroup,
  PixelMessage,
  PixelPanel,
  PixelTable,
  PixelTabs,
} from "@/components/ui/PixelUI";

export interface RankingPanelProps {
  initialMode?: GameMode;
  initialDifficulty?: Difficulty;
  /** 「戻る」の遷移先。`onBack` を渡した場合はそちらが優先される。 */
  backHref?: string;
  /** 「戻る」でオーバーレイを閉じる場合に渡す。 */
  onBack?: () => void;
}

/**
 * ランキングの中身（`PixelPanel` 1枚）。
 *
 * `PixelScene` は**含めない**。`/ranking` ページは通常の `PixelScene` で、
 * ホームとゲーム上のオーバーレイは `RankingOverlay`（= `PixelScene overlay`）で
 * それぞれ包む。どちらも同じ `.scene` の固定キャンバスを通るので、
 * パネルの寸法・位置・拡大率は起点によらず一致する。
 *
 * `useSearchParams` はここでは使わない（Suspense 境界を呼び出し側に強制しない
 * ため）。初期タブは props で受け取る。
 */
export function RankingPanel({
  initialMode = "endless",
  initialDifficulty = "easy",
  backHref,
  onBack,
}: RankingPanelProps) {
  const { t } = useI18n();

  const [mode, setMode] = useState<GameMode>(initialMode);
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty);
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchLeaderboard = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ mode });
        if (mode === "ta") params.set("difficulty", difficulty);

        // スコア登録の直後に開かれる経路があるので、キャッシュされた
        // 一覧を掴まないようにする。
        const response = await fetch(`/api/leaderboard?${params.toString()}`, {
          cache: "no-store",
        });
        const json = await response.json();
        if (cancelled) return;

        if (json.success) {
          setData(json.data);
        } else {
          setError(json.error || "Failed to fetch");
        }
      } catch {
        if (!cancelled) setError("Network error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchLeaderboard();

    // オーバーレイはタブを切り替えている途中で閉じられる可能性がある。
    // 閉じたあとの setState を避けるため、応答を捨てられるようにしておく。
    return () => {
      cancelled = true;
    };
  }, [mode, difficulty]);

  return (
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
        {onBack ? (
          <PixelButton variant="ghost" block leading="◀" onClick={onBack}>
            {t("ranking.back")}
          </PixelButton>
        ) : (
          <PixelButton href={backHref ?? "/"} variant="ghost" block leading="◀">
            {t("ranking.back")}
          </PixelButton>
        )}
      </PixelButtonGroup>
    </PixelPanel>
  );
}
