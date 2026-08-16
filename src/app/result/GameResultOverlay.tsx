"use client";

import { useI18n } from "@/i18n/useI18n";
import { formatTime } from "@/hooks/useTimer";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/Icon";
import { GameMode, Difficulty } from "@/types/game";
import { useResultSubmission } from "./useResultSubmission";

interface StatRowProps {
  label: string;
  value: string | number;
  emphasis?: boolean;
  danger?: boolean;
}

function StatRow({ label, value, emphasis, danger }: StatRowProps) {
  return (
    <div className="flex justify-between items-center w-full">
      <span className="text-sm font-bold text-gray-400">{label}</span>
      <span
        className={
          danger
            ? "text-lg font-mono tabular-nums text-red-400"
            : emphasis
              ? "text-3xl font-bold font-mono tabular-nums text-yellow-400"
              : "text-lg font-mono tabular-nums"
        }
      >
        {value}
      </span>
    </div>
  );
}

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
}

/**
 * リザルトを `/game` の盤面の上に重ねて表示するモーダル。
 *
 * `GameOverModal` / `ClearedModal`（src/components/game/）と同じ `Modal` を
 * 使い、盤面をアンマウントせずに結果を表示する。ページ遷移をやめたことで
 * 見た目もそれらと同じ濃紺HUDトーンに揃えている（CRYSTAL FIELDの氷原背景は
 * 使わない）。送信・スキップのロジックは `useResultSubmission` を
 * `/result` ページと共有している。
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
}: GameResultOverlayProps) {
  const { t } = useI18n();
  const { playerName, setPlayerName, handleSubmit, handleSkip, isNavigating } =
    useResultSubmission({ mode, difficulty, level, misses, revives, score, timeMs, penaltyMs });

  const finalTimeMs = timeMs + penaltyMs;
  const title = mode === "ta" && cleared ? t("cleared.title") : t("result.title");

  return (
    <Modal isOpen={isOpen} hideClose>
      <div className="flex flex-col items-center gap-6">
        <Icon name="trophy" size="xl" />
        <h2 className="text-2xl font-bold">{title}</h2>

        {isNavigating ? (
          <p className="text-gray-400">{t("common.loading")}</p>
        ) : (
          <>
            <div className="w-full space-y-2">
              {mode === "endless" ? (
                <>
                  <StatRow label={t("result.level")} value={level} />
                  <StatRow label={t("result.misses")} value={misses} />
                  <StatRow label={t("result.score")} value={score.toLocaleString()} emphasis />
                </>
              ) : (
                <>
                  {penaltyMs > 0 && (
                    <>
                      <StatRow label={t("result.playTime")} value={formatTime(timeMs)} />
                      <StatRow
                        label={t("result.penalty")}
                        value={`+${formatTime(penaltyMs)}`}
                        danger
                      />
                    </>
                  )}
                  <StatRow label={t("result.finalTime")} value={formatTime(finalTimeMs)} emphasis />
                </>
              )}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full">
              <input
                type="text"
                value={playerName}
                onChange={(event) => setPlayerName(event.target.value)}
                placeholder={t("result.enterName")}
                maxLength={50}
                className="w-full rounded-lg bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <Button type="submit" variant="primary" className="w-full">
                {t("result.submit")}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={handleSkip}>
                {t("result.skip")}
              </Button>
            </form>
          </>
        )}
      </div>
    </Modal>
  );
}
