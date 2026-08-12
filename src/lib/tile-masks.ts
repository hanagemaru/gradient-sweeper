/**
 * 氷タイルの下絵（グレースケールマスク）の選択。
 *
 * `scripts/extract-tile-masks.mjs` が tiles-v5 から抽出したものを使う。
 * 各マスクは「平均が中間グレー」になるよう作られているので、
 * `mix-blend-mode: overlay` で重ねるとタイル全体の明るさを変えずに質感だけが乗る。
 *
 * パレット（src/lib/color-proposal.ts）は明るさで爆弾の合計数を表す設計なので、
 * 下絵側が明るさを動かさないことが前提になる。
 */

export const MASK_BASE = "/assets/frostbound/masks-v1";

/** 下絵の段階。元のタイルが持っていた4段階をそのまま使う */
export type MaskLevel = "clear" | 1 | 2 | 3 | 4;

/**
 * 隣接する爆弾の合計数から下絵を選ぶ。
 *
 * 下絵は4段階しかないので、合計8段階を2つずつまとめる。
 * 下絵は「だいたいの密度」だけを担い、正確な内訳は色が担う。
 */
export function maskLevelForTotal(total: number): MaskLevel {
  if (total <= 0) return "clear";
  return Math.min(4, Math.ceil(total / 2)) as 1 | 2 | 3 | 4;
}

export function maskAsset(level: MaskLevel): string {
  return `${MASK_BASE}/canonical-${level}.png`;
}

export function maskAssetForTotal(total: number): string {
  return maskAsset(maskLevelForTotal(total));
}
