"use client";

import { useI18n } from "@/i18n/useI18n";
import {
  PixelButton,
  PixelButtonGroup,
  PixelPanel,
  PixelScene,
  PixelStats,
} from "@/components/ui/PixelUI";
import { GameMode, MAX_REVIVES_TA } from "@/types/game";

interface GameOverModalProps {
  isOpen: boolean;
  mode: GameMode;
  reviveCount: number;
  onRevive: () => void;
  onGiveUp: () => void;
  onGoHome: () => void;
}

/**
 * ゲームオーバー。`PixelScene overlay` + `PixelPanel` で、ポーズ・リザルト・
 * ランキングと同じ見え方にしてある。閉じる導線はボタンだけなので、
 * Escape も背景クリックも受け付けない（誤操作でスコアを失わせないため）。
 */
export function GameOverModal({
  isOpen,
  mode,
  reviveCount,
  onRevive,
  onGiveUp,
  onGoHome,
}: GameOverModalProps) {
  const { t } = useI18n();

  if (!isOpen) return null;

  const canRevive = mode === "endless" || reviveCount < MAX_REVIVES_TA;
  const remainingRevives = mode === "ta" ? MAX_REVIVES_TA - reviveCount : null;

  return (
    <PixelScene width="menu" overlay label={t("gameOver.title")}>
      <PixelPanel title="GAME OVER" subtitle={t("gameOver.title")}>
        {remainingRevives !== null && (
          <PixelStats
            items={[
              {
                label: t("gameOver.remaining"),
                value: remainingRevives,
                danger: remainingRevives === 0,
              },
            ]}
          />
        )}

        <PixelButtonGroup>
          {canRevive && (
            <PixelButton onClick={onRevive} size="lg" block leading="▶">
              {mode === "ta" ? t("gameOver.reviveWithPenalty") : t("gameOver.revive")}
            </PixelButton>
          )}
          {mode === "ta" ? (
            <PixelButton onClick={onGoHome} variant="ghost" size="lg" block leading="◀">
              {t("gameOver.backToHome")}
            </PixelButton>
          ) : (
            <PixelButton onClick={onGiveUp} variant="ghost" size="lg" block leading="◀">
              {t("gameOver.giveUp")}
            </PixelButton>
          )}
        </PixelButtonGroup>
      </PixelPanel>
    </PixelScene>
  );
}
