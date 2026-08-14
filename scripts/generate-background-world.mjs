/**
 * 固定ピクセル配置の背景ワールドを1回だけ生成し、
 * src/lib/background-world.ts へ配置定義（画像パス・x/y・幅・高さ）を書き出す。
 *
 * ここで作るのはランタイムのランダム配置ではなく、確定した固定リストである。
 * 並び順の決定にシード付き乱数を使うのは見た目の自然な混ざり方のためだけで、
 * 出力（background-world.ts）はコミットされた固定値として使われる。
 */
import { writeFileSync } from "node:fs";
import sharp from "sharp";

const CRYSTAL_BASE = "/assets/frostbound/crystals-v2";
const MOTIF_BASE = "/assets/frostbound/motifs-v2";
const AUTOTILE_BASE = "/assets/frostbound/cell-autotile-v2";

const GAP = 10;
const MARGIN = 10;

// 配置候補。count は世界内での出現回数。
const CATALOG = [
  { base: AUTOTILE_BASE, name: "covered-square", file: "public/assets/frostbound/cell-autotile-v2/covered-square.png", count: 6 },
  { base: AUTOTILE_BASE, name: "covered-wide", file: "public/assets/frostbound/cell-autotile-v2/covered-wide.png", count: 3 },
  { base: AUTOTILE_BASE, name: "covered-tall", file: "public/assets/frostbound/cell-autotile-v2/covered-tall.png", count: 3 },
  { base: AUTOTILE_BASE, name: "covered-l", file: "public/assets/frostbound/cell-autotile-v2/covered-l.png", count: 2 },
  { base: AUTOTILE_BASE, name: "covered-step", file: "public/assets/frostbound/cell-autotile-v2/covered-step.png", count: 2 },
  { base: AUTOTILE_BASE, name: "covered-mega-wide", file: "public/assets/frostbound/cell-autotile-v2/covered-mega-wide.png", count: 1 },
  { base: AUTOTILE_BASE, name: "covered-mega-tall", file: "public/assets/frostbound/cell-autotile-v2/covered-mega-tall.png", count: 1 },
  { base: AUTOTILE_BASE, name: "open-blue-square", file: "public/assets/frostbound/cell-autotile-v2/open-blue-square.png", count: 3 },
  { base: AUTOTILE_BASE, name: "open-blue-wide", file: "public/assets/frostbound/cell-autotile-v2/open-blue-wide.png", count: 2 },
  { base: AUTOTILE_BASE, name: "open-blue-tall", file: "public/assets/frostbound/cell-autotile-v2/open-blue-tall.png", count: 2 },
  { base: AUTOTILE_BASE, name: "open-red-square", file: "public/assets/frostbound/cell-autotile-v2/open-red-square.png", count: 2 },
  { base: AUTOTILE_BASE, name: "open-red-wide", file: "public/assets/frostbound/cell-autotile-v2/open-red-wide.png", count: 1 },
  { base: AUTOTILE_BASE, name: "open-purple-square", file: "public/assets/frostbound/cell-autotile-v2/open-purple-square.png", count: 2 },
  { base: AUTOTILE_BASE, name: "open-purple-wide", file: "public/assets/frostbound/cell-autotile-v2/open-purple-wide.png", count: 1 },
  { base: MOTIF_BASE, name: "l-panel-blue", file: "public/assets/frostbound/motifs-v2/l-panel-blue.png", count: 1 },
  { base: CRYSTAL_BASE, name: "cluster-large", file: "public/assets/frostbound/crystals-v2/cluster-large.png", count: 2 },
  { base: CRYSTAL_BASE, name: "cluster-medium", file: "public/assets/frostbound/crystals-v2/cluster-medium.png", count: 2 },
  { base: CRYSTAL_BASE, name: "cluster-wide", file: "public/assets/frostbound/crystals-v2/cluster-wide.png", count: 2 },
  { base: CRYSTAL_BASE, name: "accent-small", file: "public/assets/frostbound/crystals-v2/accent-small.png", count: 4 },
];

// mulberry32: シード固定の疑似乱数（並び順を一度だけ決めるために使用）
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

const rand = mulberry32(20260814);

const items = [];
for (const entry of CATALOG) {
  const meta = await sharp(entry.file).metadata();
  for (let i = 0; i < entry.count; i++) {
    items.push({ base: entry.base, name: entry.name, w: meta.width, h: entry.height ?? meta.height });
  }
}
// フィッシャー–イェーツでシャッフル（種固定なので毎回同じ結果になる）
for (let i = items.length - 1; i > 0; i--) {
  const j = Math.floor(rand() * (i + 1));
  [items[i], items[j]] = [items[j], items[i]];
}

const WORLD_WIDTH = 1800;

// シェルフ（棚）詰め: 横に並べて入らなくなったら次の棚へ。
// 棚ごとに高さが変わるので、四角グリッドより自然な総柄になる。
let cursorX = MARGIN;
let shelfY = MARGIN;
let shelfHeight = 0;
const placements = [];
for (const item of items) {
  if (cursorX + item.w + MARGIN > WORLD_WIDTH) {
    shelfY += shelfHeight + GAP;
    shelfHeight = 0;
    cursorX = MARGIN;
  }
  placements.push({ base: item.base, name: item.name, x: cursorX, y: shelfY, w: item.w, h: item.h });
  cursorX += item.w + GAP;
  shelfHeight = Math.max(shelfHeight, item.h);
}
const WORLD_HEIGHT = shelfY + shelfHeight + MARGIN;

const lines = placements
  .map(
    (p) =>
      `  { base: ${p.base === CRYSTAL_BASE ? "CRYSTAL_BASE" : p.base === MOTIF_BASE ? "MOTIF_BASE" : "AUTOTILE_BASE"}, name: "${p.name}", x: ${p.x}, y: ${p.y}, w: ${p.w}, h: ${p.h} },`,
  )
  .join("\n");

const out = `// このファイルは scripts/generate-background-world.mjs が生成した固定値です。
// 手で座標を直した場合は、再実行で上書きされるため注意してください。

export const CRYSTAL_BASE = "/assets/frostbound/crystals-v2";
export const MOTIF_BASE = "/assets/frostbound/motifs-v2";
export const AUTOTILE_BASE = "/assets/frostbound/cell-autotile-v2";

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

writeFileSync("src/lib/background-world.ts", out);
console.log(`world: ${WORLD_WIDTH}x${WORLD_HEIGHT}, items: ${placements.length}`);
console.log("-> src/lib/background-world.ts");
