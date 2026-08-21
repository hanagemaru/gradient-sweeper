"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/useI18n";
import {
  PixelButton,
  PixelButtonGroup,
  PixelPanel,
  PixelScene,
} from "@/components/ui/PixelUI";
import { RankingOverlay } from "./ranking/RankingOverlay";

export default function Home() {
  const { t } = useI18n();

  // ランキングは `/ranking` への遷移ではなく、ホームの背景の上へ重ねて出す。
  // 遷移しないぶん背景が作り直されないので、背景にアニメーションを足しても
  // この経路では巻き戻らない。
  const [rankingOpen, setRankingOpen] = useState(false);

  return (
    <>
      <PixelScene languageToggle width="menu">
        <PixelPanel title="GRADIENT SWEEPER">
          <PixelButtonGroup>
            <PixelButton href="/game?mode=endless" size="lg" block leading="▶">
              {t("home.endless")}
            </PixelButton>
            <PixelButton href="/ta" size="lg" block leading="▶">
              {t("home.timeAttack")}
            </PixelButton>
            <PixelButton size="lg" block leading="▶" onClick={() => setRankingOpen(true)}>
              {t("home.ranking")}
            </PixelButton>
          </PixelButtonGroup>
        </PixelPanel>
      </PixelScene>

      <RankingOverlay isOpen={rankingOpen} onBack={() => setRankingOpen(false)} />
    </>
  );
}
