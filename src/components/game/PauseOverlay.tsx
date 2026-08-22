"use client";

import { useEffect } from "react";
import { useI18n } from "@/i18n/useI18n";
import {
  PixelButton,
  PixelButtonGroup,
  PixelPanel,
  PixelScene,
} from "@/components/ui/PixelUI";
import type { GameMode } from "@/types/game";

interface PauseOverlayProps {
  isOpen: boolean;
  mode: GameMode;
  onResume: () => void;
  onQuit: () => void;
}

/**
 * ポーズ。盤面の内側だけを覆う独自の暗幕をやめ、`RankingOverlay` と同じ
 * `PixelScene overlay` に載せている。暗幕の濃度もパネルの寸法も、
 * ホームから開くオーバーレイと一致する。
 */
export function PauseOverlay({ isOpen, mode: _mode, onResume, onQuit }: PauseOverlayProps) {
  const { t } = useI18n();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onResume();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onResume]);

  if (!isOpen) return null;

  return (
    <PixelScene width="menu" overlay label={t("game.paused")}>
      <PixelPanel title="PAUSED" subtitle={t("game.paused")}>
        <PixelButtonGroup>
          <PixelButton onClick={onResume} size="lg" block leading="▶">
            {t("game.backToGame")}
          </PixelButton>
          <PixelButton onClick={onQuit} variant="ghost" size="lg" block leading="◀">
            {t("game.quit")}
          </PixelButton>
        </PixelButtonGroup>
      </PixelPanel>
    </PixelScene>
  );
}
