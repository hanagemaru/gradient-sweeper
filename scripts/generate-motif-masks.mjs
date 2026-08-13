/**
 * 背景装飾用の「セルモチーフ」マスクを生成する。
 *
 * 盤面のタイル（36x36）と同じ絵の文法で、任意の大きさの図形を作る。
 *
 *   node scripts/generate-motif-masks.mjs
 *
 * ## なぜ拡大ではなく生成なのか
 *
 * 既存の36pxタイルを5倍に拡大すると、形は同じでも
 * 1ドットが5px角になり、盤面よりザラつきが5倍粗くなる。
 * 画面上で「1ドットの大きさ」が場所によって違うと、ピクセルアートは破綻する。
 *
 * このUIの1ドットは 1 CSS px。だから大きいモチーフは
 * 「拡大」ではなく「同じドットサイズで大きく描く」必要がある。
 *
 * ## 盤面タイルから読み取った文法
 *
 * tiles-v5 の氷タイルを明度で見ると、こういう構造になっている。
 *
 *   ..+--@@@@@@@@@@@@@@@@@@@@@@@@@@+--..
 *   ..--@-oooooooooooooooooooooooo-@--..
 *   ..-@-o--------------++--------o-@-..
 *   ..@-o--------------+-----------o-@..
 *   ..@o----------------------------o@..
 *
 * - 角は45°の階段で面取りされている（36pxに対して4pxなので丸く見える）
 * - 縁は 1px のハイライト線、その内側に 1px の中間調
 * - 表面にまばらな明るい粒
 *
 * **縁の線の太さは図形の大きさに関係なく 1px で固定**。ここが肝心で、
 * 大きい図形でも同じ太さを使うから、盤面と同じ粒の細かさに見える。
 *
 * 一方で**角の丸みは図形の大きさに応じて変える**。
 * 線の太さは「ドットの粒」だが、角の丸みは「形」なので、性質が違う。
 *
 * ## 出力
 *
 * 盤面のタイルマスクと同じく、平均が中間グレーのグレースケール。
 * `mix-blend-mode: overlay` で色に重ねると、明るさを変えずに質感だけが乗る。
 * 色は src/lib/ice-colors.ts のパレットをそのまま使える。
 */

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const OUTPUT_DIR = "public/assets/frostbound/motifs-v1";

/**
 * 角を丸める半径の既定値。
 *
 * 縁の線の太さ（1px）は図形の大きさに関係なく固定するが、
 * **角の丸みは図形の大きさに応じて変える**。
 * 168px の図形に 4px の丸みだとほぼ真四角に見えてしまう。
 *
 * 線の太さは「ドットの粒」、角の丸みは「形」。前者だけが固定される。
 */
const DEFAULT_RADIUS = 14;

/** 明度の段階。0を中間グレーとした相対値で持つ */
const TONE = {
  /** 上と左の縁。光源が左上なので明るい */
  edgeLight: 0.42,
  /** 縁のすぐ内側の中間調 */
  edgeInner: 0.16,
  /** 面 */
  body: -0.04,
  /** 下と右の縁。影側 */
  edgeShade: -0.34,
  /** 表面のまばらな粒 */
  speckle: 0.2,
};

/** 面に打つ粒の密度。盤面タイルの実測（約0.8%）に合わせる */
const SPECKLE_RATE = 0.008;

/**
 * 決定的な擬似乱数。
 * 生成のたびに粒の位置が変わるとレビューで差分を追えないので、種から固定する。
 */
function makeRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

/**
 * 図形の内側かどうか。
 * rects は矩形の配列で、複数指定すると L 字などの複合形になる。
 */
function makeShape(rects) {
  return (x, y) =>
    rects.some((r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
}

/** その向きに何ピクセル図形が続くか。radius で頭打ちにする */
function run(inside, x, y, dx, dy, limit) {
  for (let i = 1; i <= limit; i += 1) {
    if (!inside(x + dx * i, y + dy * i)) return i - 1;
  }
  return limit;
}

/**
 * 凸角を半径 radius の円弧で丸めるかどうか。
 *
 * 45度の直線で切り落とす方式だと、小さいうちは丸く見えるが、
 * 大きくすると「角を落とした八角形」にしか見えなくなる。
 * 盤面タイル（36px に 4px の面取り）が丸く見えるのは面取りが小さいからで、
 * 同じやり方を 168px に持ち込むと別物になる。
 *
 * そこで縦横の「外側までの距離」を円の式で判定し、階段状の円弧にする。
 * L字の凹角は片方の距離が radius 以上になるので削られない。
 */
function isChamferedOut(inside, x, y, radius) {
  const up = run(inside, x, y, 0, -1, radius);
  const down = run(inside, x, y, 0, 1, radius);
  const left = run(inside, x, y, -1, 0, radius);
  const right = run(inside, x, y, 1, 0, radius);

  const outsideArc = (a, b) => {
    if (a >= radius || b >= radius) return false;
    const da = radius - a - 0.5;
    const db = radius - b - 0.5;
    return da * da + db * db > radius * radius;
  };

  return (
    outsideArc(up, left) ||
    outsideArc(up, right) ||
    outsideArc(down, left) ||
    outsideArc(down, right)
  );
}

function buildMask({ width, height, rects, seed, radius = DEFAULT_RADIUS }) {
  const baseInside = makeShape(rects);
  const inside = (x, y) =>
    x >= 0 &&
    y >= 0 &&
    x < width &&
    y < height &&
    baseInside(x, y) &&
    !isChamferedOut(baseInside, x, y, radius);

  const random = makeRandom(seed);
  const value = new Float64Array(width * height);
  const alpha = new Uint8Array(width * height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      if (!inside(x, y)) continue;

      alpha[i] = 255;

      const openUp = !inside(x, y - 1);
      const openLeft = !inside(x - 1, y);
      const openDown = !inside(x, y + 1);
      const openRight = !inside(x + 1, y);

      if (openUp || openLeft) {
        value[i] = TONE.edgeLight;
      } else if (openDown || openRight) {
        value[i] = TONE.edgeShade;
      } else if (
        !inside(x, y - 2) ||
        !inside(x - 2, y) ||
        !inside(x, y + 2) ||
        !inside(x + 2, y)
      ) {
        value[i] = TONE.edgeInner;
      } else {
        value[i] = random() < SPECKLE_RATE ? TONE.speckle : TONE.body;
      }
    }
  }

  // 平均を中間グレーに寄せる。
  // ここがずれると overlay で重ねたときにタイル全体の明るさが動いてしまう。
  let sum = 0;
  let count = 0;
  for (let i = 0; i < value.length; i += 1) {
    if (alpha[i]) {
      sum += value[i];
      count += 1;
    }
  }
  const mean = count > 0 ? sum / count : 0;

  const gray = Buffer.alloc(width * height * 2);
  for (let i = 0; i < value.length; i += 1) {
    gray[i * 2] = Math.round(Math.min(255, Math.max(0, 128 + (value[i] - mean) * 255)));
    gray[i * 2 + 1] = alpha[i];
  }

  return { gray, width, height };
}

/**
 * 生成するモチーフ。
 * 参考画像に合わせて、正方形・長方形・L字を混ぜる。
 * 大きさは違っても縁の文法は共通なので、並べたときに同じ世界のものに見える。
 */
const MOTIFS = [
  { name: "square-lg", width: 168, height: 168, radius: 22, rects: [{ x: 0, y: 0, w: 168, h: 168 }], seed: 11 },
  { name: "square-md", width: 120, height: 120, radius: 16, rects: [{ x: 0, y: 0, w: 120, h: 120 }], seed: 23 },
  { name: "square-sm", width: 84, height: 84, radius: 12, rects: [{ x: 0, y: 0, w: 84, h: 84 }], seed: 37 },
  { name: "rect-wide", width: 192, height: 108, radius: 16, rects: [{ x: 0, y: 0, w: 192, h: 108 }], seed: 41 },
  { name: "rect-tall", width: 108, height: 192, radius: 16, rects: [{ x: 0, y: 0, w: 108, h: 192 }], seed: 53 },
  {
    name: "l-shape",
    width: 180,
    height: 180,
    radius: 18,
    rects: [
      { x: 0, y: 0, w: 108, h: 180 },
      { x: 0, y: 72, w: 180, h: 108 },
    ],
    seed: 67,
  },
  {
    name: "l-shape-flip",
    width: 168,
    height: 156,
    radius: 18,
    rects: [
      { x: 60, y: 0, w: 108, h: 156 },
      { x: 0, y: 0, w: 168, h: 84 },
    ],
    seed: 79,
  },
];

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  for (const motif of MOTIFS) {
    const { gray, width, height } = buildMask(motif);

    await sharp(gray, { raw: { width, height, channels: 2 } })
      .png({ compressionLevel: 9, palette: false })
      .toFile(path.join(OUTPUT_DIR, `${motif.name}.png`));

    console.log(`  ${motif.name.padEnd(14)} ${width}x${height}`);
  }

  console.log(`\n${MOTIFS.length}枚を ${OUTPUT_DIR} に生成しました`);
}

main();
