"use client";

import { useState, useEffect, useRef } from "react";

/**
 * マイルストーン閾値の設定
 * 将来的にアセットやテーマ切り替え可能な構造
 */
const MILESTONES = [
  { threshold: 10000000, label: "10,000,000!" },
  { threshold: 5000000, label: "5,000,000!" },
  { threshold: 1000000, label: "1,000,000!" },
  { threshold: 500000, label: "500,000!" },
  { threshold: 100000, label: "100,000!" },
];

interface MilestoneEffectProps {
  score: number;
  /** カスタムレンダリング用（画像アセット差し替え対応） */
  renderMilestone?: (label: string) => React.ReactNode;
}

/**
 * マイルストーン演出コンポーネント
 * スコアが閾値を超えた時に画面全体にフラッシュ + テキスト演出
 */
export function MilestoneEffect({ score, renderMilestone }: MilestoneEffectProps) {
  const [activeMilestone, setActiveMilestone] = useState<string | null>(null);
  const passedMilestonesRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    for (const milestone of MILESTONES) {
      if (
        score >= milestone.threshold &&
        !passedMilestonesRef.current.has(milestone.threshold)
      ) {
        passedMilestonesRef.current.add(milestone.threshold);
        setActiveMilestone(milestone.label);

        // 演出表示後に自動消去
        const timeoutId = setTimeout(() => {
          setActiveMilestone(null);
        }, 2000);

        return () => clearTimeout(timeoutId);
      }
    }
  }, [score]);

  if (!activeMilestone) return null;

  if (renderMilestone) {
    return <>{renderMilestone(activeMilestone)}</>;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center milestone-flash">
      <div className="text-4xl font-black text-yellow-400 milestone-scale-up drop-shadow-lg">
        {activeMilestone}
      </div>
    </div>
  );
}
