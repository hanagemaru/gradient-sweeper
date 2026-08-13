"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useI18n } from "@/i18n/useI18n";
import { formatTime } from "@/hooks/useTimer";
import { GameMode, Difficulty } from "@/types/game";
import {
  PixelButton,
  PixelButtonGroup,
  PixelMessage,
  PixelPanel,
  PixelScene,
  PixelStats,
  PixelTextField,
} from "@/components/ui/PixelUI";

const PLAYER_NAME_KEY = "gradient_sweeper_player_name";

function ResultLoading({ label }: { label: string }) {
  return (
    <PixelScene>
      <PixelPanel title="LOADING" compact>
        <PixelMessage>{label}</PixelMessage>
      </PixelPanel>
    </PixelScene>
  );
}

function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useI18n();

  const mode = searchParams.get("mode") as GameMode;
  const difficulty = searchParams.get("difficulty") as Difficulty | null;
  const level = parseInt(searchParams.get("level") || "1", 10);
  const misses = parseInt(searchParams.get("misses") || "0", 10);
  const revives = parseInt(searchParams.get("revives") || "0", 10);
  const cleared = searchParams.get("cleared") === "true";
  const score = parseInt(searchParams.get("score") || "0", 10);
  const timeMs = parseInt(searchParams.get("time") || "0", 10);
  const penaltyMs = parseInt(searchParams.get("penaltyMs") || "0", 10);
  const finalTimeMs = timeMs + penaltyMs;

  const [playerName, setPlayerName] = useState("");
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem(PLAYER_NAME_KEY);
    if (savedName) setPlayerName(savedName);
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (isNavigating) return;

    const trimmedName = playerName.trim();
    if (trimmedName) localStorage.setItem(PLAYER_NAME_KEY, trimmedName);

    if (mode === "endless") {
      fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          endless_level: level,
          miss_count: misses,
          revive_count: revives,
          player_name: trimmedName || undefined,
          score,
        }),
      }).catch((error) => console.error("Failed to submit score:", error));
    } else {
      fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          difficulty,
          time_ms: timeMs,
          penalty_ms: penaltyMs,
          miss_count: misses,
          revive_count: revives,
          player_name: trimmedName || undefined,
        }),
      }).catch((error) => console.error("Failed to submit score:", error));
    }

    setIsNavigating(true);
    router.push(`/ranking?mode=${mode}${difficulty ? `&difficulty=${difficulty}` : ""}`);
  };

  const handleSkip = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    router.push("/");
  };

  if (isNavigating) return <ResultLoading label={t("common.loading")} />;

  const resultItems =
    mode === "endless"
      ? [
          { label: t("result.level"), value: level },
          { label: t("result.misses"), value: misses },
          { label: t("result.score"), value: score.toLocaleString(), emphasis: true },
        ]
      : [
          ...(penaltyMs > 0
            ? [
                { label: t("result.playTime"), value: formatTime(timeMs) },
                {
                  label: t("result.penalty"),
                  value: `+${formatTime(penaltyMs)}`,
                  danger: true,
                },
              ]
            : []),
          {
            label: t("result.finalTime"),
            value: formatTime(finalTimeMs),
            emphasis: true,
          },
        ];

  return (
    <PixelScene>
      <PixelPanel
        title={mode === "ta" && cleared ? "STAGE CLEAR" : "RESULT"}
        subtitle={
          mode === "ta" && cleared
            ? t("cleared.title")
            : mode === "ta"
              ? "TIME ATTACK"
              : "ENDLESS"
        }
      >
        <PixelStats items={resultItems} />

        <form onSubmit={handleSubmit}>
          <PixelTextField
            id="playerName"
            type="text"
            label={t("result.playerName")}
            optional={t("common.optional")}
            value={playerName}
            onChange={(event) => setPlayerName(event.target.value)}
            placeholder={t("result.enterName")}
            maxLength={50}
          />

          <PixelButtonGroup>
            <PixelButton type="submit" block>
              {t("result.submit")}
            </PixelButton>
            <PixelButton type="button" variant="ghost" block onClick={handleSkip}>
              {t("result.skip")}
            </PixelButton>
          </PixelButtonGroup>
        </form>
      </PixelPanel>
    </PixelScene>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<ResultLoading label="Loading..." />}>
      <ResultContent />
    </Suspense>
  );
}
