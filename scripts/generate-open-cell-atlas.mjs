/** Assemble opened-cell variants from the canonical blue L-panel atlas. */

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const MOTIF_DIR = path.join(ROOT, "public/assets/frostbound/motifs-v2");
const SOURCE = path.join(MOTIF_DIR, "l-panel-blue.png");
const SURFACE_MASTER = path.join(MOTIF_DIR, "open-surface-master-blue.png");
const OUTPUT_DIR = path.join(ROOT, "public/assets/frostbound/cell-autotile-v2");
const ATLAS_DIR = path.join(OUTPUT_DIR, "open-atlas");
const MANUAL_SHAPE_SOURCES = new Map([
  ["l-rotated", "cell-open-blue-l-rotated.png"],
  ["step", "cell-open-blue-step.png"],
]);
const SURFACE_ORIGINS = new Map([
  ["square", [4, 8]],
  ["wide", [32, 112]],
  ["tall", [120, 24]],
  ["l-rotated", [96, 16]],
  ["step", [40, 80]],
  ["mega-wide", [0, 64]],
  ["mega-tall", [64, 0]],
  ["mega-l", [0, 0]],
  ["mega-step", [32, 32]],
]);

const PARTS = [
  { id: "O1", name: "outer-tl", left: 0, top: 0, width: 32, height: 32 },
  { id: "O2", name: "top-edge", left: 24, top: 0, width: 24, height: 24 },
  { id: "O3", name: "outer-tr", left: 40, top: 0, width: 28, height: 32 },
  { id: "O4", name: "left-edge", left: 0, top: 28, width: 24, height: 56 },
  { id: "O5", name: "right-edge", left: 44, top: 28, width: 24, height: 48 },
  { id: "O6", name: "vertical-center", left: 20, top: 28, width: 28, height: 48 },
  { id: "O7", name: "inner-tr", left: 44, top: 68, width: 40, height: 40 },
  { id: "O8", name: "arm-top-edge", left: 72, top: 80, width: 44, height: 28 },
  { id: "O9", name: "outer-arm-tr", left: 112, top: 80, width: 32, height: 36 },
  { id: "O10", name: "arm-center", left: 72, top: 100, width: 40, height: 20 },
  { id: "O11", name: "outer-bl", left: 0, top: 108, width: 32, height: 32 },
  { id: "O12", name: "bottom-edge", left: 32, top: 116, width: 80, height: 24 },
  { id: "O13", name: "outer-br", left: 112, top: 108, width: 32, height: 32 },
  { id: "O14", name: "detail-surface", left: 20, top: 36, width: 28, height: 32 },
];

const SHAPES = [
  {
    name: "square", width: 128, height: 128,
    inside: (x, y) => x >= 0 && x < 128 && y >= 0 && y < 128,
    top: [[0, 128, 0]], bottom: [[0, 128, 128]], left: [[0, 128, 0]], right: [[0, 128, 128]],
    corners: [["tl", 0, 0], ["tr", 128, 0], ["br", 128, 128], ["bl", 0, 128]],
  },
  {
    name: "wide", width: 192, height: 128,
    inside: (x, y) => x >= 0 && x < 192 && y >= 0 && y < 128,
    top: [[0, 192, 0]], bottom: [[0, 192, 128]], left: [[0, 128, 0]], right: [[0, 128, 192]],
    corners: [["tl", 0, 0], ["tr", 192, 0], ["br", 192, 128], ["bl", 0, 128]],
  },
  {
    name: "tall", width: 128, height: 192,
    inside: (x, y) => x >= 0 && x < 128 && y >= 0 && y < 192,
    top: [[0, 128, 0]], bottom: [[0, 128, 192]], left: [[0, 192, 0]], right: [[0, 192, 128]],
    corners: [["tl", 0, 0], ["tr", 128, 0], ["br", 128, 192], ["bl", 0, 192]],
  },
  { name: "l", width: 144, height: 140, canonical: true },
  {
    name: "l-rotated", width: 144, height: 140,
    inside: (x, y) => x >= 0 && x < 144 && y >= 0 && y < 140 && (y < 60 || x >= 76),
    top: [[0, 144, 0]], bottom: [[0, 76, 60], [76, 144, 140]],
    left: [[0, 60, 0], [60, 140, 76]], right: [[0, 140, 144]],
    corners: [["tl", 0, 0], ["tr", 144, 0], ["br", 144, 140], ["bl", 76, 140], ["bl", 0, 60]],
    innerCorners: [["bl", 76, 60]],
  },
  {
    name: "step", width: 192, height: 140,
    inside: (x, y) => x >= 0 && x < 192 && y >= 0 && y < 140
      && ((x < 128 && y < 92) || (x >= 64 && y >= 48)),
    top: [[0, 128, 0], [128, 192, 48]], bottom: [[0, 64, 92], [64, 192, 140]],
    left: [[0, 92, 0], [92, 140, 64]], right: [[0, 48, 128], [48, 140, 192]],
    corners: [["tl", 0, 0], ["tr", 128, 0], ["tr", 192, 48], ["br", 192, 140], ["bl", 64, 140], ["bl", 0, 92]],
    innerCorners: [["tr", 128, 48], ["bl", 64, 92]],
  },
  {
    name: "mega-wide", width: 320, height: 160,
    inside: (x, y) => x >= 0 && x < 320 && y >= 0 && y < 160,
    top: [[0, 320, 0]], bottom: [[0, 320, 160]], left: [[0, 160, 0]], right: [[0, 160, 320]],
    corners: [["tl", 0, 0], ["tr", 320, 0], ["br", 320, 160], ["bl", 0, 160]],
  },
  {
    name: "mega-tall", width: 160, height: 320,
    inside: (x, y) => x >= 0 && x < 160 && y >= 0 && y < 320,
    top: [[0, 160, 0]], bottom: [[0, 160, 320]], left: [[0, 320, 0]], right: [[0, 320, 160]],
    corners: [["tl", 0, 0], ["tr", 160, 0], ["br", 160, 320], ["bl", 0, 320]],
  },
  {
    name: "mega-l", width: 288, height: 288,
    inside: (x, y) => x >= 0 && x < 288 && y >= 0 && y < 288 && (x < 160 || y >= 144),
    top: [[0, 160, 0], [160, 288, 144]], bottom: [[0, 288, 288]],
    left: [[0, 288, 0]], right: [[0, 144, 160], [144, 288, 288]],
    corners: [["tl", 0, 0], ["tr", 160, 0], ["tr", 288, 144], ["br", 288, 288], ["bl", 0, 288]],
    innerCorners: [["tr", 160, 144]],
  },
  {
    name: "mega-step", width: 320, height: 256,
    inside: (x, y) => x >= 0 && x < 320 && y >= 0 && y < 256
      && ((x < 192 && y < 160) || (x >= 96 && y >= 96)),
    top: [[0, 192, 0], [192, 320, 96]], bottom: [[0, 96, 160], [96, 320, 256]],
    left: [[0, 160, 0], [160, 256, 96]], right: [[0, 96, 192], [96, 256, 320]],
    corners: [["tl", 0, 0], ["tr", 192, 0], ["tr", 320, 96], ["br", 320, 256], ["bl", 96, 256], ["bl", 0, 160]],
    innerCorners: [["tr", 192, 96], ["bl", 96, 160]],
  },
];

const COLOR_MAPS = {
  red: new Map([
    ["150,186,249", [239, 80, 104]], ["25,87,210", [186, 13, 1]],
    ["114,167,239", [255, 154, 170]], ["236,245,250", [236, 245, 250]],
    ["74,128,231", [214, 85, 68]], ["205,223,255", [255, 208, 216]],
    ["176,204,255", [255, 113, 135]], ["22,63,119", [186, 13, 1]],
  ]),
  purple: new Map([
    ["150,186,249", [195, 112, 197]], ["25,87,210", [153, 38, 158]],
    ["114,167,239", [218, 161, 222]], ["236,245,250", [236, 245, 250]],
    ["74,128,231", [181, 91, 185]], ["205,223,255", [230, 186, 231]],
    ["176,204,255", [207, 140, 208]], ["22,63,119", [104, 30, 122]],
  ]),
};

function offset(width, x, y) { return (y * width + x) * 4; }

function copyPixel(target, targetWidth, x, y, source, sourceWidth, sx, sy) {
  const sourceOffset = offset(sourceWidth, sx, sy);
  source.copy(target, offset(targetWidth, x, y), sourceOffset, sourceOffset + 4);
}

function tilePart(target, shape, part, x, y, width, height, clipToShape = true) {
  for (let dy = 0; dy < height; dy += 1) for (let dx = 0; dx < width; dx += 1) {
    const tx = x + dx; const ty = y + dy;
    if (tx < 0 || ty < 0 || tx >= shape.width || ty >= shape.height) continue;
    if (clipToShape && !shape.inside(tx, ty)) continue;
    copyPixel(target, shape.width, tx, ty, part.data, part.width, dx % part.width, dy % part.height);
  }
}

function placeCorner(target, shape, parts, type, x, y) {
  const config = {
    tl: ["O1", x, y], tr: ["O3", x - 28, y],
    bl: ["O11", x, y - 32], br: ["O13", x - 32, y - 32],
  }[type];
  const part = parts.get(config[0]);
  tilePart(target, shape, part, config[1], config[2], part.width, part.height);
}

function placeInnerCorner(target, shape, parts, type, x, y) {
  const part = parts.get(type === "tr" ? "O7" : "O15");
  const targetX = type === "tr" ? x - 24 : x - 16;
  const targetY = type === "tr" ? y - 12 : y - 28;
  tilePart(target, shape, part, targetX, targetY, part.width, part.height, false);
}

function fillSurface(target, shape, surface) {
  const [originX, originY] = SURFACE_ORIGINS.get(shape.name) ?? [0, 0];
  for (let y = 0; y < shape.height; y += 1) for (let x = 0; x < shape.width; x += 1) {
    if (!shape.inside(x, y)) continue;
    const tileX = Math.floor(x / surface.width);
    const tileY = Math.floor(y / surface.height);
    copyPixel(
      target,
      shape.width,
      x,
      y,
      surface.data,
      surface.width,
      (originX + x + tileY * 73) % surface.width,
      (originY + y + tileX * 61) % surface.height,
    );
  }
}

function replaceManualInterior(image, shape, surface, clearance = 10) {
  const data = Buffer.from(image.data);
  const [originX, originY] = SURFACE_ORIGINS.get(shape.name) ?? [0, 0];
  const isOpaque = (x, y) => x >= 0 && y >= 0 && x < image.width && y < image.height
    && image.data[offset(image.width, x, y) + 3] !== 0;

  for (let y = 0; y < image.height; y += 1) for (let x = 0; x < image.width; x += 1) {
    if (!isOpaque(x, y)) continue;
    let protectedEdge = false;
    for (let distance = 1; distance <= clearance && !protectedEdge; distance += 1) {
      if (!isOpaque(x + distance, y) || !isOpaque(x - distance, y)
        || !isOpaque(x, y + distance) || !isOpaque(x, y - distance)) protectedEdge = true;
    }
    if (protectedEdge) continue;
    copyPixel(
      data,
      image.width,
      x,
      y,
      surface.data,
      surface.width,
      originX + x,
      originY + y,
    );
  }
  return { ...image, data };
}

function render(shape, parts, surface) {
  const target = Buffer.alloc(shape.width * shape.height * 4);
  fillSurface(target, shape, surface);
  for (const [start, end, y] of shape.top) tilePart(target, shape, parts.get("O16"), start, y, end - start, 13);
  for (const [start, end, y] of shape.bottom) tilePart(target, shape, parts.get("O12"), start, y - 24, end - start, 24);
  for (const [start, end, x] of shape.left) tilePart(target, shape, parts.get("O4"), x, start, 24, end - start);
  for (const [start, end, x] of shape.right) tilePart(target, shape, parts.get("O5"), x - 24, start, 24, end - start);
  for (const [type, x, y] of shape.corners) placeCorner(target, shape, parts, type, x, y);
  for (const [type, x, y] of shape.innerCorners ?? []) placeInnerCorner(target, shape, parts, type, x, y);
  return { data: target, width: shape.width, height: shape.height };
}

function recolor(image, colorMap) {
  const data = Buffer.from(image.data);
  for (let index = 0; index < data.length; index += 4) {
    if (!data[index + 3]) continue;
    const target = colorMap.get(`${data[index]},${data[index + 1]},${data[index + 2]}`);
    if (!target) continue;
    data[index] = target[0]; data[index + 1] = target[1]; data[index + 2] = target[2];
  }
  return { ...image, data };
}

async function writePng(filePath, image) {
  await sharp(image.data, { raw: { width: image.width, height: image.height, channels: 4 } })
    .png({ compressionLevel: 9 }).toFile(filePath);
}

async function makeReview(outputs) {
  const columns = 6; const cardWidth = 240; const cardHeight = 250;
  const width = columns * cardWidth; const height = Math.ceil(outputs.length / columns) * cardHeight + 90;
  const cards = await Promise.all(outputs.map(async ({ color, shape, filePath }, index) => {
    const encoded = (await fs.readFile(filePath)).toString("base64");
    const column = index % columns; const row = Math.floor(index / columns);
    const x = column * cardWidth + 20; const y = row * cardHeight + 110;
    const scale = Math.min(1, 190 / shape.width, 190 / shape.height);
    return `<text x="${x}" y="${y - 18}" class="label">${color} · ${shape.name}</text>
      <image href="data:image/png;base64,${encoded}" x="${x}" y="${y}" width="${shape.width * scale}" height="${shape.height * scale}" image-rendering="pixelated"/>`;
  }));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <style>.title{font:28px sans-serif;fill:#f4f8ff}.sub{font:15px sans-serif;fill:#b8cbe8}.label{font:700 16px sans-serif;fill:#e5efff}</style>
    <rect width="100%" height="100%" fill="#172a49"/><text x="28" y="40" class="title">OPEN CELL — EXPLICIT ATLAS ASSEMBLY</text>
    <text x="28" y="66" class="sub">O1–O16 · canonical blue L preserved · directional lighting · source palettes</text>${cards.join("\n")}</svg>`;
  await sharp(Buffer.from(svg)).png().toFile(path.join(OUTPUT_DIR, "open-comparison.png"));
}

async function main() {
  await fs.mkdir(ATLAS_DIR, { recursive: true });
  const parts = new Map();
  for (const definition of PARTS) {
    const { data, info } = await sharp(SOURCE).extract(definition).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const part = { ...definition, data, width: info.width, height: info.height };
    parts.set(definition.id, part);
    await writePng(path.join(ATLAS_DIR, `${definition.id}-${definition.name}.png`), part);
  }
  const topEdge = parts.get("O2");
  const { data: topStructureData, info: topStructureInfo } = await sharp(topEdge.data, {
    raw: { width: topEdge.width, height: topEdge.height, channels: 4 },
  })
    .extract({ left: 0, top: 0, width: topEdge.width, height: 13 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const topStructure = {
    id: "O16", name: "top-structure", data: topStructureData,
    width: topStructureInfo.width, height: topStructureInfo.height,
  };
  parts.set(topStructure.id, topStructure);
  await writePng(
    path.join(ATLAS_DIR, `${topStructure.id}-${topStructure.name}.png`),
    topStructure,
  );
  const { data: innerBlData, info: innerBlInfo } = await sharp(
    path.join(MOTIF_DIR, MANUAL_SHAPE_SOURCES.get("l-rotated")),
  )
    .extract({ left: 60, top: 32, width: 40, height: 40 })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const innerBl = {
    id: "O15", name: "inner-bl", data: innerBlData,
    width: innerBlInfo.width, height: innerBlInfo.height,
  };
  parts.set(innerBl.id, innerBl);
  await writePng(path.join(ATLAS_DIR, `${innerBl.id}-${innerBl.name}.png`), innerBl);

  const blue = new Map();
  const canonical = await sharp(SOURCE).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const surfaceRaw = await sharp(SURFACE_MASTER).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const surface = {
    data: surfaceRaw.data, width: surfaceRaw.info.width, height: surfaceRaw.info.height,
  };
  for (const shape of SHAPES) {
    const manualSource = MANUAL_SHAPE_SOURCES.get(shape.name);
    if (manualSource) {
      const manual = await sharp(path.join(MOTIF_DIR, manualSource))
        .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const manualImage = {
        data: manual.data, width: manual.info.width, height: manual.info.height,
      };
      blue.set(
        shape.name,
        shape.name === "l-rotated" || shape.name === "step"
          ? replaceManualInterior(manualImage, shape, surface)
          : manualImage,
      );
    } else {
      blue.set(shape.name, shape.canonical
        ? { data: canonical.data, width: canonical.info.width, height: canonical.info.height }
        : render(shape, parts, surface));
    }
  }

  const outputs = [];
  for (const color of ["blue", "red", "purple"]) for (const shape of SHAPES) {
    const image = color === "blue" ? blue.get(shape.name) : recolor(blue.get(shape.name), COLOR_MAPS[color]);
    const filePath = path.join(OUTPUT_DIR, `open-${color}-${shape.name}.png`);
    await writePng(filePath, image); outputs.push({ color, shape, filePath });
  }
  await makeReview(outputs);
  console.log(`Generated ${parts.size} open atlas parts and ${outputs.length} opened-cell variants.`);
}

main();
