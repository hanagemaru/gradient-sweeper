// このファイルは scripts/generate-background-world.mjs が生成した固定値です。
// 手で座標を直した場合は、再実行で上書きされるため注意してください。

export const CRYSTAL_BASE = "/assets/frostbound/crystals-v2";
export const AUTOTILE_BASE = "/assets/frostbound/cell-autotile-v2";

export const WORLD_WIDTH = 2880;
export const WORLD_HEIGHT = 1620;

export type BackgroundPlacement = {
  base: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export const BACKGROUND_WORLD: BackgroundPlacement[] = [
  { base: AUTOTILE_BASE, name: "covered-l-rotated", x: -179, y: 1331, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "open-blue-l", x: -121, y: 456, w: 144, h: 140 },
  { base: AUTOTILE_BASE, name: "covered-wide", x: -163, y: 892, w: 192, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-terrace", x: -364, y: 117, w: 448, h: 288 },
  { base: AUTOTILE_BASE, name: "open-purple-l-rotated", x: -28, y: -65, w: 144, h: 140 },
  { base: CRYSTAL_BASE, name: "accent-small", x: 138, y: 1098, w: 40, h: 40 },
  { base: AUTOTILE_BASE, name: "covered-mega-wide", x: 33, y: 1355, w: 320, h: 160 },
  { base: AUTOTILE_BASE, name: "covered-square", x: 363, y: 1407, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-l-rotated", x: 1261, y: 1331, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "open-red-l", x: 321, y: 1194, w: 144, h: 140 },
  { base: CRYSTAL_BASE, name: "cluster-medium", x: 403, y: 1099, w: 110, h: 90 },
  { base: AUTOTILE_BASE, name: "open-blue-mega-tall", x: 45, y: 589, w: 160, h: 320 },
  { base: AUTOTILE_BASE, name: "covered-l-rotated", x: 130, y: 385, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "open-blue-l", x: 1319, y: 456, w: 144, h: 140 },
  { base: AUTOTILE_BASE, name: "covered-wide", x: 1277, y: 892, w: 192, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-step", x: 220, y: 740, w: 192, h: 192 },
  { base: CRYSTAL_BASE, name: "cluster-medium", x: 1121, y: 705, w: 110, h: 90 },
  { base: CRYSTAL_BASE, name: "cluster-large", x: 334, y: 536, w: 130, h: 110 },
  { base: AUTOTILE_BASE, name: "covered-ridge-wide", x: 980, y: 1149, w: 448, h: 160 },
  { base: AUTOTILE_BASE, name: "covered-step", x: 774, y: 1302, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-wide", x: 614, y: 1071, w: 192, h: 128 },
  { base: CRYSTAL_BASE, name: "accent-small", x: 1037, y: 1318, w: 40, h: 40 },
  { base: AUTOTILE_BASE, name: "open-blue-mega-l", x: 752, y: 1557, w: 288, h: 288 },
  { base: AUTOTILE_BASE, name: "open-blue-l", x: 596, y: 1614, w: 144, h: 140 },
  { base: AUTOTILE_BASE, name: "covered-terrace", x: 1076, y: 117, w: 448, h: 288 },
  { base: AUTOTILE_BASE, name: "open-purple-l-rotated", x: 1412, y: -65, w: 144, h: 140 },
  { base: AUTOTILE_BASE, name: "covered-l", x: 129, y: 23, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "open-blue-l-rotated", x: 332, y: 112, w: 144, h: 140 },
  { base: AUTOTILE_BASE, name: "covered-step", x: 1205, y: -186, w: 192, h: 192 },
  { base: CRYSTAL_BASE, name: "cluster-medium", x: 1082, y: -43, w: 110, h: 90 },
  { base: AUTOTILE_BASE, name: "covered-mega-step", x: 509, y: 778, w: 320, h: 256 },
  { base: AUTOTILE_BASE, name: "covered-tall", x: 849, y: 938, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "open-purple-step", x: 533, y: 631, w: 192, h: 140 },
  { base: AUTOTILE_BASE, name: "covered-l", x: 501, y: 1249, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "open-blue-mega-l", x: 755, y: -156, w: 288, h: 288 },
  { base: AUTOTILE_BASE, name: "covered-step", x: 539, y: -142, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "open-blue-step", x: 522, y: 56, w: 192, h: 140 },
  { base: AUTOTILE_BASE, name: "open-red-step", x: 780, y: 150, w: 192, h: 140 },
  { base: CRYSTAL_BASE, name: "cluster-wide", x: 885, y: 301, w: 120, h: 80 },
  { base: AUTOTILE_BASE, name: "open-purple-bluff-tall", x: 231, y: 1569, w: 192, h: 384 },
  { base: AUTOTILE_BASE, name: "covered-wide", x: 29, y: 1599, w: 192, h: 128 },
  { base: CRYSTAL_BASE, name: "cluster-wide", x: 9, y: 1234, w: 120, h: 80 },
  { base: CRYSTAL_BASE, name: "cluster-large", x: 513, y: 1499, w: 130, h: 110 },
  { base: AUTOTILE_BASE, name: "covered-wide", x: 752, y: 432, w: 192, h: 128 },
  { base: CRYSTAL_BASE, name: "accent-small", x: 1578, y: 1098, w: 40, h: 40 },
  { base: AUTOTILE_BASE, name: "covered-mega-wide", x: 1473, y: 1355, w: 320, h: 160 },
  { base: AUTOTILE_BASE, name: "covered-square", x: 1803, y: 1407, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-l-rotated", x: 2701, y: 1331, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "open-red-l", x: 1761, y: 1194, w: 144, h: 140 },
  { base: CRYSTAL_BASE, name: "cluster-medium", x: 1843, y: 1099, w: 110, h: 90 },
  { base: AUTOTILE_BASE, name: "open-blue-mega-tall", x: 1485, y: 589, w: 160, h: 320 },
  { base: AUTOTILE_BASE, name: "covered-l-rotated", x: 1570, y: 385, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "open-blue-l", x: 2759, y: 456, w: 144, h: 140 },
  { base: AUTOTILE_BASE, name: "covered-wide", x: 2717, y: 892, w: 192, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-step", x: 1660, y: 740, w: 192, h: 192 },
  { base: CRYSTAL_BASE, name: "cluster-medium", x: 2561, y: 705, w: 110, h: 90 },
  { base: CRYSTAL_BASE, name: "cluster-large", x: 1774, y: 536, w: 130, h: 110 },
  { base: AUTOTILE_BASE, name: "covered-ridge-wide", x: 2420, y: 1149, w: 448, h: 160 },
  { base: AUTOTILE_BASE, name: "covered-step", x: 2214, y: 1302, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-wide", x: 2054, y: 1071, w: 192, h: 128 },
  { base: CRYSTAL_BASE, name: "accent-small", x: 2477, y: 1318, w: 40, h: 40 },
  { base: AUTOTILE_BASE, name: "open-blue-mega-l", x: 2192, y: 1557, w: 288, h: 288 },
  { base: AUTOTILE_BASE, name: "open-blue-l", x: 2036, y: 1614, w: 144, h: 140 },
  { base: AUTOTILE_BASE, name: "covered-terrace", x: 2516, y: 117, w: 448, h: 288 },
  { base: AUTOTILE_BASE, name: "open-purple-l-rotated", x: 2852, y: -65, w: 144, h: 140 },
  { base: AUTOTILE_BASE, name: "covered-l", x: 1569, y: 23, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "open-blue-l-rotated", x: 1772, y: 112, w: 144, h: 140 },
  { base: AUTOTILE_BASE, name: "covered-step", x: 2645, y: -186, w: 192, h: 192 },
  { base: CRYSTAL_BASE, name: "cluster-medium", x: 2522, y: -43, w: 110, h: 90 },
  { base: AUTOTILE_BASE, name: "covered-mega-step", x: 1949, y: 778, w: 320, h: 256 },
  { base: AUTOTILE_BASE, name: "covered-tall", x: 2289, y: 938, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "open-purple-step", x: 1973, y: 631, w: 192, h: 140 },
  { base: AUTOTILE_BASE, name: "covered-l", x: 1941, y: 1249, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "open-blue-mega-l", x: 2195, y: -156, w: 288, h: 288 },
  { base: AUTOTILE_BASE, name: "covered-step", x: 1979, y: -142, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "open-blue-step", x: 1962, y: 56, w: 192, h: 140 },
  { base: AUTOTILE_BASE, name: "open-red-step", x: 2220, y: 150, w: 192, h: 140 },
  { base: CRYSTAL_BASE, name: "cluster-wide", x: 2325, y: 301, w: 120, h: 80 },
  { base: AUTOTILE_BASE, name: "open-purple-bluff-tall", x: 1671, y: 1569, w: 192, h: 384 },
  { base: AUTOTILE_BASE, name: "covered-wide", x: 1469, y: 1599, w: 192, h: 128 },
  { base: CRYSTAL_BASE, name: "cluster-wide", x: 1449, y: 1234, w: 120, h: 80 },
  { base: CRYSTAL_BASE, name: "cluster-large", x: 1953, y: 1499, w: 130, h: 110 },
  { base: AUTOTILE_BASE, name: "covered-wide", x: 2192, y: 432, w: 192, h: 128 },
];
