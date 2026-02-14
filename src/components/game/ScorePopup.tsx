"use client";

import { ScorePopupItem } from "@/hooks/useScorePopup";

interface ScorePopupProps {
  popups: ScorePopupItem[];
  /** カスタムレンダリング用（画像アセット差し替え対応） */
  renderItem?: (item: ScorePopupItem) => React.ReactNode;
}

/**
 * スコアポップアップコンポーネント
 * 盤面上にオーバーレイ表示されるフローティングテキスト
 * - 正の値: 緑系
 * - 負の値: 赤系
 * - CSS keyframes: float-up + fade-out（約1秒）
 * - 将来の画像アセット差し替えに対応した renderItem props
 */
export function ScorePopup({ popups, renderItem }: ScorePopupProps) {
  if (popups.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {popups.map((popup) => {
        if (renderItem) {
          return <div key={popup.id}>{renderItem(popup)}</div>;
        }

        // ラベル付き（コンボ表示）
        if (popup.label) {
          return (
            <div
              key={popup.id}
              className="absolute score-float-up font-bold text-xl text-amber-300 drop-shadow-lg"
              style={{
                left: `${popup.x}%`,
                top: `${popup.y}%`,
                transform: "translateX(-50%)",
              }}
            >
              {popup.label}
            </div>
          );
        }

        // 数値表示（マイナススコア等）
        const isPositive = popup.value >= 0;
        const colorClass = isPositive ? "text-emerald-400" : "text-red-400";
        const text = isPositive
          ? `+${popup.value.toLocaleString()}`
          : popup.value.toLocaleString();

        return (
          <div
            key={popup.id}
            className={`absolute score-float-up font-bold text-lg ${colorClass} drop-shadow-lg`}
            style={{
              left: `${popup.x}%`,
              top: `${popup.y}%`,
              transform: "translateX(-50%)",
            }}
          >
            {text}
          </div>
        );
      })}
    </div>
  );
}
