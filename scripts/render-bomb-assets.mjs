import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const ASSET_ROOT = path.join(ROOT, "public/assets/frostbound/bombs-v1");
const CANVAS_SIZE = 36;
const EXPECTED_BOUNDS = { left: 6, top: 6, width: 24, height: 24 };
const COLORS = ["red", "blue"];

for (const color of COLORS) {
  const sourcePath = path.join(ASSET_ROOT, "source", `bomb-${color}.svg`);
  const outputPath = path.join(ASSET_ROOT, `bomb-${color}.png`);
  const svg = await readFile(sourcePath);
  const source = svg.toString("utf8");

  const expectedHeader = 'width="36" height="36" viewBox="0 0 36 36"';
  if (!source.includes(expectedHeader) || !source.includes('shape-rendering="crispEdges"')) {
    throw new Error(`${color}: SVG canvas or crisp-edge declaration is invalid`);
  }

  const pathData = [...source.matchAll(/ d="([^"]+)"/g)].map((match) => match[1]);
  if (pathData.some((data) => /\d+\.\d+/.test(data))) {
    throw new Error(`${color}: fractional path coordinates found`);
  }

  await sharp(svg, { density: 72 })
    .png({ palette: false, compressionLevel: 9 })
    .toFile(outputPath);

  const { data, info } = await sharp(outputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (info.width !== CANVAS_SIZE || info.height !== CANVAS_SIZE) {
    throw new Error(`${color}: expected 36x36, got ${info.width}x${info.height}`);
  }

  const alphaValues = new Set();
  let minX = CANVAS_SIZE;
  let minY = CANVAS_SIZE;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const alpha = data[(y * info.width + x) * 4 + 3];
      alphaValues.add(alpha);
      if (alpha === 0) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  const invalidAlpha = [...alphaValues].filter((alpha) => alpha !== 0 && alpha !== 255);
  if (invalidAlpha.length > 0) {
    throw new Error(`${color}: antialiased alpha values found: ${invalidAlpha.join(", ")}`);
  }

  const bounds = {
    left: minX,
    top: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };

  if (JSON.stringify(bounds) !== JSON.stringify(EXPECTED_BOUNDS)) {
    throw new Error(`${color}: expected bounds ${JSON.stringify(EXPECTED_BOUNDS)}, got ${JSON.stringify(bounds)}`);
  }

  console.log(`bomb-${color}.png: 36x36, bounds=24x24+6+6, alpha=0/255`);
}
