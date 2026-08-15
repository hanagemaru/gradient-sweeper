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
  { base: AUTOTILE_BASE, name: "covered-mega-l", x: 576, y: 998, w: 288, h: 288 },
  { base: AUTOTILE_BASE, name: "covered-step", x: 885, y: 1307, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-step", x: 367, y: 1196, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-wide", x: 518, y: 855, w: 192, h: 128 },
  { base: CRYSTAL_BASE, name: "accent-small", x: 869, y: 1164, w: 40, h: 40 },
  { base: CRYSTAL_BASE, name: "cluster-wide", x: 390, y: 928, w: 120, h: 80 },
  { base: AUTOTILE_BASE, name: "covered-mega-l", x: 402, y: 206, w: 288, h: 288 },
  { base: AUTOTILE_BASE, name: "covered-l-rotated", x: 673, y: 500, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "open-purple-step", x: 550, y: 57, w: 192, h: 140 },
  { base: AUTOTILE_BASE, name: "covered-wide", x: 358, y: -87, w: 192, h: 128 },
  { base: AUTOTILE_BASE, name: "open-blue-tall", x: 749, y: 145, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-tall", x: 260, y: 201, w: 128, h: 192 },
  { base: CRYSTAL_BASE, name: "cluster-large", x: 261, y: 443, w: 130, h: 110 },
  { base: AUTOTILE_BASE, name: "covered-mega-tall", x: 1957, y: 226, w: 160, h: 320 },
  { base: AUTOTILE_BASE, name: "open-purple-wide", x: 1968, y: 75, w: 192, h: 128 },
  { base: AUTOTILE_BASE, name: "open-blue-l", x: 2075, y: 557, w: 144, h: 140 },
  { base: AUTOTILE_BASE, name: "open-blue-l", x: 1797, y: 229, w: 144, h: 140 },
  { base: CRYSTAL_BASE, name: "accent-small", x: 1904, y: 394, w: 40, h: 40 },
  { base: AUTOTILE_BASE, name: "open-purple-mega-wide", x: 1237, y: 946, w: 320, h: 160 },
  { base: AUTOTILE_BASE, name: "covered-wide", x: 1411, y: 1117, w: 192, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-wide", x: 1035, y: 855, w: 192, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-headland", x: -365, y: 1532, w: 576, h: 320 },
  { base: AUTOTILE_BASE, name: "covered-l", x: -138, y: 1331, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-l", x: 221, y: 1551, w: 192, h: 192 },
  { base: CRYSTAL_BASE, name: "cluster-medium", x: -92, y: 1237, w: 110, h: 90 },
  { base: AUTOTILE_BASE, name: "covered-mega-tall", x: 2130, y: 1033, w: 160, h: 320 },
  { base: AUTOTILE_BASE, name: "covered-l-rotated", x: 2208, y: 833, w: 192, h: 192 },
  { base: CRYSTAL_BASE, name: "cluster-large", x: 1989, y: 1048, w: 130, h: 110 },
  { base: CRYSTAL_BASE, name: "cluster-wide", x: 1863, y: 1155, w: 120, h: 80 },
  { base: AUTOTILE_BASE, name: "covered-terrace", x: 672, y: 1540, w: 448, h: 288 },
  { base: AUTOTILE_BASE, name: "covered-tall", x: 891, y: 963, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "open-blue-l", x: 516, y: 1550, w: 144, h: 140 },
  { base: AUTOTILE_BASE, name: "covered-mega-l", x: 1417, y: 1357, w: 288, h: 288 },
  { base: AUTOTILE_BASE, name: "covered-tall", x: 1269, y: 1213, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "open-blue-wide", x: 1727, y: 1512, w: 192, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-l-rotated", x: 1620, y: 1084, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-mega-l", x: 2364, y: 22, w: 288, h: 288 },
  { base: AUTOTILE_BASE, name: "open-blue-wide", x: 2629, y: 323, w: 192, h: 128 },
  { base: AUTOTILE_BASE, name: "open-blue-step", x: 2496, y: 472, w: 192, h: 140 },
  { base: AUTOTILE_BASE, name: "covered-step", x: 2485, y: -191, w: 192, h: 192 },
  { base: CRYSTAL_BASE, name: "cluster-large", x: 2683, y: -46, w: 130, h: 110 },
  { base: AUTOTILE_BASE, name: "covered-mega-l", x: -218, y: 905, w: 288, h: 288 },
  { base: CRYSTAL_BASE, name: "cluster-large", x: -117, y: 782, w: 130, h: 110 },
  { base: AUTOTILE_BASE, name: "open-blue-mega-step", x: 7, y: -255, w: 320, h: 256 },
  { base: AUTOTILE_BASE, name: "covered-l", x: 59, y: 42, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-tall", x: 761, y: -141, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "open-blue-mega-tall", x: 2082, y: 1404, w: 160, h: 320 },
  { base: AUTOTILE_BASE, name: "covered-l-rotated", x: 2305, y: 1161, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "open-blue-l", x: 1846, y: 1362, w: 144, h: 140 },
  { base: CRYSTAL_BASE, name: "cluster-large", x: 2256, y: 1523, w: 130, h: 110 },
  { base: CRYSTAL_BASE, name: "cluster-medium", x: 2398, y: 1488, w: 110, h: 90 },
  { base: AUTOTILE_BASE, name: "open-purple-mega-wide", x: -109, y: 256, w: 320, h: 160 },
  { base: AUTOTILE_BASE, name: "open-red-step", x: -5, y: 429, w: 192, h: 140 },
  { base: AUTOTILE_BASE, name: "open-blue-tall", x: 43, y: 577, w: 128, h: 192 },
  { base: CRYSTAL_BASE, name: "cluster-medium", x: 270, y: 101, w: 110, h: 90 },
  { base: AUTOTILE_BASE, name: "covered-mega-step", x: 2868, y: 58, w: 320, h: 256 },
  { base: AUTOTILE_BASE, name: "open-purple-step", x: 2835, y: 412, w: 192, h: 140 },
  { base: AUTOTILE_BASE, name: "open-blue-l-rotated", x: 2858, y: 566, w: 144, h: 140 },
  { base: CRYSTAL_BASE, name: "cluster-large", x: 2542, y: 625, w: 130, h: 110 },
  { base: AUTOTILE_BASE, name: "open-blue-ridge-wide", x: 2769, y: 903, w: 448, h: 160 },
  { base: AUTOTILE_BASE, name: "open-purple-wide", x: 2558, y: 916, w: 192, h: 128 },
  { base: AUTOTILE_BASE, name: "open-blue-step", x: 2597, y: 1071, w: 192, h: 140 },
  { base: AUTOTILE_BASE, name: "covered-tall", x: 2762, y: 1225, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "open-purple-ridge-wide", x: 1733, y: 813, w: 448, h: 160 },
  { base: AUTOTILE_BASE, name: "covered-square", x: 2239, y: 476, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "open-blue-l", x: 1916, y: 598, w: 144, h: 140 },
  { base: AUTOTILE_BASE, name: "covered-mega-tall", x: 111, y: 1062, w: 160, h: 320 },
  { base: AUTOTILE_BASE, name: "covered-mega-step", x: 1249, y: 481, w: 320, h: 256 },
  { base: AUTOTILE_BASE, name: "covered-step", x: 1248, y: 277, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-square", x: 1109, y: 576, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-tall", x: 1583, y: 313, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "open-blue-square", x: 962, y: 634, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "open-red-step", x: 1578, y: 538, w: 192, h: 140 },
  { base: CRYSTAL_BASE, name: "cluster-large", x: 1457, y: 194, w: 130, h: 110 },
  { base: CRYSTAL_BASE, name: "accent-small", x: 1363, y: 222, w: 40, h: 40 },
  { base: AUTOTILE_BASE, name: "open-red-bluff-tall", x: 1738, y: -300, w: 192, h: 384 },
  { base: CRYSTAL_BASE, name: "cluster-medium", x: 2166, y: 42, w: 110, h: 90 },
  { base: AUTOTILE_BASE, name: "covered-mega-step", x: 2807, y: 1471, w: 320, h: 256 },
  { base: AUTOTILE_BASE, name: "covered-wide", x: 2486, y: 1593, w: 192, h: 128 },
];
