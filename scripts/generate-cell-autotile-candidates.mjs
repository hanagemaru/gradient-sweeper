/**
 * 背景用セルを、既存アセットから抽出したスタイル部品で自動生成する。
 *
 *   node scripts/generate-cell-autotile-candidates.mjs
 *
 * 形は SHAPES の 0/1 配列だけで指定する。拡大縮小はせず、縁・角・雪面・
 * 右下層を常に1px単位で描く。雪面と開封面の粒は既存PNGから抽出した
 * connected component（スタンプ）を再配置するため、形を追加しても絵柄が漂流しない。
 */

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const OUTPUT_DIR = "public/assets/frostbound/cell-autotile-v1";
const MOTIF_DIR = "public/assets/frostbound/motifs-v2";
const UNIT = 48;
const PAD = 4;
const RADIUS = 12;

const COLOR = {
  transparent: [0, 0, 0, 0],
  snow: [236, 245, 250, 255],
  snowLight: [220, 234, 255, 255],
  snowMid: [205, 223, 255, 255],
  iceLight: [176, 204, 255, 255],
  ice: [150, 186, 249, 255],
  blueBody: [114, 167, 239, 255],
  blueMid: [74, 128, 231, 255],
  blueDark: [25, 87, 210, 255],
};

const SHAPES = [
  { name: "square", grid: ["11", "11"], seed: 101 },
  { name: "wide", grid: ["111", "111"], seed: 113 },
  { name: "tall", grid: ["11", "11", "11"], seed: 127 },
  { name: "l", grid: ["110", "110", "111"], seed: 139 },
  { name: "step", grid: ["110", "111"], seed: 151 },
];

function makeRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function setPixel(buffer, width, x, y, color) {
  if (x < 0 || y < 0 || x >= width || y * width * 4 >= buffer.length) return;
  const offset = (y * width + x) * 4;
  buffer[offset] = color[0];
  buffer[offset + 1] = color[1];
  buffer[offset + 2] = color[2];
  buffer[offset + 3] = color[3];
}

function run(inside, x, y, dx, dy, limit) {
  for (let distance = 1; distance <= limit; distance += 1) {
    if (!inside(x + dx * distance, y + dy * distance)) return distance - 1;
  }
  return limit;
}

function roundedOut(inside, x, y, radius) {
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
  return outsideArc(up, left) || outsideArc(up, right) || outsideArc(down, left) || outsideArc(down, right);
}

function makeShape(grid) {
  const rows = grid.length;
  const columns = Math.max(...grid.map((row) => row.length));
  const raw = (x, y) => {
    const localX = x - PAD;
    const localY = y - PAD;
    if (localX < 0 || localY < 0) return false;
    const column = Math.floor(localX / UNIT);
    const row = Math.floor(localY / UNIT);
    return row < rows && column < columns && grid[row]?.[column] === "1";
  };
  const inside = (x, y) => raw(x, y) && !roundedOut(raw, x, y, RADIUS);
  return {
    inside,
    width: columns * UNIT + PAD * 2 + 2,
    height: rows * UNIT + PAD * 2 + 8,
  };
}

function distanceToOutside(inside, x, y, limit = 4) {
  for (let distance = 1; distance <= limit; distance += 1) {
    for (let offset = -distance; offset <= distance; offset += 1) {
      if (
        !inside(x + offset, y - distance) ||
        !inside(x + offset, y + distance) ||
        !inside(x - distance, y + offset) ||
        !inside(x + distance, y + offset)
      ) return distance - 1;
    }
  }
  return limit;
}

function colorKey(data, offset) {
  return `${data[offset]},${data[offset + 1]},${data[offset + 2]},${data[offset + 3]}`;
}

async function extractStamps(fileName, bounds, baseColor, minimumSize = 2) {
  const source = path.join(MOTIF_DIR, fileName);
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const baseKey = baseColor.join(",");
  const candidates = new Set();

  for (let y = bounds.top; y < bounds.bottom; y += 1) {
    for (let x = bounds.left; x < bounds.right; x += 1) {
      const offset = (y * info.width + x) * 4;
      if (data[offset + 3] === 255 && colorKey(data, offset) !== baseKey) candidates.add(`${x},${y}`);
    }
  }

  const stamps = [];
  while (candidates.size > 0) {
    const first = candidates.values().next().value;
    candidates.delete(first);
    const queue = [first.split(",").map(Number)];
    const pixels = [];

    while (queue.length > 0) {
      const [x, y] = queue.shift();
      const offset = (y * info.width + x) * 4;
      pixels.push({ x, y, color: [...data.subarray(offset, offset + 4)] });
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const key = `${x + dx},${y + dy}`;
        if (candidates.delete(key)) queue.push([x + dx, y + dy]);
      }
    }

    if (pixels.length < minimumSize || pixels.length > 18) continue;
    const minX = Math.min(...pixels.map((pixel) => pixel.x));
    const minY = Math.min(...pixels.map((pixel) => pixel.y));
    stamps.push(pixels.map((pixel) => ({ ...pixel, x: pixel.x - minX, y: pixel.y - minY })));
  }

  return stamps;
}

function drawShiftedShape(buffer, width, height, inside, dx, dy, color) {
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (inside(x - dx, y - dy)) setPixel(buffer, width, x, y, color);
    }
  }
}

function stampTexture({ buffer, width, height, inside, stamps, seed, rate, snowLineAt }) {
  const random = makeRandom(seed);
  const attempts = Math.round((width * height) * rate);
  if (stamps.length === 0) return;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const stamp = stamps[Math.floor(random() * stamps.length)];
    const anchorX = PAD + 7 + Math.floor(random() * Math.max(1, width - PAD * 2 - 14));
    const anchorY = PAD + 7 + Math.floor(random() * Math.max(1, height - PAD * 2 - 24));
    for (const pixel of stamp) {
      const x = anchorX + pixel.x;
      const y = anchorY + pixel.y;
      if (!inside(x, y) || distanceToOutside(inside, x, y, 4) < 4) continue;
      if (snowLineAt && y > snowLineAt(x) - 8) continue;
      setPixel(buffer, width, x, y, pixel.color);
    }
  }
}

function renderOpen(shape, stamps) {
  const { inside, width, height } = makeShape(shape.grid);
  const buffer = Buffer.alloc(width * height * 4);

  drawShiftedShape(buffer, width, height, inside, 2, 7, COLOR.blueDark);
  drawShiftedShape(buffer, width, height, inside, 1, 4, COLOR.blueMid);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!inside(x, y)) continue;
      const openUp = !inside(x, y - 1);
      const openLeft = !inside(x - 1, y);
      const openDown = !inside(x, y + 1);
      const openRight = !inside(x + 1, y);
      const distance = distanceToOutside(inside, x, y, 4);
      let color = COLOR.ice;
      if (openUp || openLeft) color = COLOR.snow;
      else if (openDown || openRight) color = COLOR.blueDark;
      else if (!inside(x, y - 2) || !inside(x - 2, y)) color = COLOR.iceLight;
      else if (!inside(x, y + 2) || !inside(x + 2, y)) color = COLOR.blueMid;
      else if (distance === 2) color = COLOR.blueBody;
      setPixel(buffer, width, x, y, color);
    }
  }

  stampTexture({ buffer, width, height, inside, stamps, seed: shape.seed + 500, rate: 0.001 });
  return { buffer, width, height };
}

function renderCovered(shape, stamps) {
  const { inside, width, height } = makeShape(shape.grid);
  const buffer = Buffer.alloc(width * height * 4);
  const random = makeRandom(shape.seed);
  const bottomAtX = new Int16Array(width).fill(-1);

  for (let x = 0; x < width; x += 1) {
    for (let y = height - 1; y >= 0; y -= 1) {
      if (inside(x, y)) { bottomAtX[x] = y; break; }
    }
  }

  const snowDepth = Array.from({ length: width }, (_, x) => {
    const block = Math.floor((x + shape.seed) / 3);
    const variation = ((block * 11 + shape.seed * 5) % 9) - 4;
    const notch = (block * 3 + shape.seed) % 23 === 0 ? 5 : 0;
    return 15 + Math.round(variation * 0.7) + notch;
  });
  const snowLineAt = (x) => bottomAtX[x] - snowDepth[x];

  drawShiftedShape(buffer, width, height, inside, 2, 8, COLOR.blueDark);
  drawShiftedShape(buffer, width, height, inside, 1, 5, COLOR.blueMid);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!inside(x, y)) continue;
      const openUp = !inside(x, y - 1);
      const openLeft = !inside(x - 1, y);
      const openDown = !inside(x, y + 1);
      const openRight = !inside(x + 1, y);
      const distance = distanceToOutside(inside, x, y, 4);
      let color = COLOR.blueMid;
      if (openUp || openLeft || openDown || openRight) color = COLOR.blueDark;
      else if (distance === 1) color = COLOR.ice;
      else if (random() < 0.012) color = COLOR.iceLight;
      setPixel(buffer, width, x, y, color);
    }
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!inside(x, y) || y > snowLineAt(x)) continue;
      const distance = distanceToOutside(inside, x, y, 5);
      if (distance < 2) continue;
      const fromEdge = snowLineAt(x) - y;
      let color = COLOR.snow;
      if (distance === 2) color = COLOR.snowLight;
      else if (fromEdge <= 1) color = COLOR.ice;
      else if (fromEdge <= 3) color = COLOR.snowMid;
      else if (fromEdge <= 6 && random() < 0.45) color = COLOR.snowLight;
      setPixel(buffer, width, x, y, color);
    }
  }

  stampTexture({ buffer, width, height, inside, stamps, seed: shape.seed + 900, rate: 0.0028, snowLineAt });
  return { buffer, width, height };
}

async function writeImage(name, image) {
  await sharp(image.buffer, { raw: { width: image.width, height: image.height, channels: 4 } })
    .png({ compressionLevel: 9, palette: true, colours: 32 })
    .toFile(path.join(OUTPUT_DIR, `${name}.png`));
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const coveredStamps = await extractStamps(
    "cell-covered-large.png",
    { left: 16, top: 14, right: 112, bottom: 94 },
    COLOR.snow,
  );
  const openStamps = await extractStamps(
    "l-panel-blue.png",
    { left: 18, top: 18, right: 82, bottom: 76 },
    COLOR.ice,
    1,
  );

  for (const shape of SHAPES) {
    const covered = renderCovered(shape, coveredStamps);
    const open = renderOpen(shape, openStamps);
    await writeImage(`covered-${shape.name}`, covered);
    await writeImage(`open-blue-${shape.name}`, open);
    console.log(`${shape.name.padEnd(8)} covered/open ${covered.width}x${covered.height}`);
  }

  console.log(`covered stamps: ${coveredStamps.length}, open stamps: ${openStamps.length}`);
}

main();
