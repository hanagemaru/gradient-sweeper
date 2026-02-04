"use client";

import { useI18n } from "@/i18n/useI18n";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/Icon";
import { GameMode } from "@/types/game";

interface ClearedModalProps {
  isOpen: boolean;
  mode: GameMode;
  onNext: () => void;
  onFinish: () => void;
}

export function ClearedModal({
  isOpen,
  mode,
  onNext,
  onFinish,
}: ClearedModalProps) {
  const { t } = useI18n();

  return (
    <Modal isOpen={isOpen} hideClose>
      <div className="flex flex-col items-center gap-6">
        <Icon name="star" size="xl" />
        <h2 className="text-2xl font-bold">{t("cleared.title")}</h2>

        <div className="flex flex-col gap-3 w-full">
          {mode === "endless" ? (
            <Button onClick={onNext} variant="primary" className="w-full">
              {t("cleared.next")}
            </Button>
          ) : (
            <Button onClick={onFinish} variant="primary" className="w-full">
              <Icon name="trophy" />
              {t("result.toRanking")}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
