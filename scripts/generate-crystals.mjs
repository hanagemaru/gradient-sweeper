/**
 * CRYSTAL FIELD 案の背景装飾用クリスタル部品を生成する。
 *
 *   node scripts/generate-crystals.mjs
 *
 * ## セルモチーフとの違い
 *
 * `generate-motif-masks.mjs` はグレースケールのマスクを出し、色は
 * `mix-blend-mode: overlay` でコード側から動的に塗る（盤面の色が動的だから）。
 *
 * クリスタルは色を動的に変える必要がない一回限りの装飾なので、
 * ここでは色を焼き込んだ RGBA スプライトとして出す。
 * `public/assets/frostbound/tiles-v5/flag-overlay.png` などの既存アセットと同じ扱い。
 *
 * ## なぜ CSS の clip-path で描かなかったか
 *
 * クリスタルは斜めの面を複数持ち、面ごとに階調が違う。
 * clip-path で斜め線を引くとブラウザがアンチエイリアスをかけて輪郭がぼやけ、
 * ピクセルアートの硬い輪郭が失われる。
 *
 * ここでは各面をポリゴンとして持ち、ピクセル中心が面の内側かどうかを
 * 判定して塗るので、輪郭は完全にハードな1pxのまま出せる
 * （アンチエイリアシングが原理的に起こらない）。
 *
 * ## 形の作り方
 *
 * 各クリスタルは「面（facet）」の配列。面は多角形の頂点リストと明度係数を持つ。
 * 配列の後ろの面ほど前面に描かれる（重なりがあれば上書きする）。
 * 輪郭（シルエット）の外周は、左上が明るく右下が暗くなるよう1px縁取りする。
 * 面と面の継ぎ目にも1pxの筋を入れて、ファセットの折れ目に見せる。
 */

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const OUTPUT_DIR = "public/assets/frostbound/crystals-v1";

/** 点が多角形の内側かどうか（レイキャスティング法） */
function pointInPolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    const intersects =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function facetIndexAt(facets, x, y) {
  let found = -1;
  for (let i = 0; i < facets.length; i += 1) {
    if (pointInPolygon(x + 0.5, y + 0.5, facets[i].points)) found = i;
  }
  return found;
}

function shade([r, g, b], factor) {
  return [
    Math.round(Math.min(255, r * factor)),
    Math.round(Math.min(255, g * factor)),
    Math.round(Math.min(255, b * factor)),
  ];
}

function buildCrystal({ width, height, color, facets }) {
  const rgba = Buffer.alloc(width * height * 4);
  const facetAt = (x, y) =>
    x < 0 || y < 0 || x >= width || y >= height ? -1 : facetIndexAt(facets, x, y);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const fi = facetAt(x, y);
      if (fi < 0) continue;

      const i = (y * width + x) * 4;
      let [r, g, b] = shade(color, facets[fi].tone);

      const outUp = facetAt(x, y - 1) < 0;
      const outLeft = facetAt(x - 1, y) < 0;
      const outDown = facetAt(x, y + 1) < 0;
      const outRight = facetAt(x + 1, y) < 0;
      const seamUp = facetAt(x, y - 1) !== fi && !outUp;
      const seamLeft = facetAt(x - 1, y) !== fi && !outLeft;
      const seamDown = facetAt(x, y + 1) !== fi && !outDown;
      const seamRight = facetAt(x + 1, y) !== fi && !outRight;

      if (outUp || outLeft) {
        [r, g, b] = shade(color, facets[fi].tone * 1.35);
      } else if (outDown || outRight) {
        [r, g, b] = shade(color, facets[fi].tone * 0.55);
      } else if (seamUp || seamLeft || seamDown || seamRight) {
        [r, g, b] = shade(color, facets[fi].tone * 0.82);
      }

      rgba[i] = r;
      rgba[i + 1] = g;
      rgba[i + 2] = b;
      rgba[i + 3] = 255;
    }
  }

  return { rgba, width, height };
}

const BLUE = [125, 199, 240];
const ICE = [222, 241, 252];
const PURPLE = [170, 133, 224];
const RED = [227, 108, 100];

/**
 * 7種類の形状。色ではなく**シルエットで**区別すること。
 * 参考画像の指示（柱状・板状・針状・斜めの薄片・低い塊・三角錐・多面体）に対応させている。
 */
const CRYSTALS = [
  {
    // 柱状（尖った六角柱）
    name: "prism-blue",
    width: 40,
    height: 96,
    color: BLUE,
    facets: [
      { points: [[18, 0], [6, 18], [6, 78], [18, 96]], tone: 0.95 },
      { points: [[18, 0], [18, 96], [30, 78], [30, 18]], tone: 0.68 },
      { points: [[18, 0], [12, 10], [18, 22], [24, 10]], tone: 1.15 },
    ],
  },
  {
    // 板状（薄く平たい菱形）
    name: "plate-purple",
    width: 78,
    height: 34,
    color: PURPLE,
    facets: [
      { points: [[0, 20], [22, 4], [78, 12], [56, 28]], tone: 0.95 },
      { points: [[0, 20], [56, 28], [40, 34], [10, 28]], tone: 0.6 },
    ],
  },
  {
    // 針状（細長い単体の尖り）
    name: "needle-ice",
    width: 16,
    height: 84,
    color: ICE,
    facets: [
      { points: [[8, 0], [2, 20], [2, 84], [8, 78]], tone: 0.98 },
      { points: [[8, 0], [8, 78], [14, 84], [14, 20]], tone: 0.66 },
    ],
  },
  {
    // 斜めの薄片（傾いた細長い破片）
    name: "shard-diagonal",
    width: 66,
    height: 40,
    color: BLUE,
    facets: [
      { points: [[0, 30], [22, 4], [30, 8], [8, 34]], tone: 1.05 },
      { points: [[22, 4], [58, 0], [66, 10], [30, 8]], tone: 0.9 },
      { points: [[30, 8], [66, 10], [44, 40], [8, 34]], tone: 0.62 },
    ],
  },
  {
    // 低い塊（横に広い多面体）
    name: "chunk-white",
    width: 76,
    height: 48,
    color: ICE,
    facets: [
      { points: [[0, 24], [16, 6], [50, 4], [64, 16], [40, 20]], tone: 1.1 },
      { points: [[0, 24], [40, 20], [34, 48], [8, 44]], tone: 0.72 },
      { points: [[40, 20], [64, 16], [76, 30], [58, 48], [34, 48]], tone: 0.5 },
    ],
  },
  {
    // 三角錐（大きな凧形の結晶）
    name: "pyramid-blue",
    width: 72,
    height: 64,
    color: BLUE,
    facets: [
      { points: [[36, 0], [4, 34], [36, 64]], tone: 1.0 },
      { points: [[36, 0], [36, 64], [68, 34]], tone: 0.6 },
    ],
  },
  {
    // 小粒アクセント（角の丸い立方体状）
    name: "accent-cube-red",
    width: 26,
    height: 26,
    color: RED,
    facets: [
      { points: [[2, 8], [12, 2], [24, 8], [24, 20], [12, 24], [2, 20]], tone: 0.95 },
      { points: [[2, 8], [12, 12], [12, 24], [2, 20]], tone: 0.72 },
      { points: [[24, 8], [12, 12], [12, 24], [24, 20]], tone: 0.55 },
    ],
  },
];

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  for (const crystal of CRYSTALS) {
    const { rgba, width, height } = buildCrystal(crystal);

    await sharp(rgba, { raw: { width, height, channels: 4 } })
      .png({ compressionLevel: 9 })
      .toFile(path.join(OUTPUT_DIR, `${crystal.name}.png`));

    console.log(`  ${crystal.name.padEnd(20)} ${width}x${height}`);
  }

  console.log(`\n${CRYSTALS.length}枚を ${OUTPUT_DIR} に生成しました`);
}

main();
