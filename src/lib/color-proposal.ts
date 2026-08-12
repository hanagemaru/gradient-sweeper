/**
 * 色マッピングの再設計案。
 *
 * 現行の `getIceAsset()`（src/lib/tile-assets.ts）は 45 通りの隣接状態を
 * 11 種類のタイルにしか分けられていない。この案は
 * **45 状態すべてに異なる色を与える**ことを最優先に置く。
 *
 * まだ盤面には適用していない。検証ページ `/style-lab/color-map/proposal` の
 * 表示専用で、採用が決まってから Cell の描画に繋ぐ。
 *
 * ## 設計
 *
 * 2 つの独立した量（赤の数・青の数）を、直交する 2 つの知覚軸に載せる。
 *
 * - **色相 = 赤青の比率**  純青 → 紫 → 純赤 の弧。比率が同じなら合計数が変わっても色相は同じ
 * - **明度と彩度 = 合計数**  合計が増えるほど暗く・鮮やかになる（＝爆弾が濃い）
 *
 * 「暗さで危険度、色味で内訳」という読み方になり、2 つの数字を別々に読み取れる。
 *
 * 計算は OKLCH で行う。HSL と違い、色相を変えても明るさの見え方が変わらないため、
 * 「同じ合計数の色は同じ暗さに見える」ことが保証できる。
 */

/** 隣接セルの最大数（9x9 盤面の 1 セル） */
export const MAX_ADJACENT = 8;

/**
 * 純青側の色相（度）。
 *
 * 当初の 252° は sRGB の色域に収まらず、彩度が要求値の 68% まで削られていた。
 * 赤側は 92% 前後だったため、青だけがくすんで見えていた。
 *
 * 青端・赤端・最大の暗さの組み合わせを総当たりし、
 * 「弧全体で同じ彩度を出せること」を満たしたうえで
 * 隣り合う色の差が最大になる点として 262°〜30°（弧128°）を選んでいる。
 */
const HUE_BLUE = 262;
/** 純青から純赤までの弧の長さ（度）。紫を経由する向きに進む */
const HUE_ARC = 128;

/** 合計 1 個のときの明度・彩度 */
const L_MIN_BOMBS = 0.9;
const C_MIN_BOMBS = 0.055;
/** 合計 8 個のときの明度・彩度 */
const L_MAX_BOMBS = 0.5;
const C_MAX_BOMBS = 0.21;

/** 隣接 0（安全）のタイル */
const L_CLEAR = 0.965;
const C_CLEAR = 0.012;
const H_CLEAR = 230;

export interface ProposedColor {
  red: number;
  blue: number;
  hex: string;
  /** OKLab 座標。知覚距離の計算に使う */
  lab: [number, number, number];
  lightness: number;
  chroma: number;
  hue: number;
}

function srgbGamma(channel: number): number {
  return channel <= 0.0031308
    ? 12.92 * channel
    : 1.055 * Math.pow(channel, 1 / 2.4) - 0.055;
}

/** OKLab -> linear sRGB */
function oklabToLinearSrgb(L: number, a: number, b: number): [number, number, number] {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;

  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

function inGamut([r, g, b]: [number, number, number]): boolean {
  const limit = -0.0001;
  return r >= limit && g >= limit && b >= limit && r <= 1.0001 && g <= 1.0001 && b <= 1.0001;
}

function toHex(linear: [number, number, number]): string {
  return (
    "#" +
    linear
      .map((channel) => {
        const value = Math.round(Math.min(1, Math.max(0, srgbGamma(channel))) * 255);
        return value.toString(16).padStart(2, "0");
      })
      .join("")
  );
}

/** 指定した明度・色相で sRGB に収まる最大の彩度を二分探索で求める */
function maxChroma(lightness: number, hueDeg: number): number {
  const rad = (hueDeg * Math.PI) / 180;

  let low = 0;
  let high = 0.45;
  let fitted = 0;

  for (let i = 0; i < 26; i += 1) {
    const mid = (low + high) / 2;
    if (inGamut(oklabToLinearSrgb(lightness, mid * Math.cos(rad), mid * Math.sin(rad)))) {
      fitted = mid;
      low = mid;
    } else {
      high = mid;
    }
  }

  return fitted;
}

/** 明度ごとの走査結果。合計数は9通りしかないので都度計算せず覚えておく */
const arcChromaCache = new Map<number, number>();

/**
 * その明度において、色相の弧のどこでも出せる彩度の上限。
 *
 * 色相ごとに出せる最大彩度は違うので、そのまま要求値を渡すと
 * 出せない色相だけが削られて「青だけくすむ」ことになる。
 * 弧全体の最小値に合わせれば、同じ合計数の色はすべて同じ彩度になる。
 */
function chromaCeilingForArc(lightness: number): number {
  const cached = arcChromaCache.get(lightness);
  if (cached !== undefined) return cached;

  let ceiling = Infinity;
  const samples = 48;

  for (let i = 0; i <= samples; i += 1) {
    const hue = (HUE_BLUE + (HUE_ARC * i) / samples) % 360;
    ceiling = Math.min(ceiling, maxChroma(lightness, hue));
  }

  arcChromaCache.set(lightness, ceiling);
  return ceiling;
}

/** OKLCH を sRGB に変換する。彩度は呼び出し側で色域内に収めておくこと */
function oklchToSrgb(
  lightness: number,
  chroma: number,
  hueDeg: number,
): { hex: string; lab: [number, number, number] } {
  const rad = (hueDeg * Math.PI) / 180;
  const a = chroma * Math.cos(rad);
  const b = chroma * Math.sin(rad);

  return {
    hex: toHex(oklabToLinearSrgb(lightness, a, b)),
    lab: [lightness, a, b],
  };
}

/**
 * 隣接する赤・青の数から提案色を求める。
 *
 * 同じ (red, blue) は常に同じ色になり、異なる (red, blue) は必ず異なる色になる。
 */
export function proposedColor(red: number, blue: number): ProposedColor {
  const total = red + blue;

  if (total === 0) {
    const { hex, lab } = oklchToSrgb(L_CLEAR, C_CLEAR, H_CLEAR);
    return { red, blue, hex, lab, lightness: L_CLEAR, chroma: C_CLEAR, hue: H_CLEAR };
  }

  // 比率 0 = 純青、1 = 純赤
  const ratio = red / total;
  const hue = (HUE_BLUE + ratio * HUE_ARC) % 360;

  // 合計数を 0..1 に正規化して明度・彩度に反映する
  const density = (total - 1) / (MAX_ADJACENT - 1);
  const lightness = L_MIN_BOMBS + density * (L_MAX_BOMBS - L_MIN_BOMBS);
  const requestedChroma = C_MIN_BOMBS + density * (C_MAX_BOMBS - C_MIN_BOMBS);

  // 弧のどこでも出せる値に切り詰める。
  // 色相ごとに削れ方が違うと、同じ合計数なのに青だけくすむ。
  const chroma = Math.min(requestedChroma, chromaCeilingForArc(lightness));

  const { hex, lab } = oklchToSrgb(lightness, chroma, hue);

  return { red, blue, hex, lab, lightness, chroma, hue };
}

/** 9x9 盤面で起こりうる全 45 状態 */
export function allProposedColors(): ProposedColor[] {
  const colors: ProposedColor[] = [];

  for (let red = 0; red <= MAX_ADJACENT; red += 1) {
    for (let blue = 0; blue <= MAX_ADJACENT - red; blue += 1) {
      colors.push(proposedColor(red, blue));
    }
  }

  return colors;
}

/**
 * OKLab 上のユークリッド距離。
 * 人間の知覚差にほぼ比例するので、この値が小さいペアが「見分けづらい組み合わせ」になる。
 * 経験的に 0.02 前後が識別限界、0.05 を下回ると小さな面積では厳しい。
 */
export function deltaE(a: ProposedColor, b: ProposedColor): number {
  return Math.hypot(a.lab[0] - b.lab[0], a.lab[1] - b.lab[1], a.lab[2] - b.lab[2]);
}

export interface ColorPair {
  a: ProposedColor;
  b: ProposedColor;
  distance: number;
  /** 隣接数が 1 だけ違う組み合わせか。盤面で混同すると実害が大きい */
  adjacent: boolean;
}

/** 全ペアの知覚距離を近い順に返す */
export function rankedPairs(colors: ProposedColor[]): ColorPair[] {
  const pairs: ColorPair[] = [];

  for (let i = 0; i < colors.length; i += 1) {
    for (let j = i + 1; j < colors.length; j += 1) {
      const a = colors[i];
      const b = colors[j];
      pairs.push({
        a,
        b,
        distance: deltaE(a, b),
        adjacent: Math.abs(a.red - b.red) <= 1 && Math.abs(a.blue - b.blue) <= 1,
      });
    }
  }

  return pairs.sort((x, y) => x.distance - y.distance);
}
