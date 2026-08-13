"use client";

import { useI18n } from "@/i18n/useI18n";
import {
  PixelButton,
  PixelButtonGroup,
  PixelPanel,
  PixelScene,
} from "@/components/ui/PixelUI";

export default function Home() {
  const { t } = useI18n();

  return (
    <PixelScene languageToggle>
      <PixelPanel title="GRADIENT SWEEPER">
        <PixelButtonGroup>
          <PixelButton href="/game?mode=endless" size="lg" block leading="▶">
            {t("home.endless")}
          </PixelButton>
          <PixelButton href="/ta" size="lg" block leading="▶">
            {t("home.timeAttack")}
          </PixelButton>
          <PixelButton href="/ranking" size="lg" block leading="▶">
            {t("home.ranking")}
          </PixelButton>
        </PixelButtonGroup>
      </PixelPanel>
    </PixelScene>
  );
}
