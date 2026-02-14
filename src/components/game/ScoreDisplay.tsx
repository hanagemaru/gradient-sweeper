"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * スコア色のしきい値設定
 * 将来的に画像アセットやテーマに差し替え可能な構造
 */
const SCORE_COLOR_THRESHOLDS = [
  { min: 500000, className: "text-amber-300 score-glow" },
  { min: 100000, className: "text-yellow-400" },
  { min: 0, className: "text-foreground" },
];

function getScoreColorClass(score: number): string {
  for (const threshold of SCORE_COLOR_THRESHOLDS) {
    if (score >= threshold.min) {
      return threshold.className;
    }
  }
  return "text-foreground";
}

interface ScoreDisplayProps {
  score: number;
  /** カスタムレンダリング用（画像アセット差し替え対応） */
  renderScore?: (displayValue: number, colorClass: string) => React.ReactNode;
}

/**
 * リアルタイムスコア表示コンポーネント
 * - カウントアップアニメーション付き
 * - スコア規模に応じた色変化
 * - 将来の画像アセット差し替えに対応した props 設計
 */
export function ScoreDisplay({ score, renderScore }: ScoreDisplayProps) {
  const [displayValue, setDisplayValue] = useState(score);
  const animationRef = useRef<number | null>(null);
  const startValueRef = useRef(score);
  const startTimeRef = useRef(0);

  // アニメーションduration を差分に応じて可変にする
  const getDuration = useCallback((diff: number): number => {
    const absDiff = Math.abs(diff);
    if (absDiff > 10000) return 600;
    if (absDiff > 1000) return 400;
    return 200;
  }, []);

  useEffect(() => {
    if (score === displayValue) return;

    // 進行中のアニメーションをキャンセル
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const startVal = displayValue;
    startValueRef.current = startVal;
    const diff = score - startVal;
    const duration = getDuration(diff);

    startTimeRef.current = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // easeOutQuad でスムーズに
      const eased = 1 - (1 - progress) * (1 - progress);
      const currentValue = Math.round(startValueRef.current + diff * eased);

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        animationRef.current = null;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score, getDuration]);

  const colorClass = getScoreColorClass(displayValue);

  if (renderScore) {
    return <>{renderScore(displayValue, colorClass)}</>;
  }

  return (
    <div className={`text-xl font-bold font-mono tabular-nums ${colorClass} transition-colors duration-300`}>
      {displayValue.toLocaleString()}
    </div>
  );
}
