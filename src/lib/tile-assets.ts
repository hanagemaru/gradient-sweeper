/**
 * tiles-v5 のタイル画像選択ロジック。
 *
 * 盤面の描画（`src/components/game/Cell.tsx`）と、
 * 色マッピングの検証ページ（`src/app/style-lab/color-map/`）の両方から使う。
 * 検証ページが本番と同じ写像を参照するための共有モジュールなので、
 * 片方だけロジックを分岐させないこと。
 */

export type IceTone = "clear" | "red" | "blue" | "mix";

export const ASSET_BASE = "/assets/frostbound/tiles-v5";

/** 覆われた雪タイルの見た目のバリエーション。座標から決定的に選ぶ */
export function getSnowVariant(row: number, col: number): 1 | 2 | 3 {
  return (((row * 7 + col * 3 + row * col) % 3) + 1) as 1 | 2 | 3;
}

export function getIceAsset(
  adjacentRed: number,
  adjacentBlue: number,
  row: number,
  col: number,
  bombType?: "red" | "blue",
): string {
  if (bombType) {
    return `${ASSET_BASE}/ice-${bombType}-4.png`;
  }

  if (adjacentRed === 0 && adjacentBlue === 0) {
    const variant = ((row * 5 + col * 3) % 2) + 1;
    return `${ASSET_BASE}/ice-clear-${variant}.png`;
  }

  let tone: IceTone;
  if (adjacentBlue === 0 || adjacentRed >= adjacentBlue * 2) {
    tone = "red";
  } else if (adjacentRed === 0 || adjacentBlue >= adjacentRed * 2) {
    tone = "blue";
  } else {
    tone = "mix";
  }

  const level = Math.max(1, Math.min(4, adjacentRed + adjacentBlue));
  return `${ASSET_BASE}/ice-${tone}-${level}.png`;
}
