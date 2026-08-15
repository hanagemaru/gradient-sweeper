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

/**
 * 横方向のタイリング回数。1 なら繰り返しなしの一点物。
 *
 * 配置は1タイル分（TILE_WIDTH x WORLD_HEIGHT）の座標系だけで行い、
 * x をトーラス（円環）として扱う。こうするとタイル右端をまたぐモチーフが
 * 左端に回り込み、繰り返しても継ぎ目が出ない。
 */
const TILE_REPEATS = Number(process.env.TILE_REPEATS ?? 2);
const TILE_WIDTH = Math.round(WORLD_WIDTH / TILE_REPEATS);

/**
 * 同じアセットが近くに2つ並ぶと、そこだけ人工的に見えてしまう。
 * スマホ幅（375〜430）より大きい距離を空けることで、
 * 同じ絵が1画面に2つ入ることをほぼ無くす。
 */
const SAME_ASSET_MIN_DISTANCE = 470;

/**
 * UIパネルのキープアウト（クリスタル専用）。
 *
 * カメラはワールド中央固定なので、ビューポート (vw, vh) が映すのは
 * x = 1440 ± vw/2、y = 810 ± vh/2。ここに `.stack`（パネル＋言語トグル）が
 * 重なる範囲を、スマホ5サイズ × 本番4ページで実測して和を取った値が下記。
 *
 *   home/ta   x[1280,1600] y[476, 969]   (.stackMenu = 320px)
 *   ranking   x[1241,1639] y[476, 905]   (.stackWide = 440px)
 *   result    x[1265,1615] y[476,1082]   (.stack     = 350px)
 *   → 和 x[1241,1639] y[476,1082]
 *
 * これにパネルの落ち影（6px 12px）とクリスタルの drop-shadow ぶんの余裕を足す。
 * セル系モチーフはパネルに重なってよいので、この判定はクリスタルにだけ効かせる。
 *
 * 注意: x の幅（414px）は最小スマホの幅 375px より広い。つまり最小画面では
 * パネルの左右に逃げ場が無く、クリスタルは上下の帯にしか置けない。
 */
const UI_KEEPOUT = { x0: 1233, x1: 1647, y0: 468, y1: 1094 };

/**
 * 最小スマホ（375x667）が映すのは y[477,1144]。キープアウト下端が 1094 なので、
 * クリスタルを置ける帯はその下の約50pxしかない。ここを先に確保する。
 */
const SMALL_PHONE_CRYSTAL_BAND = { x0: 1258, x1: 1622, y0: 1098, y1: 1150 };

/** 確認画像のファイル名につける識別子（試作の比較用） */
const SUFFIX = TILE_REPEATS > 1 ? `-x${TILE_REPEATS}` : "-x1";

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

/**
 * 配置済みのどれとも重ならないか。margin は呼び出しごとに変えて等間隔感を消す。
 *
 * x はトーラスなので、タイル1枚ぶん左右にずらした位置でも判定する。
 * これをやらないとタイルの右端と左端のモチーフが、繰り返したときに重なってしまう。
 */
function fits(rect, margin) {
  for (const other of placed) {
    const overlapsY =
      rect.y < other.y + other.h + margin && rect.y + rect.h + margin > other.y;
    if (!overlapsY) continue;

    for (const shift of [-TILE_WIDTH, 0, TILE_WIDTH]) {
      const ox = other.x + shift;
      if (rect.x < ox + other.w + margin && rect.x + rect.w + margin > ox) {
        return false;
      }
    }
  }
  return true;
}

/**
 * 縦方向にワールドへ掛かっていれば採用。
 * x はトーラスなのでどの値でも有効（書き出し時に横へ複製される）。
 */
function touchesWorld(rect) {
  return rect.y < WORLD_HEIGHT && rect.y + rect.h > 0;
}

/** 同じアセットが近くに無いか。x はトーラスなので左右にずらした位置も見る。 */
function farFromSameAsset(rect) {
  for (const other of placed) {
    if (other.name !== rect.name) continue;
    for (const shift of [-TILE_WIDTH, 0, TILE_WIDTH]) {
      const ox = other.x + shift;
      const dx = Math.max(ox - (rect.x + rect.w), rect.x - (ox + other.w), 0);
      const dy = Math.max(other.y - (rect.y + rect.h), rect.y - (other.y + other.h), 0);
      if (Math.hypot(dx, dy) < SAME_ASSET_MIN_DISTANCE) return false;
    }
  }
  return true;
}

/**
 * クリスタルがUIパネルに掛からないか。
 * 配置はタイル座標なので、ワールド座標のキープアウトを各タイル位置へ写して判定する。
 */
function clearOfUiPanel(rect) {
  for (let k = -1; k <= TILE_REPEATS; k += 1) {
    const x = rect.x + k * TILE_WIDTH;
    if (
      x < UI_KEEPOUT.x1 &&
      x + rect.w > UI_KEEPOUT.x0 &&
      rect.y < UI_KEEPOUT.y1 &&
      rect.y + rect.h > UI_KEEPOUT.y0
    ) {
      return false;
    }
  }
  return true;
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

    const isCrystal = base === CRYSTAL_BASE;

    let settled = null;
    for (let distance = maxReach; distance >= 0; distance -= 6) {
      const rect = rectAt(distance);
      if (!fits(rect, gap)) break;
      // 制約を満たさない位置は「そこで止まる」のではなく素通りさせる。
      // 内側にもっと良い位置があるかもしれないので、探索は続ける。
      if (!farFromSameAsset(rect)) continue;
      if (isCrystal && !clearOfUiPanel(rect)) continue;
      settled = rect;
    }

    if (settled && touchesWorld(settled)) {
      // x をタイル内へ正規化し、配置リストを正準形にしておく
      settled.x = ((settled.x % TILE_WIDTH) + TILE_WIDTH) % TILE_WIDTH;
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
  // x はタイル内だけを走査する（トーラスなので端の外側は不要）。
  // 縦は繰り返さないので、上下は外側の区画も1列ぶん回して端をまたがせる。
  for (let gx = 0; gx * strideX < TILE_WIDTH; gx += 1) {
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

/** 配置済みの矩形までの最短距離（x はトーラス）。空き具合の指標に使う。 */
function emptiness(px, py) {
  let nearest = Infinity;
  for (const r of placed) {
    let best = Infinity;
    for (const shift of [-TILE_WIDTH, 0, TILE_WIDTH]) {
      const rx = r.x + shift;
      const dx = Math.max(rx - px, 0, px - (rx + r.w));
      const dy = Math.max(r.y - py, 0, py - (r.y + r.h));
      best = Math.min(best, Math.hypot(dx, dy));
    }
    nearest = Math.min(nearest, best);
  }
  return nearest;
}

/**
 * 空いている場所を探して埋める。
 *
 * 島を撒くだけだと、タイル幅が狭いほど回り込み判定で棄却されて密度が落ち、
 * カメラが常に映すワールド中央が広い空白になることがある。
 * 候補点をいくつか撒いて「最も空いている点」を選ぶことで、
 * 格子に頼らずに穴だけを埋められる。
 */
async function fillGaps(targetCount) {
  let guard = 0;
  while (placed.length < targetCount && guard < targetCount * 12) {
    guard += 1;

    // 候補をばらまき、いちばん空いている点を選ぶ
    let spot = null;
    let spotScore = -1;
    for (let i = 0; i < 40; i += 1) {
      const px = between(0, TILE_WIDTH);
      const py = between(40, WORLD_HEIGHT - 40);
      const score = emptiness(px, py);
      if (score > spotScore) { spotScore = score; spot = { x: px, y: py }; }
    }
    if (!spot) break;

    // 空きが大きいところには大きめの形状を置く
    const useCore = spotScore > 240 && rand() < 0.55;
    // クリスタルは単体で浮いていると不自然なので、セルのすぐ脇に寄せられる
    // ときだけ置く。数も全体の2割程度で打ち止めにする。
    const crystalCount = placed.filter((p) => p.base === CRYSTAL_BASE).length;
    const useCrystal =
      !useCore &&
      spotScore < 90 &&
      crystalCount < targetCount * 0.2 &&
      rand() < 0.25;

    if (useCrystal) {
      const name = pickWeighted(CRYSTAL_WEIGHTS, "name");
      const size = await assetSize(CRYSTAL_BASE, name);
      settleToward(CRYSTAL_BASE, name, size, spot.x, spot.y, 12, 120, 4, 14);
    } else {
      const shape = useCore ? pick(CORE_SHAPES) : pick(SATELLITE_SHAPES);
      const name = `${pickPalette()}-${shape}`;
      const size = await assetSize(AUTOTILE_BASE, name);
      settleToward(AUTOTILE_BASE, name, size, spot.x, spot.y, 14, 200, 8, 30);
    }
  }
}

/**
 * 最小スマホ画面にもクリスタルが必ず1つ入るようにする。
 *
 * キープアウトの下の帯は約50pxしかないので、あとから空きを探しても取れない。
 * 島を撒く前に先に置いて場所を確保する。40x40 の accent-small なら確実に収まる。
 */
async function reserveSmallPhoneCrystals() {
  const band = SMALL_PHONE_CRYSTAL_BAND;
  const name = "accent-small";
  const size = await assetSize(CRYSTAL_BASE, name);

  for (let attempt = 0; attempt < 60; attempt += 1) {
    const worldX = between(band.x0, band.x1 - size.w);
    const rect = {
      base: CRYSTAL_BASE,
      name,
      x: Math.round(((worldX % TILE_WIDTH) + TILE_WIDTH) % TILE_WIDTH),
      y: Math.round(between(band.y0, band.y1 - size.h)),
      w: size.w,
      h: size.h,
    };
    if (!fits(rect, 8) || !clearOfUiPanel(rect)) continue;
    placed.push(rect);
    return rect;
  }
  return null;
}

async function build() {
  const reserved = await reserveSmallPhoneCrystals();
  if (!reserved) console.log("WARNING: could not reserve a crystal for the smallest phone");

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

  // タイル幅によらず密度を揃える。狭いタイルほど回り込み判定で棄却されやすく、
  // 島を撒くだけでは中央に大きな空白が残ることがある。
  await fillGaps(Math.round((TILE_WIDTH * WORLD_HEIGHT) / 60000));

  return placed;
}

/**
 * 1タイル分の配置を、ワールド全体へ横に複製する。
 *
 * k = 0..TILE_REPEATS-1 は常に出す。加えて k = -1 と k = TILE_REPEATS は、
 * ずらした矩形がワールドに掛かるものだけ出す（タイル境界をまたぐモチーフの
 * 見切れ分）。全部出すとDOMノードが無駄に増える。
 */
function expandTiles(tileItems) {
  const out = [];
  for (let k = -1; k <= TILE_REPEATS; k += 1) {
    for (const p of tileItems) {
      const x = p.x + k * TILE_WIDTH;
      const inside = x < WORLD_WIDTH && x + p.w > 0;
      const isInteriorTile = k >= 0 && k < TILE_REPEATS;
      if (!isInteriorTile && !inside) continue;
      out.push({ ...p, x });
    }
  }
  return out;
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
  writeFileSync(path.join(REVIEW_DIR, `world-overview${SUFFIX}.png`), world);

  if (TILE_REPEATS > 1) {
    // 継ぎ目の検査: タイリングの定義そのもの。重なる全領域で
    // pixel(x, y) === pixel(x + TILE_WIDTH, y) なら継ぎ目は原理的に存在しない。
    const { data, info } = await sharp(world)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    let mismatches = 0;
    for (let y = 0; y < info.height; y += 1) {
      for (let x = 0; x + TILE_WIDTH < info.width; x += 1) {
        const a = (y * info.width + x) * info.channels;
        const b = (y * info.width + x + TILE_WIDTH) * info.channels;
        if (
          data[a] !== data[b] ||
          data[a + 1] !== data[b + 1] ||
          data[a + 2] !== data[b + 2]
        ) {
          mismatches += 1;
        }
      }
    }
    console.log(
      mismatches === 0
        ? `seam check: PASS (tile ${TILE_WIDTH}px repeats cleanly)`
        : `seam check: FAIL (${mismatches} mismatching pixels)`,
    );

    // タイル境界に目印を入れた版。繰り返しのリズムを目で判断するため。
    const marks = [];
    for (let k = 1; k < TILE_REPEATS; k += 1) {
      marks.push({
        input: {
          create: {
            width: 3,
            height: WORLD_HEIGHT,
            channels: 4,
            background: { r: 255, g: 90, b: 60, alpha: 1 },
          },
        },
        left: k * TILE_WIDTH,
        top: 0,
      });
    }
    await sharp(world)
      .composite(marks)
      .png()
      .toFile(path.join(REVIEW_DIR, `world-overview${SUFFIX}-marked.png`));

    // 継ぎ目付近の拡大（境界をまたぐ帯）
    const seamW = 700;
    await sharp(world)
      .extract({
        left: Math.max(0, TILE_WIDTH - seamW / 2),
        top: 0,
        width: seamW,
        height: WORLD_HEIGHT,
      })
      .png()
      .toFile(path.join(REVIEW_DIR, `seam${SUFFIX}.png`));
  }

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
      .toFile(path.join(REVIEW_DIR, `crop-${name}${SUFFIX}.png`));
  }
  console.log(`review images -> ${REVIEW_DIR}`);
}

const tileItems = await build();
const items = expandTiles(tileItems);

// WRITE_WORLD=0 のときは確認画像だけ作り、本番の配置は差し替えない（試作用）
if (process.env.WRITE_WORLD !== "0") {
  writeFileSync("src/lib/background-world.ts", serialise(items));
  console.log("-> src/lib/background-world.ts");
}

const crystals = items.filter((p) => p.base === CRYSTAL_BASE).length;
console.log(`world: ${WORLD_WIDTH}x${WORLD_HEIGHT}  tile: ${TILE_WIDTH}x${WORLD_HEIGHT} x${TILE_REPEATS}`);
console.log(`tile items: ${tileItems.length}  ->  world items: ${items.length} (cells ${items.length - crystals}, crystals ${crystals})`);

await renderReview(items);
