/**
 * 既存の氷タイルから「下絵」をグレースケールのマスクとして抽出する。
 *
 * tiles-v5 の氷タイル14枚は、実質「濃さ(level)ごとの下絵 × 色相」でできている。
 * （level 4 の red / blue / mix は明度パターンが 95〜99% 一致する）
 *
 * 45状態それぞれに色を割り当てるには、色数ぶんのPNGを描くのではなく
 * 下絵をマスクとして持ち、色はコード側で塗るのが現実的。
 * このスクリプトはその下絵を切り出す。
 *
 *   node scripts/extract-tile-masks.mjs
 *
 * 明度の取り出しには OKLab の L を使う。
 * sRGB の輝度（0.299R + 0.587G + 0.114B）は青を極端に暗く見積もるため、
 * 青系タイルの下絵だけが不当に暗く出てしまう。
 */

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SOURCE_DIR = "public/assets/frostbound/tiles-v5";
const OUTPUT_DIR = "public/assets/frostbound/masks-v1";

/**
 * 下絵の凹凸をどれだけ強く残すか。
 * 元タイルの明度の振れ幅は L で 0.2 前後しかないので、そのままでは質感がほぼ出ない。
 * 2.5 倍すると元のタイルに近い見え方になる。
 */
const DETAIL_GAIN = 2.5;

/** 抽出対象。level ごとに1枚あれば足りるが、比較できるよう全色相ぶん出す */
const SOURCES = [
  "ice-clear-1",
  "ice-clear-2",
  "ice-red-1",
  "ice-red-2",
  "ice-red-3",
  "ice-red-4",
  "ice-blue-1",
  "ice-blue-2",
  "ice-blue-3",
  "ice-blue-4",
  "ice-mix-1",
  "ice-mix-2",
  "ice-mix-3",
  "ice-mix-4",
];

/**
 * 本番で使う下絵。
 * level ごとに、色相の偏りが最も少ない mix 系を代表に選ぶ。
 * mix-1 と mix-3 は現行ロジックでは一度も描画されないが、絵としては存在する。
 */
const CANONICAL = {
  clear: "ice-clear-1",
  1: "ice-mix-1",
  2: "ice-mix-2",
  3: "ice-mix-3",
  4: "ice-mix-4",
};

function srgbToLinear(channel) {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** sRGB -> OKLab の L のみ */
function oklabLightness(r, g, b) {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);

  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

  return 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
}

async function extract(name) {
  const { data, info } = await sharp(path.join(SOURCE_DIR, `${name}.png`))
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = info.width * info.height;
  const gray = Buffer.alloc(pixels * 2); // グレースケール + アルファ

  const lightness = new Float64Array(pixels);
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;
  let opaque = 0;

  for (let i = 0; i < pixels; i += 1) {
    const o = i * info.channels;
    const alpha = info.channels === 4 ? data[o + 3] : 255;
    const L = oklabLightness(data[o], data[o + 1], data[o + 2]);
    lightness[i] = L;
    if (alpha > 8) {
      if (L < min) min = L;
      if (L > max) max = L;
      sum += L;
      opaque += 1;
    }
  }

  const mean = opaque > 0 ? sum / opaque : 0.5;

  // 平均を中間グレー(128)に合わせた「差分」として書き出す。
  //
  // 0..255 に単純に引き伸ばすと、overlay で合成したときにタイル全体の明るさが
  // 下絵側の平均に引っ張られてしまう。パレットは「明るさ = 爆弾の合計数」を
  // 表す設計なので、そこがずれると設計そのものが壊れる。
  // 平均を中間グレーに置けば overlay は明るさを変えず、質感だけを乗せる。
  for (let i = 0; i < pixels; i += 1) {
    const o = i * info.channels;
    const alpha = info.channels === 4 ? data[o + 3] : 255;
    const detail = (lightness[i] - mean) * DETAIL_GAIN;
    gray[i * 2] = Math.round(Math.min(255, Math.max(0, 128 + detail * 255)));
    gray[i * 2 + 1] = alpha;
  }

  await sharp(gray, {
    raw: { width: info.width, height: info.height, channels: 2 },
  })
    .png({ compressionLevel: 9, palette: false })
    .toFile(path.join(OUTPUT_DIR, `${name.replace(/^ice-/, "")}.png`));

  return { name, width: info.width, height: info.height, min, max };
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const results = [];
  for (const name of SOURCES) {
    results.push(await extract(name));
  }

  // 本番で使う下絵を canonical-*.png としてコピーする。
  // Cell の描画はこの5枚だけを参照すればよくなる。
  for (const [level, source] of Object.entries(CANONICAL)) {
    const from = path.join(OUTPUT_DIR, `${source.replace(/^ice-/, "")}.png`);
    await fs.copyFile(from, path.join(OUTPUT_DIR, `canonical-${level}.png`));
  }

  console.log(`抽出したマスク: ${results.length}枚 -> ${OUTPUT_DIR}`);
  for (const r of results) {
    console.log(`  ${r.name}  ${r.width}x${r.height}  L範囲 ${r.min.toFixed(3)}..${r.max.toFixed(3)}`);
  }
  console.log(`\n本番用の下絵: canonical-{clear,1,2,3,4}.png`);
}

main();
