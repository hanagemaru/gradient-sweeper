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
  { base: CRYSTAL_BASE, name: "cluster-medium", x: -9, y: 375, w: 110, h: 90 },
  { base: AUTOTILE_BASE, name: "covered-terrace", x: -147, y: 1153, w: 448, h: 288 },
  { base: AUTOTILE_BASE, name: "covered-step", x: -56, y: 866, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-wide", x: -182, y: 529, w: 192, h: 128 },
  { base: AUTOTILE_BASE, name: "open-blue-mega-wide", x: -36, y: -87, w: 320, h: 160 },
  { base: AUTOTILE_BASE, name: "covered-headland", x: -508, y: 1589, w: 576, h: 320 },
  { base: CRYSTAL_BASE, name: "cluster-wide", x: 37, y: 482, w: 120, h: 80 },
  { base: CRYSTAL_BASE, name: "cluster-medium", x: 1431, y: 375, w: 110, h: 90 },
  { base: CRYSTAL_BASE, name: "accent-small", x: 1277, y: 1089, w: 40, h: 40 },
  { base: AUTOTILE_BASE, name: "covered-terrace", x: 1293, y: 1153, w: 448, h: 288 },
  { base: AUTOTILE_BASE, name: "covered-l-rotated", x: 243, y: 934, w: 192, h: 192 },
  { base: CRYSTAL_BASE, name: "accent-small", x: 455, y: 1053, w: 40, h: 40 },
  { base: AUTOTILE_BASE, name: "covered-mega-step", x: 324, y: 1374, w: 320, h: 256 },
  { base: AUTOTILE_BASE, name: "open-blue-step", x: 90, y: 1470, w: 192, h: 140 },
  { base: AUTOTILE_BASE, name: "open-blue-tall", x: 553, y: 1162, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "open-blue-step", x: 757, y: 1388, w: 192, h: 140 },
  { base: CRYSTAL_BASE, name: "cluster-large", x: 700, y: 1249, w: 130, h: 110 },
  { base: AUTOTILE_BASE, name: "covered-headland", x: 178, y: 422, w: 576, h: 320 },
  { base: AUTOTILE_BASE, name: "covered-step", x: 135, y: 202, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-step", x: 1384, y: 866, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-wide", x: 1258, y: 529, w: 192, h: 128 },
  { base: CRYSTAL_BASE, name: "cluster-large", x: 350, y: 289, w: 130, h: 110 },
  { base: AUTOTILE_BASE, name: "covered-bluff-tall", x: 1054, y: 913, w: 192, h: 384 },
  { base: AUTOTILE_BASE, name: "covered-mega-step", x: 794, y: 543, w: 320, h: 256 },
  { base: AUTOTILE_BASE, name: "covered-square", x: 781, y: 821, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-tall", x: 816, y: 326, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-wide", x: 568, y: 278, w: 192, h: 128 },
  { base: AUTOTILE_BASE, name: "open-blue-mega-wide", x: 1404, y: -87, w: 320, h: 160 },
  { base: AUTOTILE_BASE, name: "covered-wide", x: 1187, y: -127, w: 192, h: 128 },
  { base: AUTOTILE_BASE, name: "open-blue-wide", x: 309, y: -41, w: 192, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-square", x: 1253, y: 22, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-bluff-tall", x: 553, y: -303, w: 192, h: 384 },
  { base: AUTOTILE_BASE, name: "open-blue-step", x: 763, y: 19, w: 192, h: 140 },
  { base: AUTOTILE_BASE, name: "covered-headland", x: 932, y: 1589, w: 576, h: 320 },
  { base: AUTOTILE_BASE, name: "open-purple-tall", x: 1046, y: 178, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "open-blue-l", x: 682, y: 976, w: 144, h: 140 },
  { base: AUTOTILE_BASE, name: "open-blue-square", x: 1166, y: 707, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "open-blue-square", x: 996, y: -25, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "open-red-l-rotated", x: 520, y: 851, w: 144, h: 140 },
  { base: AUTOTILE_BASE, name: "covered-l", x: 1219, y: 231, w: 192, h: 192 },
  { base: CRYSTAL_BASE, name: "cluster-medium", x: 603, y: 109, w: 110, h: 90 },
  { base: AUTOTILE_BASE, name: "open-red-l", x: 884, y: 1183, w: 144, h: 140 },
  { base: CRYSTAL_BASE, name: "cluster-medium", x: 1161, y: 1456, w: 110, h: 90 },
  { base: AUTOTILE_BASE, name: "open-red-square", x: 1016, y: 1401, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-step", x: 660, y: 1548, w: 192, h: 192 },
  { base: CRYSTAL_BASE, name: "cluster-wide", x: 1477, y: 482, w: 120, h: 80 },
  { base: CRYSTAL_BASE, name: "cluster-medium", x: 2871, y: 375, w: 110, h: 90 },
  { base: CRYSTAL_BASE, name: "accent-small", x: 2717, y: 1089, w: 40, h: 40 },
  { base: AUTOTILE_BASE, name: "covered-terrace", x: 2733, y: 1153, w: 448, h: 288 },
  { base: AUTOTILE_BASE, name: "covered-l-rotated", x: 1683, y: 934, w: 192, h: 192 },
  { base: CRYSTAL_BASE, name: "accent-small", x: 1895, y: 1053, w: 40, h: 40 },
  { base: AUTOTILE_BASE, name: "covered-mega-step", x: 1764, y: 1374, w: 320, h: 256 },
  { base: AUTOTILE_BASE, name: "open-blue-step", x: 1530, y: 1470, w: 192, h: 140 },
  { base: AUTOTILE_BASE, name: "open-blue-tall", x: 1993, y: 1162, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "open-blue-step", x: 2197, y: 1388, w: 192, h: 140 },
  { base: CRYSTAL_BASE, name: "cluster-large", x: 2140, y: 1249, w: 130, h: 110 },
  { base: AUTOTILE_BASE, name: "covered-headland", x: 1618, y: 422, w: 576, h: 320 },
  { base: AUTOTILE_BASE, name: "covered-step", x: 1575, y: 202, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-step", x: 2824, y: 866, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-wide", x: 2698, y: 529, w: 192, h: 128 },
  { base: CRYSTAL_BASE, name: "cluster-large", x: 1790, y: 289, w: 130, h: 110 },
  { base: AUTOTILE_BASE, name: "covered-bluff-tall", x: 2494, y: 913, w: 192, h: 384 },
  { base: AUTOTILE_BASE, name: "covered-mega-step", x: 2234, y: 543, w: 320, h: 256 },
  { base: AUTOTILE_BASE, name: "covered-square", x: 2221, y: 821, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-tall", x: 2256, y: 326, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-wide", x: 2008, y: 278, w: 192, h: 128 },
  { base: AUTOTILE_BASE, name: "open-blue-mega-wide", x: 2844, y: -87, w: 320, h: 160 },
  { base: AUTOTILE_BASE, name: "covered-wide", x: 2627, y: -127, w: 192, h: 128 },
  { base: AUTOTILE_BASE, name: "open-blue-wide", x: 1749, y: -41, w: 192, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-square", x: 2693, y: 22, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-bluff-tall", x: 1993, y: -303, w: 192, h: 384 },
  { base: AUTOTILE_BASE, name: "open-blue-step", x: 2203, y: 19, w: 192, h: 140 },
  { base: AUTOTILE_BASE, name: "covered-headland", x: 2372, y: 1589, w: 576, h: 320 },
  { base: AUTOTILE_BASE, name: "open-purple-tall", x: 2486, y: 178, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "open-blue-l", x: 2122, y: 976, w: 144, h: 140 },
  { base: AUTOTILE_BASE, name: "open-blue-square", x: 2606, y: 707, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "open-blue-square", x: 2436, y: -25, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "open-red-l-rotated", x: 1960, y: 851, w: 144, h: 140 },
  { base: AUTOTILE_BASE, name: "covered-l", x: 2659, y: 231, w: 192, h: 192 },
  { base: CRYSTAL_BASE, name: "cluster-medium", x: 2043, y: 109, w: 110, h: 90 },
  { base: AUTOTILE_BASE, name: "open-red-l", x: 2324, y: 1183, w: 144, h: 140 },
  { base: CRYSTAL_BASE, name: "cluster-medium", x: 2601, y: 1456, w: 110, h: 90 },
  { base: AUTOTILE_BASE, name: "open-red-square", x: 2456, y: 1401, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-step", x: 2100, y: 1548, w: 192, h: 192 },
];
