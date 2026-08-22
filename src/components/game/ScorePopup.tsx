"use client";

import { ScorePopupItem } from "@/hooks/useScorePopup";

interface ScorePopupProps {
  popups: ScorePopupItem[];
  /** カスタムレンダリング用（画像アセット差し替え対応） */
  renderItem?: (item: ScorePopupItem) => React.ReactNode;
}

/**
 * 盤面の上に浮かぶ数値・ラベルの共通スタイル。
 * 色以外（位置・フォント・落ち影）はここに集約する。フォントは `.scene` の
 * ドット絵フォントを使い、合成ボールドは掛けない（ドット絵が潰れるため）。
 */
const POSITION = (popup: ScorePopupItem) => ({
  left: `${popup.x}%`,
  top: `${popup.y}%`,
  transform: "translateX(-50%)",
  fontFamily: "var(--block-font)",
  textShadow: "2px 2px 0 rgba(4, 15, 32, 0.6)",
});

/**
 * スコアポップアップコンポーネント
 * 盤面上にオーバーレイ表示されるフローティングテキスト
 * - 正の値・コンボラベル: 氷河テーマの水色 / 琥珀
 * - 負の値: 桃（pixel-ui の .danger と同じ色）
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
              className="absolute score-float-up text-xl"
              style={{
                ...POSITION(popup),
                color: "var(--amber)",
              }}
            >
              {popup.label}
            </div>
          );
        }

        // 数値表示（マイナススコア等）
        const isPositive = popup.value >= 0;
        const text = isPositive
          ? `+${popup.value.toLocaleString()}`
          : popup.value.toLocaleString();

        return (
          <div
            key={popup.id}
            className="absolute score-float-up text-lg"
            style={{
              ...POSITION(popup),
              color: isPositive ? "var(--cyan)" : "#ff9aaa",
            }}
          >
            {text}
          </div>
        );
      })}
    </div>
  );
}
