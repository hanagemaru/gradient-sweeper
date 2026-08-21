"use client";

import { useEffect } from "react";
import { PixelScene } from "@/components/ui/PixelUI";
import { RankingPanel, type RankingPanelProps } from "./RankingPanel";

export interface RankingOverlayProps extends RankingPanelProps {
  isOpen: boolean;
}

/**
 * ランキングを、いま表示されている画面の上へ重ねて出すオーバーレイ。
 *
 * ホーム（`/`）とゲーム（`/game`）の両方から使う。中身は `/ranking` ページと
 * 同じ `RankingPanel`、外枠は `PixelScene` の overlay モードなので、
 * どちらの起点から開いてもパネルの見た目は完全に一致する。
 */
export function RankingOverlay({ isOpen, onBack, ...panelProps }: RankingOverlayProps) {
  useEffect(() => {
    if (!isOpen || !onBack) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onBack();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onBack]);

  if (!isOpen) return null;

  return (
    <PixelScene width="wide" overlay label="RANKING">
      <RankingPanel {...panelProps} onBack={onBack} />
    </PixelScene>
  );
}
