"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useI18n } from "@/i18n/useI18n";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/Icon";

/** アニメーションのフェーズ */
type AnimPhase = "idle" | "clear" | "perfect" | "done";

const ANIM_DURATION_MS = 1000; // 各フェーズのカウント時間
const ANIM_DELAY_MS = 400;    // フェーズ間の間

/** easeOutQuad */
function ease(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

interface ClearedModalProps {
  isOpen: boolean;
  onNext: () => void;
  /** ボーナス加算前の現在スコア */
  currentScore: number;
  /** レベルクリアボーナススコア */
  bonusScore?: number;
  /** パーフェクトボーナススコア（ミスなしクリア時） */
  perfectBonus?: number;
}

export function ClearedModal({
  isOpen,
  onNext,
  currentScore,
  bonusScore = 0,
  perfectBonus = 0,
}: ClearedModalProps) {
  const { t } = useI18n();

  const isPerfect = perfectBonus > 0;
  const totalBonus = bonusScore + perfectBonus;

  // 表示用: 累計スコア / クリアボーナス残り / パーフェクトボーナス残り
  const [phase, setPhase] = useState<AnimPhase>("idle");
  const [displayScore, setDisplayScore] = useState(currentScore);
  const [displayClearBonus, setDisplayClearBonus] = useState(0);
  const [displayPerfectBonus, setDisplayPerfectBonus] = useState(0);

  const animRef = useRef<number | null>(null);

  const cancelAnim = useCallback(() => {
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
  }, []);

  // モーダルが開いたら初期状態セット
  useEffect(() => {
    if (!isOpen) {
      setPhase("idle");
      setDisplayScore(currentScore);
      setDisplayClearBonus(0);
      setDisplayPerfectBonus(0);
      cancelAnim();
      return;
    }

    setDisplayScore(currentScore);
    setDisplayClearBonus(bonusScore);
    setDisplayPerfectBonus(perfectBonus);
    setPhase("clear");

    return cancelAnim;
  }, [isOpen, currentScore, bonusScore, perfectBonus, cancelAnim]);

  // フェーズごとのカウントアニメーション
  useEffect(() => {
    if (phase === "idle" || phase === "done") return;

    let startScore: number;
    let endScore: number;

    if (phase === "clear") {
      startScore = currentScore;
      endScore = currentScore + bonusScore;
    } else {
      startScore = currentScore + bonusScore;
      endScore = currentScore + bonusScore + perfectBonus;
    }

    const startBonus = phase === "clear" ? bonusScore : perfectBonus;

    const delayTimeout = setTimeout(() => {
      const startTime = performance.now();

      const tick = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / ANIM_DURATION_MS, 1);
        const eased = ease(progress);

        setDisplayScore(Math.round(startScore + (endScore - startScore) * eased));
        const remainingBonus = Math.round(startBonus * (1 - eased));

        if (phase === "clear") {
          setDisplayClearBonus(remainingBonus);
        } else {
          setDisplayPerfectBonus(remainingBonus);
        }

        if (progress < 1) {
          animRef.current = requestAnimationFrame(tick);
        } else {
          animRef.current = null;
          if (phase === "clear" && isPerfect) {
            setPhase("perfect");
          } else {
            setPhase("done");
          }
        }
      };

      animRef.current = requestAnimationFrame(tick);
    }, ANIM_DELAY_MS);

    return () => {
      clearTimeout(delayTimeout);
      cancelAnim();
    };
  }, [phase, currentScore, bonusScore, perfectBonus, isPerfect, cancelAnim]);

  const handleNext = useCallback(() => {
    cancelAnim();
    onNext();
  }, [cancelAnim, onNext]);

  return (
    <Modal isOpen={isOpen} hideClose>
      <div className="flex flex-col items-center gap-5">
        <Icon name="star" size="xl" />
        <h2 className="text-2xl font-bold">{t("cleared.title")}</h2>

        {/* 上: クリアボーナス・パーフェクトボーナス（常時表示）、下: 累計スコア */}
        {totalBonus > 0 && (
          <div className="w-full space-y-2 text-center">
            {/* クリアボーナス行（常に表示） */}
            <div className="flex justify-between items-center text-gray-400">
              <span className="text-sm font-bold">{t("cleared.bonus")}</span>
              <span className="text-lg font-mono tabular-nums text-yellow-400">
                +{displayClearBonus.toLocaleString()}
              </span>
            </div>
            {/* パーフェクトボーナス行（パーフェクト時のみ） */}
            {isPerfect && (
              <div className="flex justify-between items-center text-amber-400">
                <span className="text-sm font-bold">{t("cleared.perfectBonus")}</span>
                <span className="text-lg font-mono tabular-nums text-amber-300">
                  +{displayPerfectBonus.toLocaleString()}
                </span>
              </div>
            )}
            <div className="border-t border-gray-600 my-2" />
            {/* 累計スコア */}
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-gray-400">{t("cleared.totalScore")}</span>
              <span className="text-3xl font-bold font-mono tabular-nums text-yellow-400">
                {displayScore.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {totalBonus === 0 && (
          <div className="text-3xl font-bold font-mono tabular-nums text-yellow-400">
            {displayScore.toLocaleString()}
          </div>
        )}

        <Button onClick={handleNext} variant="primary" className="w-full">
          {t("cleared.next")}
        </Button>
      </div>
    </Modal>
  );
}
