"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useI18n } from "@/i18n/useI18n";
import {
  PixelButton,
  PixelButtonGroup,
  PixelPanel,
  PixelScene,
  PixelStats,
} from "@/components/ui/PixelUI";

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

  if (!isOpen) return null;

  // 上からクリアボーナス・パーフェクトボーナス（残り）、最後に累計スコア。
  // ボーナスが無いレベルでは累計スコアだけを出す。
  const stats = [
    ...(totalBonus > 0
      ? [
          { label: t("cleared.bonus"), value: `+${displayClearBonus.toLocaleString()}` },
          ...(isPerfect
            ? [
                {
                  label: t("cleared.perfectBonus"),
                  value: `+${displayPerfectBonus.toLocaleString()}`,
                },
              ]
            : []),
        ]
      : []),
    { label: t("cleared.totalScore"), value: displayScore.toLocaleString(), emphasis: true },
  ];

  return (
    <PixelScene width="menu" overlay label={t("cleared.title")}>
      <PixelPanel title="LEVEL CLEAR" subtitle={t("cleared.title")}>
        <PixelStats items={stats} />
        <PixelButtonGroup>
          <PixelButton onClick={handleNext} size="lg" block leading="▶">
            {t("cleared.next")}
          </PixelButton>
        </PixelButtonGroup>
      </PixelPanel>
    </PixelScene>
  );
}
