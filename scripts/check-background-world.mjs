/**
 * 生成済みの背景ワールドを検証する。
 *
 * 生成スクリプトは配置のたびに規則を確かめているが、規則を書き換えたときに
 * 「判定は通ったのに絵は破綻している」を見逃さないよう、出来上がった座標を
 * 独立に測り直す。判定に使う定数と関数は生成側と共有している
 * （`background-world-rules.mjs`）ので、規則を直せば両方に効く。
 *
 * 見るのは4つ。
 *   1. クリスタルの画面外欠け … 上下左右のどこかで切れていないか
 *   2. パネル縁の覗き        … メインメニューで細い帯だけ見えていないか
 *   3. 横並び                … 見えているモチーフが同じ高さに揃っていないか
 *   4. 可視セル数            … 見えるセルが何個あるか（密度の目安）
 *
 * 使い方:
 *   node scripts/check-background-world.mjs
 *   node scripts/check-background-world.mjs path/to/other-world.ts ...
 *
 * シードを比較したいときは、生成してから渡す:
 *   SEED=1234 WRITE_WORLD=1 OUT_FILE=/tmp/s-1234.ts node scripts/generate-background-world.mjs
 *   node scripts/check-background-world.mjs /tmp/s-1234.ts
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  homeVisibleArea,
  isPanelSliver,
  largestVisibleSide,
  looksLikeRow,
} from "./background-world-rules.mjs";

const PUBLIC_DIR = "public";
const BASES = {
  CRYSTAL_BASE: "/assets/frostbound/crystals-v2",
  AUTOTILE_BASE: "/assets/frostbound/cell-autotile-v2",
};

const cache = new Map();

/** PNG の不透明ピクセルのバウンディングボックス（生成側と同じ定義）。 */
async function opaqueBox(base, name) {
  const key = `${base}/${name}`;
  if (cache.has(key)) return cache.get(key);
  const file = path.join(PUBLIC_DIR, base, `${name}.png`);
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let x0 = info.width;
  let y0 = info.height;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      if (data[(y * info.width + x) * info.channels + 3] <= 8) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  const box = { ox: x0, oy: y0, ow: x1 - x0 + 1, oh: y1 - y0 + 1 };
  cache.set(key, box);
  return box;
}

function parseWorld(source) {
  const pattern =
    /\{ base: (\w+), name: "([^"]+)", x: (-?\d+), y: (-?\d+), w: (\d+), h: (\d+) \}/g;
  return [...source.matchAll(pattern)].map((m) => ({
    baseKind: m[1],
    base: BASES[m[1]],
    name: m[2],
    x: Number(m[3]),
    y: Number(m[4]),
    w: Number(m[5]),
    h: Number(m[6]),
  }));
}

async function inspect(file) {
  const items = parseWorld(readFileSync(file, "utf8"));
  const rows = [];

  for (const item of items) {
    const box = await opaqueBox(item.base, item.name);
    // 書き出し済みの座標はすでに正規化されているので、そのまま画面座標になる。
    const rect = {
      x0: item.x + box.ox,
      y0: item.y + box.oy,
      x1: item.x + box.ox + box.ow,
      y1: item.y + box.oy + box.oh,
    };
    rows.push({
      isCrystal: item.baseKind === "CRYSTAL_BASE",
      name: item.name,
      rect,
      cy: (rect.y0 + rect.y1) / 2,
      clip: {
        top: Math.max(0, -rect.y0),
        bottom: Math.max(0, rect.y1 - CANVAS_HEIGHT),
        left: Math.max(0, -rect.x0),
        right: Math.max(0, rect.x1 - CANVAS_WIDTH),
      },
      visibleArea: homeVisibleArea(rect.x0, rect.y0, rect.x1, rect.y1),
      side: largestVisibleSide(rect.x0, rect.y0, rect.x1, rect.y1),
    });
  }

  rows.sort((a, b) => a.cy - b.cy);

  const problems = [];
  for (const r of rows) {
    const clipped = Object.entries(r.clip).filter(([, v]) => v > 0);
    // クリスタルは1つの塊として読ませたいので、端で切れているだけで破綻。
    // セルは端をまたぐ配置を意図的に許している（額縁感を消すため）。
    if (r.isCrystal && clipped.length > 0) {
      problems.push(`クリスタル欠け: ${r.name} (${clipped.map(([k, v]) => `${k}:${v}px`).join(" ")})`);
    }
    if (!r.isCrystal && isPanelSliver(r.rect)) {
      problems.push(`パネル縁の覗き: ${r.name} (見えている塊が ${r.side}px)`);
    }
  }
  for (let i = 0; i < rows.length; i += 1) {
    for (let j = i + 1; j < rows.length; j += 1) {
      // 下側クリスタル2個は帯の制約から中心を 37.5px までしかずらせないため、
      // ROW_MIN_OFFSET を満たせない。意図的な例外として除外する
      // （経緯は docs/technical/BACKGROUND-WORLD.md）。
      if (rows[i].isCrystal && rows[j].isCrystal) continue;
      if (!looksLikeRow(rows[i].rect, rows[j].rect)) continue;
      const gap = Math.abs(rows[i].cy - rows[j].cy).toFixed(0);
      problems.push(`横並び: ${rows[i].name} / ${rows[j].name} (中心差 ${gap}px)`);
    }
  }

  const cells = rows.filter((r) => !r.isCrystal);
  const visibleCells = cells.filter((r) => r.visibleArea > 0);

  console.log(`\n=== ${path.basename(file)} ===`);
  for (const r of rows) {
    const marks = Object.entries(r.clip)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `${k}${v}`)
      .join(" ");
    console.log(
      `  ${(r.isCrystal ? "crystal" : "cell").padEnd(8)}${r.name.padEnd(22)}` +
        `y[${String(r.rect.y0).padStart(4)},${String(r.rect.y1).padStart(4)}] ` +
        `x[${String(r.rect.x0).padStart(4)},${String(r.rect.x1).padStart(4)}] ` +
        `塊${String(r.side).padStart(3)}px ${marks}`,
    );
  }
  console.log(
    `  可視セル ${visibleCells.length}/${cells.length}` +
      `  クリスタル ${rows.length - cells.length}`,
  );
  if (problems.length === 0) {
    console.log("  ✅ 問題なし");
  } else {
    for (const p of problems) console.log(`  ❌ ${p}`);
  }
  return problems.length;
}

const files = process.argv.slice(2);
if (files.length === 0) files.push("src/lib/background-world.ts");

let total = 0;
for (const file of files) total += await inspect(file);

console.log(total === 0 ? "\n全て問題なし" : `\n問題 ${total} 件`);
process.exitCode = total === 0 ? 0 : 1;
