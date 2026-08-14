/**
 * CRYSTAL FIELD の背景モチーフ候補を、既存 motifs-v2 / crystals-v2 と
 * 同じ実寸ピクセル密度・パレットで生成する。
 *
 *   node scripts/generate-background-motif-candidates.mjs
 *
 * ここで作るPNGは比較ページ専用。採用後に本番アセットへ昇格する。
 */

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const OUTPUT_DIR = "public/assets/frostbound/motif-candidates-v1";
const CRYSTAL_SOURCE_DIR = "public/assets/frostbound/crystals-v2";

const COLOR = {
  transparent: [0, 0, 0, 0],
  snow: [236, 245, 250, 255],
  snowLight: [220, 234, 255, 255],
  snowMid: [205, 223, 255, 255],
  iceLight: [176, 204, 255, 255],
  iceHighlight: [150, 186, 249, 255],
  blueBody: [114, 167, 239, 255],
  blueMid: [74, 128, 231, 255],
  blueDark: [25, 87, 210, 255],
  blueSoftOutline: [57, 116, 175, 255],
};

function makeRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function makeShape(rects) {
  return (x, y) =>
    rects.some((rect) =>
      x >= rect.x && x < rect.x + rect.w && y >= rect.y && y < rect.y + rect.h,
    );
}

function run(inside, x, y, dx, dy, limit) {
  for (let i = 1; i <= limit; i += 1) {
    if (!inside(x + dx * i, y + dy * i)) return i - 1;
  }
  return limit;
}

function isRoundedOut(inside, x, y, radius) {
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

function roundedUnion({ width, height, rects, radius }) {
  const rawInside = makeShape(rects);
  return (x, y) =>
    x >= 0 &&
    y >= 0 &&
    x < width &&
    y < height &&
    rawInside(x, y) &&
    !isRoundedOut(rawInside, x, y, radius);
}

function distanceToOutside(inside, x, y, limit) {
  for (let distance = 1; distance <= limit; distance += 1) {
    for (let offset = -distance; offset <= distance; offset += 1) {
      if (
        !inside(x + offset, y - distance) ||
        !inside(x + offset, y + distance) ||
        !inside(x - distance, y + offset) ||
        !inside(x + distance, y + offset)
      ) {
        return distance - 1;
      }
    }
  }
  return limit;
}

function setPixel(buffer, width, x, y, color) {
  const offset = (y * width + x) * 4;
  buffer[offset] = color[0];
  buffer[offset + 1] = color[1];
  buffer[offset + 2] = color[2];
  buffer[offset + 3] = color[3];
}

function buildCoveredCell(spec) {
  const { width, height, seed } = spec;
  const inside = roundedUnion(spec);
  const random = makeRandom(seed);
  const rgba = Buffer.alloc(width * height * 4);
  const bottomAtX = new Int16Array(width).fill(-1);
  const shadowInside = (x, y, offsetY) => inside(x, y - offsetY);

  for (let x = 0; x < width; x += 1) {
    for (let y = height - 1; y >= 0; y -= 1) {
      if (inside(x, y)) {
        bottomAtX[x] = y;
        break;
      }
    }
  }

  // 既存未開封セルにある、右下へ張り出す厚い青の層を先に敷く。
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (shadowInside(x, y, 7)) setPixel(rgba, width, x, y, COLOR.blueDark);
      if (shadowInside(x, y, 4)) setPixel(rgba, width, x, y, COLOR.blueMid);
    }
  }

  // 青いセル本体。既存未開封セルと同じ青系パレットだけを使う。
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!inside(x, y)) continue;
      const openUp = !inside(x, y - 1);
      const openLeft = !inside(x - 1, y);
      const openDown = !inside(x, y + 1);
      const openRight = !inside(x + 1, y);
      const distance = distanceToOutside(inside, x, y, 3);

      let color = COLOR.blueMid;
      if (openDown || openRight) color = COLOR.blueDark;
      else if (openUp || openLeft) color = COLOR.snowMid;
      else if (distance <= 1) color = COLOR.iceHighlight;
      else if (random() < 0.018) color = COLOR.iceLight;
      setPixel(rgba, width, x, y, color);
    }
  }

  // 雪面。既存セル同様、面の大部分を雪で覆い、下端だけ青い層を見せる。
  const snowDepthPattern = Array.from({ length: width }, (_, x) => {
    const block = Math.floor(x / 4);
    const coarse = ((block * 7 + seed * 3) % 9) - 4;
    const notch = (block + seed) % 17 === 0 ? 5 : 0;
    return 15 + Math.round(coarse * 0.65) + notch;
  });

  const speckles = new Map();
  const patterns = [
    [[0, 0], [1, 0], [0, 1]],
    [[0, 0], [1, 0], [2, 0], [1, -1], [1, 1]],
    [[0, 0], [0, 1], [1, 1], [1, 2]],
    [[0, 0], [1, -1], [2, -1], [2, -2]],
    [[0, 0], [1, 0]],
  ];
  const clusterCount = Math.round((width * height) / 430);
  for (let index = 0; index < clusterCount; index += 1) {
    const anchorX = 7 + Math.floor(random() * Math.max(1, width - 14));
    const anchorY = 7 + Math.floor(random() * Math.max(1, height - 30));
    const pattern = patterns[Math.floor(random() * patterns.length)];
    const tone = random() < 0.56 ? COLOR.snowLight : COLOR.snowMid;
    for (const [dx, dy] of pattern) speckles.set(`${anchorX + dx},${anchorY + dy}`, tone);
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!inside(x, y)) continue;
      const distance = distanceToOutside(inside, x, y, 5);
      const snowLine = bottomAtX[x] - snowDepthPattern[x];
      if (distance < 2 || y > snowLine) continue;

      const fromSnowEdge = snowLine - y;
      let color = COLOR.snow;
      if (distance === 2) color = COLOR.snowLight;
      else if (fromSnowEdge <= 1) color = COLOR.iceHighlight;
      else if (fromSnowEdge <= 3) color = COLOR.snowMid;
      else if (fromSnowEdge <= 6 && random() < 0.38) color = COLOR.snowLight;
      else if (speckles.has(`${x},${y}`)) color = speckles.get(`${x},${y}`);
      setPixel(rgba, width, x, y, color);
    }
  }

  return { rgba, width, height };
}

function buildOpenCell(spec) {
  const { width, height, seed } = spec;
  const inside = roundedUnion(spec);
  const random = makeRandom(seed);
  const rgba = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!inside(x, y)) continue;
      const openUp = !inside(x, y - 1);
      const openLeft = !inside(x - 1, y);
      const openDown = !inside(x, y + 1);
      const openRight = !inside(x + 1, y);
      const distance = distanceToOutside(inside, x, y, 4);

      let color = COLOR.iceHighlight;
      if (openUp || openLeft) color = COLOR.snow;
      else if (openDown || openRight) color = COLOR.blueDark;
      else if (distance === 1) color = COLOR.blueMid;
      else if (distance === 2) color = COLOR.iceLight;
      else if (distance === 3) color = COLOR.blueBody;
      else if (random() < 0.008) color = COLOR.snowMid;
      setPixel(rgba, width, x, y, color);
    }
  }

  return { rgba, width, height };
}

function pointInPolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
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

function buildCrystal({ width, height, facets }) {
  const rgba = Buffer.alloc(width * height * 4);
  const facetAt = (x, y) =>
    x < 0 || y < 0 || x >= width || y >= height ? -1 : facetIndexAt(facets, x, y);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const facetIndex = facetAt(x, y);
      if (facetIndex < 0) continue;
      const facet = facets[facetIndex];
      const openUp = facetAt(x, y - 1) < 0;
      const openLeft = facetAt(x - 1, y) < 0;
      const openDown = facetAt(x, y + 1) < 0;
      const openRight = facetAt(x + 1, y) < 0;
      const seam =
        (facetAt(x, y - 1) >= 0 && facetAt(x, y - 1) !== facetIndex) ||
        (facetAt(x - 1, y) >= 0 && facetAt(x - 1, y) !== facetIndex);

      let color = facet.color;
      if (openUp || openLeft || openDown || openRight) color = COLOR.blueSoftOutline;
      else if (seam) color = COLOR.blueMid;
      setPixel(rgba, width, x, y, color);
    }
  }

  return { rgba, width, height };
}

async function buildSmallClusterFromExisting() {
  const source = path.join(CRYSTAL_SOURCE_DIR, "cluster-large.png");
  const { data, info } = await sharp(source)
    .resize(82, 69, { kernel: sharp.kernel.nearest })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const softened = Buffer.from(data);

  for (let offset = 0; offset < softened.length; offset += 4) {
    const r = softened[offset];
    const g = softened[offset + 1];
    const b = softened[offset + 2];
    if (r === 10 && g === 47 && b === 117) softened.set(COLOR.blueSoftOutline.slice(0, 3), offset);
    else if (r === 13 && g === 63 && b === 144) softened.set(COLOR.blueMid.slice(0, 3), offset);
  }

  await sharp(softened, { raw: info })
    .png({ compressionLevel: 9, palette: true, colours: 32 })
    .toFile(path.join(OUTPUT_DIR, "crystal-cluster-small.png"));
}

async function softenCrystalOutline(name) {
  const source = path.join(CRYSTAL_SOURCE_DIR, `${name}.png`);
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const softened = Buffer.from(data);

  for (let offset = 0; offset < softened.length; offset += 4) {
    if (softened[offset + 3] === 0) continue;
    const r = softened[offset];
    const g = softened[offset + 1];
    const b = softened[offset + 2];
    if (r === 10 && g === 47 && b === 117) {
      softened.set(COLOR.blueSoftOutline.slice(0, 3), offset);
    } else if (r === 13 && g === 63 && b === 144) {
      softened.set(COLOR.blueMid.slice(0, 3), offset);
    }
  }

  await sharp(softened, { raw: info })
    .png({ compressionLevel: 9, palette: true, colours: 32 })
    .toFile(path.join(OUTPUT_DIR, `${name}-soft.png`));
}

const CELL_CANDIDATES = [
  {
    kind: "open",
    name: "cell-open-blue-unified",
    width: 96,
    height: 96,
    radius: 13,
    rects: [{ x: 3, y: 3, w: 90, h: 90 }],
    seed: 101,
  },
  {
    kind: "covered",
    name: "cell-covered-wide",
    width: 152,
    height: 100,
    radius: 14,
    rects: [{ x: 3, y: 3, w: 146, h: 94 }],
    seed: 113,
  },
  {
    kind: "covered",
    name: "cell-covered-l",
    width: 148,
    height: 140,
    radius: 13,
    rects: [
      { x: 3, y: 3, w: 76, h: 134 },
      { x: 3, y: 68, w: 142, h: 69 },
    ],
    seed: 127,
  },
  {
    kind: "covered",
    name: "cell-covered-step",
    width: 160,
    height: 116,
    radius: 13,
    rects: [
      { x: 3, y: 3, w: 96, h: 78 },
      { x: 63, y: 35, w: 94, h: 78 },
    ],
    seed: 139,
  },
];

const CRYSTAL_CANDIDATES = [
  {
    name: "crystal-single",
    width: 62,
    height: 98,
    facets: [
      { points: [[31, 2], [13, 25], [15, 78], [31, 96]], color: COLOR.snow },
      { points: [[31, 2], [31, 96], [50, 76], [49, 26]], color: COLOR.blueBody },
      { points: [[31, 2], [20, 18], [31, 29], [43, 17]], color: COLOR.iceLight },
      { points: [[18, 30], [22, 25], [25, 64], [21, 60]], color: COLOR.snowLight },
    ],
  },
];

async function writeRgba(name, image) {
  await sharp(image.rgba, { raw: { width: image.width, height: image.height, channels: 4 } })
    .png({ compressionLevel: 9, palette: true, colours: 32 })
    .toFile(path.join(OUTPUT_DIR, `${name}.png`));
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  for (const candidate of CELL_CANDIDATES) {
    const image = candidate.kind === "covered" ? buildCoveredCell(candidate) : buildOpenCell(candidate);
    await writeRgba(candidate.name, image);
    console.log(`  ${candidate.name.padEnd(28)} ${candidate.width}x${candidate.height}`);
  }

  for (const candidate of CRYSTAL_CANDIDATES) {
    await writeRgba(candidate.name, buildCrystal(candidate));
    console.log(`  ${candidate.name.padEnd(28)} ${candidate.width}x${candidate.height}`);
  }

  await buildSmallClusterFromExisting();
  console.log("  crystal-cluster-small        82x69 (cluster-large base)");

  for (const name of ["cluster-large", "cluster-medium", "cluster-wide"]) {
    await softenCrystalOutline(name);
    console.log(`  ${`${name}-soft`.padEnd(28)} existing size`);
  }
}

main();
