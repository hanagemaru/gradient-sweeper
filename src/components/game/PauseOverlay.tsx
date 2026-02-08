"use client";

import { useI18n } from "@/i18n/useI18n";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/Icon";

interface PauseOverlayProps {
  onResume: () => void;
  onQuit: () => void;
}

export function PauseOverlay({ onResume, onQuit }: PauseOverlayProps) {
  const { t } = useI18n();

  return (
    <div className="absolute inset-0 bg-gray-900/95 flex flex-col items-center justify-center z-10 gap-4">
      <p className="text-2xl font-bold mb-2">{t("game.paused")}</p>
      
      <div className="flex flex-col gap-3">
        <Button onClick={onResume} variant="primary" size="lg">
          <Icon name="play" />
          {t("game.resume")}
        </Button>
        
        <Button onClick={onQuit} variant="ghost" size="lg">
          {t("game.quit")}
        </Button>
      </div>
    </div>
  );
}
