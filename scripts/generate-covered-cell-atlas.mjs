/**
 * Build covered-cell variants from explicit, native-resolution atlas parts.
 *
 * The canonical 128 x 128 square is cut into C1-C9. Variants are assembled
 * only by cropping, repeating, clipping, and compositing those pixels. No new
 * outlines, shadows, colours, rotations, or procedurally drawn details are
 * introduced.
 */

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const MOTIF_DIR = path.join(ROOT, "public/assets/frostbound/motifs-v2");
const SOURCE = path.join(MOTIF_DIR, "cell-covered-large.png");
const OUTPUT_DIR = path.join(
  ROOT,
  "public/assets/frostbound/cell-autotile-v2",
);
const ATLAS_DIR = path.join(OUTPUT_DIR, "covered-atlas");
const MANUAL_SHAPE_SOURCES = new Map([
  ["l", "cell-covered-l.png"],
  ["l-rotated", "cell-covered-l-rotated.png"],
]);

const PARTS = [
  { id: "C1", name: "outer-tl", left: 0, top: 0, width: 32, height: 32 },
  { id: "C2", name: "top-edge", left: 32, top: 0, width: 64, height: 32 },
  { id: "C3", name: "outer-tr", left: 96, top: 0, width: 32, height: 32 },
  { id: "C4", name: "left-edge", left: 0, top: 32, width: 32, height: 56 },
  { id: "C5", name: "center-texture", left: 32, top: 32, width: 64, height: 56 },
  { id: "C6", name: "right-edge", left: 96, top: 32, width: 32, height: 56 },
  { id: "C7", name: "snowfront-left", left: 0, top: 88, width: 32, height: 40 },
  { id: "C8", name: "snowfront-center", left: 32, top: 88, width: 64, height: 40 },
  { id: "C9", name: "snowfront-right", left: 96, top: 88, width: 32, height: 40 },
];

const SHAPES = [
  {
    name: "square",
    width: 128,
    height: 128,
    inside: (x, y) => x >= 0 && x < 128 && y >= 0 && y < 128,
    top: [[0, 128, 0]], bottom: [[0, 128, 128]],
    left: [[0, 128, 0]], right: [[0, 128, 128]],
    corners: [["tl", 0, 0], ["tr", 128, 0], ["br", 128, 128], ["bl", 0, 128]],
  },
  {
    name: "wide",
    width: 192,
    height: 128,
    inside: (x, y) => x >= 0 && x < 192 && y >= 0 && y < 128,
    top: [[0, 192, 0]], bottom: [[0, 192, 128]],
    left: [[0, 128, 0]], right: [[0, 128, 192]],
    corners: [["tl", 0, 0], ["tr", 192, 0], ["br", 192, 128], ["bl", 0, 128]],
  },
  {
    name: "tall",
    width: 128,
    height: 192,
    inside: (x, y) => x >= 0 && x < 128 && y >= 0 && y < 192,
    top: [[0, 128, 0]], bottom: [[0, 128, 192]],
    left: [[0, 192, 0]], right: [[0, 192, 128]],
    corners: [["tl", 0, 0], ["tr", 128, 0], ["br", 128, 192], ["bl", 0, 192]],
  },
  {
    name: "l",
    width: 192,
    height: 192,
    inside: (x, y) => x >= 0 && x < 192 && y >= 0 && y < 192 && (x < 128 || y >= 96),
    top: [[0, 128, 0], [128, 192, 96]],
    bottom: [[0, 192, 192]],
    left: [[0, 192, 0]],
    right: [[0, 96, 128], [96, 192, 192]],
    corners: [["tl", 0, 0], ["tr", 128, 0], ["tr", 192, 96], ["br", 192, 192], ["bl", 0, 192]],
    innerCorners: [["tr", 128, 96]],
  },
  {
    name: "l-rotated",
    width: 192,
    height: 192,
    inside: (x, y) => x >= 0 && x < 192 && y >= 0 && y < 192 && (y < 96 || x >= 64),
    top: [[0, 192, 0]],
    bottom: [[0, 64, 96], [64, 192, 192]],
    left: [[0, 96, 0], [96, 192, 64]],
    right: [[0, 192, 192]],
    corners: [["tl", 0, 0], ["tr", 192, 0], ["br", 192, 192], ["bl", 64, 192], ["bl", 0, 96]],
    innerCorners: [["bl", 64, 96]],
  },
  {
    name: "step",
    width: 192,
    height: 192,
    inside: (x, y) => x >= 0 && x < 192 && y >= 0 && y < 192
      && ((x < 128 && y < 128) || (x >= 64 && y >= 64)),
    top: [[0, 128, 0], [128, 192, 64]],
    bottom: [[0, 64, 128], [64, 192, 192]],
    left: [[0, 128, 0], [128, 192, 64]],
    right: [[0, 64, 128], [64, 192, 192]],
    corners: [["tl", 0, 0], ["tr", 128, 0], ["tr", 192, 64], ["br", 192, 192], ["bl", 64, 192], ["bl", 0, 128]],
    innerCorners: [["tr", 128, 64], ["bl", 64, 128]],
  },
  {
    name: "mega-wide",
    width: 320,
    height: 160,
    inside: (x, y) => x >= 0 && x < 320 && y >= 0 && y < 160,
    top: [[0, 320, 0]], bottom: [[0, 320, 160]],
    left: [[0, 160, 0]], right: [[0, 160, 320]],
    corners: [["tl", 0, 0], ["tr", 320, 0], ["br", 320, 160], ["bl", 0, 160]],
  },
  {
    name: "mega-tall",
    width: 160,
    height: 320,
    inside: (x, y) => x >= 0 && x < 160 && y >= 0 && y < 320,
    top: [[0, 160, 0]], bottom: [[0, 160, 320]],
    left: [[0, 320, 0]], right: [[0, 320, 160]],
    corners: [["tl", 0, 0], ["tr", 160, 0], ["br", 160, 320], ["bl", 0, 320]],
  },
  {
    name: "mega-l",
    width: 288,
    height: 288,
    inside: (x, y) => x >= 0 && x < 288 && y >= 0 && y < 288 && (x < 160 || y >= 144),
    top: [[0, 160, 0], [160, 288, 144]],
    bottom: [[0, 288, 288]],
    left: [[0, 288, 0]],
    right: [[0, 144, 160], [144, 288, 288]],
    corners: [["tl", 0, 0], ["tr", 160, 0], ["tr", 288, 144], ["br", 288, 288], ["bl", 0, 288]],
    innerCorners: [["tr", 160, 144]],
  },
  {
    name: "mega-step",
    width: 320,
    height: 256,
    inside: (x, y) => x >= 0 && x < 320 && y >= 0 && y < 256
      && ((x < 192 && y < 160) || (x >= 96 && y >= 96)),
    top: [[0, 192, 0], [192, 320, 96]],
    bottom: [[0, 96, 160], [96, 320, 256]],
    left: [[0, 160, 0], [160, 256, 96]],
    right: [[0, 96, 192], [96, 256, 320]],
    corners: [["tl", 0, 0], ["tr", 192, 0], ["tr", 320, 96], ["br", 320, 256], ["bl", 96, 256], ["bl", 0, 160]],
    innerCorners: [["tr", 192, 96], ["bl", 96, 160]],
  },
];

function offset(width, x, y) {
  return (y * width + x) * 4;
}

function copyPixel(target, targetWidth, x, y, source, sourceWidth, sx, sy) {
  const sourceOffset = offset(sourceWidth, sx, sy);
  source.copy(target, offset(targetWidth, x, y), sourceOffset, sourceOffset + 4);
}

function tilePart(target, shape, part, x, y, width, height) {
  for (let dy = 0; dy < height; dy += 1) {
    for (let dx = 0; dx < width; dx += 1) {
      const tx = x + dx;
      const ty = y + dy;
      if (tx < 0 || ty < 0 || tx >= shape.width || ty >= shape.height || !shape.inside(tx, ty)) continue;
      copyPixel(
        target,
        shape.width,
        tx,
        ty,
        part.data,
        part.width,
        dx % part.width,
        dy % part.height,
      );
    }
  }
}

function placeCorner(target, shape, parts, type, x, y) {
  const config = {
    tl: ["C1", x, y],
    tr: ["C3", x - 32, y],
    bl: ["C7", x, y - 40],
    br: ["C9", x - 32, y - 40],
  }[type];
  const part = parts.get(config[0]);
  tilePart(target, shape, part, config[1], config[2], part.width, part.height);
}

function placeInnerCorner(target, shape, parts, type, x, y) {
  const part = parts.get(type === "tr" ? "C10" : "C11");
  const halfWidth = Math.floor(part.width / 2);
  const halfHeight = Math.floor(part.height / 2);
  const targetX = x - halfWidth;
  const targetY = y - halfHeight;

  for (let dy = 0; dy < part.height; dy += 1) {
    for (let dx = 0; dx < part.width; dx += 1) {
      const tx = targetX + dx;
      const ty = targetY + dy;
      if (tx < 0 || ty < 0 || tx >= shape.width || ty >= shape.height) continue;
      const sourceOffset = offset(part.width, dx, dy);
      part.data.copy(
        target,
        offset(shape.width, tx, ty),
        sourceOffset,
        sourceOffset + 4,
      );
    }
  }
}

function renderShape(shape, parts) {
  const target = Buffer.alloc(shape.width * shape.height * 4);
  const center = parts.get("C5");

  if (shape.width >= 512 || shape.height >= 512) {
    for (let y = 0; y < shape.height; y += 1) {
      for (let x = 0; x < shape.width; x += 1) {
        if (!shape.inside(x, y)) continue;
        const tileX = Math.floor(x / center.width);
        const tileY = Math.floor(y / center.height);
        copyPixel(
          target,
          shape.width,
          x,
          y,
          center.data,
          center.width,
          (x + tileY * 17) % center.width,
          (y + tileX * 13) % center.height,
        );
      }
    }
  } else {
    tilePart(target, shape, center, 0, 0, shape.width, shape.height);
  }

  for (const [start, end, y] of shape.top) {
    tilePart(target, shape, parts.get("C2"), start, y, end - start, 32);
  }
  for (const [start, end, y] of shape.bottom) {
    tilePart(target, shape, parts.get("C8"), start, y - 40, end - start, 40);
  }
  for (const [start, end, x] of shape.left) {
    tilePart(target, shape, parts.get("C4"), x, start, 32, end - start);
  }
  for (const [start, end, x] of shape.right) {
    tilePart(target, shape, parts.get("C6"), x - 32, start, 32, end - start);
  }
  for (const [type, x, y] of shape.corners) {
    placeCorner(target, shape, parts, type, x, y);
  }
  for (const [type, x, y] of shape.innerCorners ?? []) {
    placeInnerCorner(target, shape, parts, type, x, y);
  }

  return target;
}

async function writePng(filePath, data, width, height) {
  await sharp(data, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(filePath);
}

async function makeReview(shapes) {
  const gap = 32;
  const columns = 3;
  const cardWidth = 420;
  const cardHeight = 700;
  const rows = Math.ceil(shapes.length / columns);
  const width = columns * cardWidth;
  const height = rows * cardHeight + 90;
  const cards = await Promise.all(shapes.map(async (shape, index) => {
    const filePath = path.join(OUTPUT_DIR, `covered-${shape.name}.png`);
    const encoded = (await fs.readFile(filePath)).toString("base64");
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = column * cardWidth + gap;
    const y = row * cardHeight + 96;
    const scale = Math.min(2, (cardWidth - gap * 2) / shape.width, (cardHeight - 140) / shape.height);
    return `<text x="${x}" y="${y - 18}" class="label">${shape.name} · ${shape.width} × ${shape.height}px</text>
      <image href="data:image/png;base64,${encoded}" x="${x}" y="${y}" width="${shape.width * scale}" height="${shape.height * scale}" image-rendering="pixelated"/>`;
  }));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <style>.title{font:28px sans-serif;fill:#f4f8ff}.sub{font:15px sans-serif;fill:#b8cbe8}.label{font:700 17px sans-serif;fill:#e5efff}</style>
    <rect width="100%" height="100%" fill="#172a49"/>
    <text x="32" y="42" class="title">COVERED CELL — EXPLICIT ATLAS ASSEMBLY</text>
    <text x="32" y="68" class="sub">C1–C9 only · native pixels · fixed lighting · no generated outlines or shadows</text>
    ${cards.join("\n")}
  </svg>`;
  await sharp(Buffer.from(svg)).png().toFile(path.join(OUTPUT_DIR, "covered-comparison.png"));
}

async function main() {
  await fs.mkdir(ATLAS_DIR, { recursive: true });
  const parts = new Map();

  for (const definition of PARTS) {
    const { data, info } = await sharp(SOURCE)
      .extract(definition)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const part = { ...definition, data, width: info.width, height: info.height };
    parts.set(definition.id, part);
    await writePng(
      path.join(ATLAS_DIR, `${definition.id}-${definition.name}.png`),
      data,
      info.width,
      info.height,
    );
  }

  const innerDefinitions = [
    {
      id: "C10", name: "inner-tr", source: "cell-covered-l.png",
      left: 104, top: 72, width: 48, height: 48,
    },
    {
      id: "C11", name: "inner-bl", source: "cell-covered-l-rotated.png",
      left: 40, top: 72, width: 48, height: 48,
    },
  ];
  for (const definition of innerDefinitions) {
    const { data, info } = await sharp(path.join(MOTIF_DIR, definition.source))
      .extract(definition)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const part = { ...definition, data, width: info.width, height: info.height };
    parts.set(definition.id, part);
    await writePng(
      path.join(ATLAS_DIR, `${definition.id}-${definition.name}.png`),
      part.data,
      part.width,
      part.height,
    );
  }

  for (const shape of SHAPES) {
    const manualSource = MANUAL_SHAPE_SOURCES.get(shape.name);
    if (manualSource) {
      await fs.copyFile(
        path.join(MOTIF_DIR, manualSource),
        path.join(OUTPUT_DIR, `covered-${shape.name}.png`),
      );
      continue;
    }
    if (shape.name === "square") {
      await fs.copyFile(SOURCE, path.join(OUTPUT_DIR, "covered-square.png"));
      continue;
    }
    await writePng(
      path.join(OUTPUT_DIR, `covered-${shape.name}.png`),
      renderShape(shape, parts),
      shape.width,
      shape.height,
    );
  }

  await makeReview(SHAPES);
  console.log(`Generated ${parts.size} atlas parts and ${SHAPES.length} covered shapes.`);
}

main();
