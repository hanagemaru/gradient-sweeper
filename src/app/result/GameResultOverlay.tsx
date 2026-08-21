"use client";

import { useI18n } from "@/i18n/useI18n";
import { formatTime } from "@/hooks/useTimer";
import {
  PixelButton,
  PixelButtonGroup,
  PixelMessage,
  PixelPanel,
  PixelScene,
  PixelStats,
  PixelTextField,
} from "@/components/ui/PixelUI";
import { GameMode, Difficulty } from "@/types/game";
import { useResultSubmission } from "./useResultSubmission";

export interface GameResultOverlayProps {
  isOpen: boolean;
  mode: GameMode;
  difficulty: Difficulty | null;
  level: number;
  misses: number;
  revives: number;
  cleared: boolean;
  /** Endlessのみ使用 */
  score: number;
  /** TAのみ使用 */
  timeMs: number;
  /** TAのみ使用 */
  penaltyMs: number;
  /** スコア送信後に呼ばれる。`/game` はここでランキングへ切り替える。 */
  onSubmitted?: () => void;
}

/**
 * リザルトを盤面の上に重ねて表示するオーバーレイ。
 *
 * `PixelScene overlay` + `PixelPanel` なので、ポーズ・ゲームオーバー・
 * ランキングと枠も暗幕も一致する。中身の組み方（PixelStats + PixelTextField +
 * PixelButtonGroup）はフルページ版の `/result` と揃えてあり、送信・スキップの
 * ロジックは `useResultSubmission` を共有している。
 */
export function GameResultOverlay({
  isOpen,
  mode,
  difficulty,
  level,
  misses,
  revives,
  cleared,
  score,
  timeMs,
  penaltyMs,
  onSubmitted,
}: GameResultOverlayProps) {
  const { t } = useI18n();
  const { playerName, setPlayerName, handleSubmit, handleSkip, isNavigating } =
    useResultSubmission({
      mode,
      difficulty,
      level,
      misses,
      revives,
      score,
      timeMs,
      penaltyMs,
      onSubmitted,
    });

  if (!isOpen) return null;

  const finalTimeMs = timeMs + penaltyMs;
  const title = mode === "ta" && cleared ? t("cleared.title") : t("result.title");

  const stats =
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
                { label: t("result.penalty"), value: `+${formatTime(penaltyMs)}`, danger: true },
              ]
            : []),
          { label: t("result.finalTime"), value: formatTime(finalTimeMs), emphasis: true },
        ];

  return (
    <PixelScene overlay label={title}>
      <PixelPanel title="RESULT" subtitle={title}>
        {isNavigating ? (
          <PixelMessage>{t("common.loading")}</PixelMessage>
        ) : (
          <>
            <PixelStats items={stats} />
            <form onSubmit={handleSubmit}>
              <PixelTextField
                id="result-overlay-player-name"
                label={t("result.playerName")}
                optional={t("common.optional")}
                value={playerName}
                onChange={(event) => setPlayerName(event.target.value)}
                placeholder={t("result.enterName")}
                maxLength={50}
              />
              <PixelButtonGroup>
                <PixelButton type="submit" size="lg" block leading="▶">
                  {t("result.submit")}
                </PixelButton>
                <PixelButton type="button" variant="ghost" block leading="◀" onClick={handleSkip}>
                  {t("result.skip")}
                </PixelButton>
              </PixelButtonGroup>
            </form>
          </>
        )}
      </PixelPanel>
    </PixelScene>
  );
}
