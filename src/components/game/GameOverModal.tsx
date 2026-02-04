"use client";

import { useI18n } from "@/i18n/useI18n";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/Icon";
import { GameMode, MAX_REVIVES_TA } from "@/types/game";

interface GameOverModalProps {
  isOpen: boolean;
  mode: GameMode;
  reviveCount: number;
  onRevive: () => void;
  onGiveUp: () => void;
}

export function GameOverModal({
  isOpen,
  mode,
  reviveCount,
  onRevive,
  onGiveUp,
}: GameOverModalProps) {
  const { t } = useI18n();

  const canRevive = mode === "endless" || reviveCount < MAX_REVIVES_TA;
  const remainingRevives = mode === "ta" ? MAX_REVIVES_TA - reviveCount : null;

  return (
    <Modal isOpen={isOpen} hideClose>
      <div className="flex flex-col items-center gap-6">
        <Icon name="skull" size="xl" />
        <h2 className="text-2xl font-bold">{t("gameOver.title")}</h2>

        {remainingRevives !== null && (
          <p className="text-gray-400">
            {t("gameOver.remaining")}: {remainingRevives}
          </p>
        )}

        <div className="flex flex-col gap-3 w-full">
          {canRevive && (
            <Button onClick={onRevive} variant="primary" className="w-full">
              <Icon name="ad" />
              {t("gameOver.revive")}
            </Button>
          )}
          <Button onClick={onGiveUp} variant="secondary" className="w-full">
            {t("gameOver.giveUp")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
