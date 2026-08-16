/**
 * Create the initial editable opened-cell surface master.
 *
 * This script is intentionally separate from the shape generator: once the
 * PNG exists, normal regeneration reads it and never overwrites manual edits.
 */

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const SOURCE = path.join(ROOT, "public/assets/frostbound/motifs-v2/l-panel-blue.png");
const OUTPUT = path.join(ROOT, "public/assets/frostbound/motifs-v2/open-surface-master-blue.png");
const WIDTH = 256;
const HEIGHT = 256;
const BODY = [150, 186, 249, 255];

function offset(width, x, y) { return (y * width + x) * 4; }

function makeRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

async function extractSprites() {
  const { data, info } = await sharp(SOURCE).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const candidates = new Set();
  for (let y = 0; y < info.height; y += 1) for (let x = 0; x < info.width; x += 1) {
    const pixelOffset = offset(info.width, x, y);
    const isBody = BODY.every((value, index) => data[pixelOffset + index] === value);
    if (!data[pixelOffset + 3] || isBody) continue;

    let safelyInside = true;
    for (let distance = 1; distance <= 8 && safelyInside; distance += 1) {
      for (const [dx, dy] of [[distance, 0], [-distance, 0], [0, distance], [0, -distance]]) {
        const nx = x + dx; const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= info.width || ny >= info.height
          || !data[offset(info.width, nx, ny) + 3]) safelyInside = false;
      }
    }
    if (safelyInside) candidates.add(`${x},${y}`);
  }

  const sprites = [];
  while (candidates.size) {
    const first = candidates.values().next().value;
    candidates.delete(first);
    const queue = [first.split(",").map(Number)];
    const pixels = [];
    while (queue.length) {
      const [x, y] = queue.shift();
      const pixelOffset = offset(info.width, x, y);
      pixels.push({ x, y, color: [...data.subarray(pixelOffset, pixelOffset + 4)] });
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const key = `${x + dx},${y + dy}`;
        if (candidates.delete(key)) queue.push([x + dx, y + dy]);
      }
    }
    const minX = Math.min(...pixels.map((pixel) => pixel.x));
    const maxX = Math.max(...pixels.map((pixel) => pixel.x));
    const minY = Math.min(...pixels.map((pixel) => pixel.y));
    const maxY = Math.max(...pixels.map((pixel) => pixel.y));
    if (pixels.length < 2 || pixels.length > 6 || maxX - minX > 2 || maxY - minY > 2) continue;
    if (minX < 17 || maxX > 126 || minY < 17 || maxY > 117) continue;
    sprites.push(pixels.map((pixel) => ({
      x: pixel.x - minX, y: pixel.y - minY, color: pixel.color,
    })));
  }

  // Single pixels are present in the reference style but scarce in the small
  // canonical crop. Add them using its two existing highlight colours.
  sprites.push([{ x: 0, y: 0, color: [205, 223, 255, 255] }]);
  sprites.push([{ x: 0, y: 0, color: [236, 245, 250, 255] }]);
  return sprites;
}

async function main() {
  const sprites = await extractSprites();
  const data = Buffer.alloc(WIDTH * HEIGHT * 4);
  for (let index = 0; index < data.length; index += 4) data.set(BODY, index);

  const random = makeRandom(0x43525953);
  const placements = [];
  while (placements.length < 58) {
    const x = 10 + Math.floor(random() * (WIDTH - 20));
    const y = 10 + Math.floor(random() * (HEIGHT - 20));
    const minimumDistance = 17 + Math.floor(random() * 8);
    if (placements.some((point) => Math.hypot(point.x - x, point.y - y) < minimumDistance)) continue;
    placements.push({ x, y });
  }

  placements.forEach(({ x, y }, index) => {
    const useSingle = index % 5 === 0 || index % 7 === 0;
    const spriteIndex = useSingle
      ? sprites.length - 1 - (index % 2)
      : Math.floor(random() * Math.max(1, sprites.length - 2));
    const sprite = sprites[spriteIndex];
    for (const pixel of sprite) {
      pixel.color.forEach((value, channel) => {
        data[offset(WIDTH, x + pixel.x, y + pixel.y) + channel] = value;
      });
    }
  });

  await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
  await sharp(data, { raw: { width: WIDTH, height: HEIGHT, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(OUTPUT);
  console.log(`Generated editable ${WIDTH} x ${HEIGHT} surface master with ${sprites.length} source-derived motifs.`);
}

main();
