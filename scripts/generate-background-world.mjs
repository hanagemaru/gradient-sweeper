/**
 * 背景ワールドの固定配置を1回だけ計算し、`src/lib/background-world.ts` へ書き出す。
 *
 * ランタイムは乱数を一切持たない。ここで決めた座標をコミット済みの固定リストとして読むだけ。
 * シード付き乱数は「自然な散らばり方を一度だけ決める」ためにのみ使う。
 *
 * 配置の考え方（規則的なグリッド感を避けるため）:
 *   - 島（クラスター）単位で組む。大型形状を核にして、中小セルを不規則な角度・距離で従える。
 *   - 行や列にベースラインを揃えない。座標はギャップの倍数に乗せない。
 *   - 島と島の間に広い雪原の余白を残す。等間隔にしない。
 *   - ワールド端をまたぐ配置を許可し、矩形の「額縁」感を消す。
 *   - セル同士・セルとクリスタルは重ねない（棄却サンプリングで最小離隔を確保）。
 *
 * 確認用画像（全景と各画面比率の切り取り）は REVIEW_DIR へ出力する。リポジトリには含めない。
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const CRYSTAL_BASE = "/assets/frostbound/crystals-v2";
const AUTOTILE_BASE = "/assets/frostbound/cell-autotile-v2";
const PUBLIC_DIR = "public";
const REVIEW_DIR =
  process.env.REVIEW_DIR ?? "/tmp/gradient-sweeper-background-review";

// デスクトップまでカメラで覆えるサイズ。1920x1080 / 2560x1440 いずれも内側に収まる。
const WORLD_WIDTH = 2880;
const WORLD_HEIGHT = 1620;

/** 島の核になる大型形状 */
const CORE_SHAPES = [
  "headland", "terrace", "ridge-wide", "bluff-tall",
  "mega-l", "mega-step", "mega-wide", "mega-tall",
];

/** 核の周りに従える中小形状 */
const SATELLITE_SHAPES = ["square", "wide", "tall", "l", "l-rotated", "step"];

/**
 * クリスタル。同じ絵が近くに並ぶと一気に人工的に見えるので、
 * 1つの島の中では種類を重複させず、小さなアクセントも出しすぎない。
 */
const CRYSTAL_WEIGHTS = [
  { name: "cluster-large", weight: 26 },
  { name: "cluster-medium", weight: 28 },
  { name: "cluster-wide", weight: 26 },
  { name: "accent-small", weight: 20 },
];

/**
 * 素材の色。雪原が主役なので covered を厚くし、開封セルは差し色にとどめる。
 * 赤は「危険」の色なので最も希少にする。
 */
const PALETTE_WEIGHTS = [
  { prefix: "covered", weight: 62 },
  { prefix: "open-blue", weight: 20 },
  { prefix: "open-purple", weight: 12 },
  { prefix: "open-red", weight: 6 },
];

/** mulberry32: シード固定の疑似乱数 */
function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260815);
const between = (lo, hi) => lo + rand() * (hi - lo);
const pick = (list) => list[Math.floor(rand() * list.length)];

function pickWeighted(entries, key) {
  const total = entries.reduce((sum, e) => sum + e.weight, 0);
  let roll = rand() * total;
  for (const entry of entries) {
    roll -= entry.weight;
    if (roll <= 0) return entry[key];
  }
  return entries[0][key];
}

const pickPalette = () => pickWeighted(PALETTE_WEIGHTS, "prefix");

const sizeCache = new Map();
async function assetSize(base, name) {
  const key = `${base}/${name}`;
  if (sizeCache.has(key)) return sizeCache.get(key);
  const meta = await sharp(path.join(PUBLIC_DIR, base, `${name}.png`)).metadata();
  const size = { w: meta.width, h: meta.height };
  sizeCache.set(key, size);
  return size;
}

const placed = [];

/** 配置済みのどれとも重ならないか。margin は呼び出しごとに変えて等間隔感を消す。 */
function fits(rect, margin) {
  for (const other of placed) {
    if (
      rect.x < other.x + other.w + margin &&
      rect.x + rect.w + margin > other.x &&
      rect.y < other.y + other.h + margin &&
      rect.y + rect.h + margin > other.y
    ) {
      return false;
    }
  }
  return true;
}

/** ワールドに一部でも掛かっていれば採用（端で見切れる配置を許可する） */
function touchesWorld(rect) {
  return (
    rect.x < WORLD_WIDTH &&
    rect.y < WORLD_HEIGHT &&
    rect.x + rect.w > 0 &&
    rect.y + rect.h > 0
  );
}

/**
 * 島の中心へ向かって「落として」配置する。
 *
 * 外側から内側へ少しずつ寄せ、ぶつかる直前で止める。こうすると新しいセルが
 * 既にある島に寄り添って積み上がり、密集した群島と広い雪原が自然に分かれる。
 * 中心からの距離を乱数で決める方式だと、どの島も同じ密度に均されてしまう。
 */
function settleToward(base, name, size, cx, cy, attempts, maxReach, gapLo, gapHi) {
  for (let i = 0; i < attempts; i += 1) {
    const angle = rand() * Math.PI * 2;
    const gap = Math.round(between(gapLo, gapHi));
    const jitterX = between(-10, 10);
    const jitterY = between(-10, 10);

    const rectAt = (distance) => ({
      base,
      name,
      x: Math.round(cx + Math.cos(angle) * distance - size.w / 2 + jitterX),
      y: Math.round(cy + Math.sin(angle) * distance - size.h / 2 + jitterY),
      w: size.w,
      h: size.h,
    });

    let settled = null;
    for (let distance = maxReach; distance >= 0; distance -= 6) {
      const rect = rectAt(distance);
      if (!fits(rect, gap)) break;
      settled = rect;
    }

    if (settled && touchesWorld(settled)) {
      placed.push(settled);
      return settled;
    }
  }
  return null;
}

/**
 * 島の種を層化ジッタで撒く。
 *
 * 完全な乱数だと大きな空白ができ、カメラが常に中央を映す以上、
 * スマホでその空白を引くと背景がほぼ無地になってしまう。
 * ワールドを区画に切って区画ごとに1つ、区画内のランダムな位置へ置くことで、
 * 位置は不規則なまま、どの画面サイズでも一定の密度を保証する。
 * 区画はスマホのビューポートより大きいので、格子には見えない。
 */
function seedIslands(strideX, strideY) {
  const seeds = [];
  // 端をまたぐ島も作るため、ワールドの外側の区画も1列ぶん回す
  for (let gx = -1; gx * strideX < WORLD_WIDTH + strideX; gx += 1) {
    for (let gy = -1; gy * strideY < WORLD_HEIGHT + strideY; gy += 1) {
      seeds.push({
        x: gx * strideX + between(0, strideX),
        y: gy * strideY + between(0, strideY),
      });
    }
  }
  // 生成順に並んだままだと、詰め込みの順序が左上から右下へ偏る。
  // 順序をシャッフルして、どの島が先に場所を取るかを不規則にする。
  for (let i = seeds.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [seeds[i], seeds[j]] = [seeds[j], seeds[i]];
  }
  return seeds;
}

async function build() {
  // 区画はスマホのビューポート（〜390x844）より小さめに取り、
  // どの位置を切り取っても複数のモチーフが入るようにする。
  const islands = seedIslands(430, 380);

  for (const island of islands) {
    // 1. 島の核。大きな島ほど核も大きい形状から選ぶ。
    const coreName = `${pickPalette()}-${pick(CORE_SHAPES)}`;
    const coreSize = await assetSize(AUTOTILE_BASE, coreName);
    // 核は種の近くに置きたいが、隣の島が既に占めている場合もあるので、
    // 少し離れた位置まで探して島ごと捨てないようにする。
    const core = settleToward(AUTOTILE_BASE, coreName, coreSize, island.x, island.y, 26, 300, 18, 54);
    if (!core) continue;

    // 2. 衛星セル。島ごとに個数を大きく変えることで、密集した群島と
    //    ぽつんと1つだけの島が混ざり、密度に粗密が出る。
    const satelliteCount = Math.floor(between(1, 6));
    for (let i = 0; i < satelliteCount; i += 1) {
      const name = `${pickPalette()}-${pick(SATELLITE_SHAPES)}`;
      const size = await assetSize(AUTOTILE_BASE, name);
      // 島の中の隙間は小さく取り、寄り添って見えるようにする
      settleToward(AUTOTILE_BASE, name, size, island.x, island.y, 22, 400, 5, 20);
    }

    // 3. クリスタル。セルの縁のくぼみに小さな隙間で挟み込む。
    //    同じ島に同じ種類を置かないことで、同じ絵が並ぶ人工的な列を防ぐ。
    const crystalCount = Math.floor(between(0, 2.7));
    const usedCrystals = new Set();
    for (let i = 0; i < crystalCount; i += 1) {
      const remaining = CRYSTAL_WEIGHTS.filter((c) => !usedCrystals.has(c.name));
      if (remaining.length === 0) break;
      const name = pickWeighted(remaining, "name");
      usedCrystals.add(name);
      const size = await assetSize(CRYSTAL_BASE, name);
      settleToward(CRYSTAL_BASE, name, size, island.x, island.y, 30, 400, 3, 12);
    }
  }

  return placed;
}

function serialise(items) {
  const lines = items
    .map((p) => {
      const base = p.base === CRYSTAL_BASE ? "CRYSTAL_BASE" : "AUTOTILE_BASE";
      return `  { base: ${base}, name: "${p.name}", x: ${p.x}, y: ${p.y}, w: ${p.w}, h: ${p.h} },`;
    })
    .join("\n");

  return `// このファイルは scripts/generate-background-world.mjs が生成した固定値です。
// 手で座標を直した場合は、再実行で上書きされるため注意してください。

export const CRYSTAL_BASE = "${CRYSTAL_BASE}";
export const AUTOTILE_BASE = "${AUTOTILE_BASE}";

export const WORLD_WIDTH = ${WORLD_WIDTH};
export const WORLD_HEIGHT = ${WORLD_HEIGHT};

export type BackgroundPlacement = {
  base: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export const BACKGROUND_WORLD: BackgroundPlacement[] = [
${lines}
];
`;
}

/** CSS の drop-shadow(4px 5px 0 rgba(30,55,105,0.28)) を再現した影を作る */
async function shadowOf(file) {
  const alpha = await sharp(file)
    .ensureAlpha()
    .extractChannel(3)
    .linear(0.28, 0)
    .toBuffer();
  const meta = await sharp(file).metadata();
  return sharp({
    create: {
      width: meta.width,
      height: meta.height,
      channels: 3,
      background: { r: 30, g: 55, b: 105 },
    },
  })
    .joinChannel(alpha)
    .png()
    .toBuffer();
}

async function renderReview(items) {
  mkdirSync(REVIEW_DIR, { recursive: true });

  const shadows = [];
  const layers = [];
  for (const p of items) {
    const file = path.join(PUBLIC_DIR, p.base, `${p.name}.png`);
    shadows.push({ input: await shadowOf(file), left: p.x + 4, top: p.y + 5 });
    layers.push({ input: file, left: p.x, top: p.y });
  }

  // sharp は負の left/top を受け付けないので、一度大きめの台紙に描いてから切り出す
  const PAD = 700;
  const canvas = await sharp({
    create: {
      width: WORLD_WIDTH + PAD * 2,
      height: WORLD_HEIGHT + PAD * 2,
      channels: 4,
      background: { r: 185, g: 205, b: 246, alpha: 1 },
    },
  })
    .composite(
      [...shadows, ...layers].map((layer) => ({
        ...layer,
        left: layer.left + PAD,
        top: layer.top + PAD,
      })),
    )
    .png()
    .toBuffer();

  const world = await sharp(canvas)
    .extract({ left: PAD, top: PAD, width: WORLD_WIDTH, height: WORLD_HEIGHT })
    .png()
    .toBuffer();
  writeFileSync(path.join(REVIEW_DIR, "world-overview.png"), world);

  // 各画面比率で中央を切り取る = 実際のカメラの見え方
  const VIEWPORTS = [
    ["iphone-se-375x667", 375, 667],
    ["iphone-390x844", 390, 844],
    ["iphone-max-430x932", 430, 932],
    ["tablet-768x1024", 768, 1024],
    ["desktop-1440x900", 1440, 900],
    ["desktop-1920x1080", 1920, 1080],
  ];
  for (const [name, w, h] of VIEWPORTS) {
    await sharp(world)
      .extract({
        left: Math.round((WORLD_WIDTH - w) / 2),
        top: Math.round((WORLD_HEIGHT - h) / 2),
        width: w,
        height: h,
      })
      .png()
      .toFile(path.join(REVIEW_DIR, `crop-${name}.png`));
  }
  console.log(`review images -> ${REVIEW_DIR}`);
}

const items = await build();
writeFileSync("src/lib/background-world.ts", serialise(items));

const crystals = items.filter((p) => p.base === CRYSTAL_BASE).length;
console.log(`world: ${WORLD_WIDTH}x${WORLD_HEIGHT}`);
console.log(`placed: ${items.length} (cells ${items.length - crystals}, crystals ${crystals})`);
console.log("-> src/lib/background-world.ts");

await renderReview(items);
