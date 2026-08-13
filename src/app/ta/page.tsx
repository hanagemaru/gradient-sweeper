"use client";

import { useI18n } from "@/i18n/useI18n";
import { BOMB_COUNTS, Difficulty } from "@/types/game";
import {
  PixelButton,
  PixelButtonGroup,
  PixelPanel,
  PixelScene,
} from "@/components/ui/PixelUI";

const DIFFICULTIES: Difficulty[] = ["easy", "mid", "hard"];

export default function TimeAttackPage() {
  const { t } = useI18n();

  return (
    <PixelScene width="menu">
      <PixelPanel title="TIME ATTACK" subtitle={t("ta.title")}>
        <PixelButtonGroup>
          {DIFFICULTIES.map((key) => (
            <PixelButton
              key={key}
              href={`/game?mode=ta&difficulty=${key}`}
              size="lg"
              block
              leading="▶"
              trailing={`${t("ta.bombs")} ${BOMB_COUNTS[key]}`}
            >
              {t(`ta.${key}` as const)}
            </PixelButton>
          ))}
          <PixelButton href="/" variant="ghost" block leading="◀">
            {t("ta.back")}
          </PixelButton>
        </PixelButtonGroup>
      </PixelPanel>
    </PixelScene>
  );
}
