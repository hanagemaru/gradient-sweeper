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

const OPEN_PALETTES = {
  blue: {
    edge: COLOR.snow,
    edgeInner: COLOR.iceLight,
    highlight: COLOR.ice,
    body: COLOR.ice,
    inner: COLOR.blueBody,
    mid: COLOR.blueMid,
    dark: COLOR.blueDark,
  },
  red: {
    edge: COLOR.snow,
    edgeInner: [255, 208, 216, 255],
    highlight: [255, 154, 170, 255],
    body: [239, 80, 104, 255],
    inner: [255, 113, 135, 255],
    mid: [214, 85, 68, 255],
    dark: [186, 13, 1, 255],
  },
  purple: {
    edge: COLOR.snow,
    edgeInner: [230, 186, 231, 255],
    highlight: [218, 161, 222, 255],
    body: [195, 112, 197, 255],
    inner: [207, 140, 208, 255],
    mid: [181, 91, 185, 255],
    dark: [153, 38, 158, 255],
  },
};

const SHAPES = [
  { name: "square", grid: ["1"], unit: 119, radius: 18, seed: 101 },
  { name: "wide", grid: ["111", "111"], seed: 113 },
  { name: "tall", grid: ["11", "11", "11"], seed: 127 },
  { name: "l", grid: ["110", "110", "111"], seed: 139 },
  { name: "l-rotated", grid: ["111", "011", "011"], seed: 145 },
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

function makeShape(shape) {
  const { grid } = shape;
  const unit = shape.unit ?? UNIT;
  const radius = shape.radius ?? RADIUS;
  const rows = grid.length;
  const columns = Math.max(...grid.map((row) => row.length));
  const raw = (x, y) => {
    const localX = x - PAD;
    const localY = y - PAD;
    if (localX < 0 || localY < 0) return false;
    const column = Math.floor(localX / unit);
    const row = Math.floor(localY / unit);
    return row < rows && column < columns && grid[row]?.[column] === "1";
  };
  const inside = (x, y) => raw(x, y) && !roundedOut(raw, x, y, radius);
  return {
    inside,
    width: columns * unit + PAD + 6,
    height: rows * unit + PAD + 6,
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

async function extractSnowDepthProfile() {
  const source = path.join(MOTIF_DIR, "cell-covered-large.png");
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const snowKeys = new Set([
    COLOR.snow,
    COLOR.snowLight,
    COLOR.snowMid,
    COLOR.iceLight,
    COLOR.ice,
  ].map((color) => color.join(",")));
  const profile = [];

  for (let x = 14; x < info.width - 14; x += 1) {
    let bottomOpaque = -1;
    let bottomSnow = -1;
    for (let y = 0; y < info.height; y += 1) {
      const offset = (y * info.width + x) * 4;
      if (data[offset + 3] === 0) continue;
      bottomOpaque = y;
      if (snowKeys.has(colorKey(data, offset))) bottomSnow = y;
    }
    const depth = bottomOpaque - bottomSnow;
    if (bottomSnow >= 0 && depth >= 8 && depth <= 30) profile.push(depth);
  }

  return profile;
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
  const startIndex = Math.floor(random() * stamps.length);

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const stamp = stamps[(startIndex + attempt) % stamps.length];
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

function renderOpen(shape, stamps, palette) {
  const { inside, width, height } = makeShape(shape);
  const buffer = Buffer.alloc(width * height * 4);

  drawShiftedShape(buffer, width, height, inside, 2, 7, palette.dark);
  drawShiftedShape(buffer, width, height, inside, 1, 4, palette.mid);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!inside(x, y)) continue;
      const openUp = !inside(x, y - 1);
      const openLeft = !inside(x - 1, y);
      const openDown = !inside(x, y + 1);
      const openRight = !inside(x + 1, y);
      const distance = distanceToOutside(inside, x, y, 4);
      let color = palette.body;
      if (openUp || openLeft) color = palette.edge;
      else if (openDown || openRight) color = palette.dark;
      else if (!inside(x, y - 2) || !inside(x - 2, y)) color = palette.edgeInner;
      else if (!inside(x, y + 2) || !inside(x + 2, y)) color = palette.mid;
      else if (distance === 2) color = palette.inner;
      setPixel(buffer, width, x, y, color);
    }
  }

  stampTexture({ buffer, width, height, inside, stamps, seed: shape.seed + 500, rate: 0.001 });
  return { buffer, width, height };
}

function renderCovered(shape, stamps, snowDepthProfile) {
  const { inside, width, height } = makeShape(shape);
  const buffer = Buffer.alloc(width * height * 4);
  const random = makeRandom(shape.seed);
  const bottomAtX = new Int16Array(width).fill(-1);

  for (let x = 0; x < width; x += 1) {
    for (let y = height - 1; y >= 0; y -= 1) {
      if (inside(x, y)) { bottomAtX[x] = y; break; }
    }
  }

  const snowDepth = Array.from({ length: width }, (_, x) =>
    snowDepthProfile[(x + shape.seed) % snowDepthProfile.length],
  );
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

function paletteMap(palette) {
  return new Map([
    [COLOR.snow.join(","), palette.edge],
    [COLOR.snowLight.join(","), palette.edgeInner],
    [COLOR.snowMid.join(","), palette.highlight],
    [COLOR.iceLight.join(","), palette.edgeInner],
    [COLOR.ice.join(","), palette.body],
    [COLOR.blueBody.join(","), palette.inner],
    [COLOR.blueMid.join(","), palette.mid],
    [COLOR.blueDark.join(","), palette.dark],
    ["22,63,119,255", palette.dark],
  ]);
}

async function writeCanonicalOpenL(paletteName, palette) {
  const source = path.join(MOTIF_DIR, "l-panel-blue.png");
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const result = Buffer.from(data);
  const replacements = paletteMap(palette);

  if (paletteName !== "blue") {
    for (let offset = 0; offset < result.length; offset += 4) {
      const replacement = replacements.get(colorKey(result, offset));
      if (replacement) result.set(replacement, offset);
    }
  }

  const image = sharp(result, { raw: info });
  await image.clone().png({ compressionLevel: 9, palette: true, colours: 32 })
    .toFile(path.join(OUTPUT_DIR, `open-${paletteName}-l.png`));
  await image.clone().rotate(180).png({ compressionLevel: 9, palette: true, colours: 32 })
    .toFile(path.join(OUTPUT_DIR, `open-${paletteName}-l-rotated.png`));
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const coveredSource = path.join(MOTIF_DIR, "cell-covered-large.png");
  const coveredStamps = await extractStamps(
    "cell-covered-large.png",
    { left: 16, top: 14, right: 112, bottom: 94 },
    COLOR.snow,
  );
  const snowDepthProfile = await extractSnowDepthProfile();
  const openSources = {
    blue: { file: "l-panel-blue.png", bounds: { left: 18, top: 18, right: 82, bottom: 76 } },
    red: { file: "cell-open-red.png", bounds: { left: 20, top: 20, right: 84, bottom: 78 } },
    purple: { file: "cell-open-purple-wide.png", bounds: { left: 22, top: 20, right: 106, bottom: 76 } },
  };

  for (const shape of SHAPES) {
    if (shape.name === "square") {
      await fs.copyFile(coveredSource, path.join(OUTPUT_DIR, "covered-square.png"));
    } else {
      const covered = renderCovered(shape, coveredStamps, snowDepthProfile);
      await writeImage(`covered-${shape.name}`, covered);
    }
  }

  for (const [paletteName, palette] of Object.entries(OPEN_PALETTES)) {
    const source = openSources[paletteName];
    const openStamps = await extractStamps(source.file, source.bounds, palette.body, 1);
    for (const shape of SHAPES) {
      if (shape.name === "l" || shape.name === "l-rotated") continue;
      await writeImage(`open-${paletteName}-${shape.name}`, renderOpen(shape, openStamps, palette));
    }
    await writeCanonicalOpenL(paletteName, palette);
    console.log(`${paletteName.padEnd(7)} stamps ${openStamps.length}`);
  }

  console.log(`covered stamps ${coveredStamps.length}, snow profile ${snowDepthProfile.length}`);
}

main();
