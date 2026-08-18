"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/i18n/useI18n";
import { formatTime } from "@/hooks/useTimer";
import { GameMode, Difficulty } from "@/types/game";
import { useResultSubmission } from "./useResultSubmission";
import {
  PixelButton,
  PixelButtonGroup,
  PixelMessage,
  PixelPanel,
  PixelScene,
  PixelStats,
  PixelTextField,
} from "@/components/ui/PixelUI";

function ResultLoading({ label }: { label: string }) {
  return (
    <PixelScene>
      <PixelPanel title="LOADING" compact>
        <PixelMessage>{label}</PixelMessage>
      </PixelPanel>
    </PixelScene>
  );
}

/**
 * `/result` への直接URLアクセスや、ブラウザの戻る/進むで単独表示された場合の
 * フルページ版。通常のプレイ導線（Give Up・TA自動遷移）は `/game` 側の
 * `GameResultOverlay` を使うようになったため、こちらは直接アクセス用の
 * フォールバックとして残している。表示・送信ロジックは `useResultSubmission`
 * を共有している。
 */
function ResultContent() {
  const searchParams = useSearchParams();
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

  const { playerName, setPlayerName, handleSubmit, handleSkip, isNavigating } =
    useResultSubmission({ mode, difficulty, level, misses, revives, score, timeMs, penaltyMs });

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
