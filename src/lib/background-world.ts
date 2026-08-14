// このファイルは scripts/generate-background-world.mjs が生成した固定値です。
// 手で座標を直した場合は、再実行で上書きされるため注意してください。

export const CRYSTAL_BASE = "/assets/frostbound/crystals-v2";
export const MOTIF_BASE = "/assets/frostbound/motifs-v2";
export const AUTOTILE_BASE = "/assets/frostbound/cell-autotile-v2";

export const WORLD_WIDTH = 1800;
export const WORLD_HEIGHT = 946;

export type BackgroundPlacement = {
  base: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export const BACKGROUND_WORLD: BackgroundPlacement[] = [
  { base: AUTOTILE_BASE, name: "open-purple-square", x: 10, y: 10, w: 128, h: 128 },
  { base: CRYSTAL_BASE, name: "cluster-medium", x: 148, y: 10, w: 110, h: 90 },
  { base: CRYSTAL_BASE, name: "accent-small", x: 268, y: 10, w: 40, h: 40 },
  { base: AUTOTILE_BASE, name: "covered-square", x: 318, y: 10, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-square", x: 456, y: 10, w: 128, h: 128 },
  { base: MOTIF_BASE, name: "l-panel-blue", x: 594, y: 10, w: 144, h: 140 },
  { base: AUTOTILE_BASE, name: "covered-step", x: 748, y: 10, w: 192, h: 192 },
  { base: CRYSTAL_BASE, name: "cluster-large", x: 950, y: 10, w: 130, h: 110 },
  { base: AUTOTILE_BASE, name: "covered-wide", x: 1090, y: 10, w: 192, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-step", x: 1292, y: 10, w: 192, h: 192 },
  { base: CRYSTAL_BASE, name: "cluster-medium", x: 1494, y: 10, w: 110, h: 90 },
  { base: CRYSTAL_BASE, name: "accent-small", x: 1614, y: 10, w: 40, h: 40 },
  { base: AUTOTILE_BASE, name: "open-blue-square", x: 10, y: 212, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "open-red-square", x: 148, y: 212, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-square", x: 286, y: 212, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-tall", x: 424, y: 212, w: 128, h: 192 },
  { base: CRYSTAL_BASE, name: "accent-small", x: 562, y: 212, w: 40, h: 40 },
  { base: AUTOTILE_BASE, name: "covered-square", x: 612, y: 212, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-wide", x: 750, y: 212, w: 192, h: 128 },
  { base: CRYSTAL_BASE, name: "cluster-wide", x: 952, y: 212, w: 120, h: 80 },
  { base: AUTOTILE_BASE, name: "covered-l", x: 1082, y: 212, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-square", x: 1284, y: 212, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-mega-wide", x: 1422, y: 212, w: 320, h: 160 },
  { base: AUTOTILE_BASE, name: "open-blue-square", x: 10, y: 414, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-wide", x: 148, y: 414, w: 192, h: 128 },
  { base: AUTOTILE_BASE, name: "open-red-square", x: 350, y: 414, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "open-red-wide", x: 488, y: 414, w: 192, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-tall", x: 690, y: 414, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "open-purple-wide", x: 828, y: 414, w: 192, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-tall", x: 1030, y: 414, w: 128, h: 192 },
  { base: CRYSTAL_BASE, name: "cluster-large", x: 1168, y: 414, w: 130, h: 110 },
  { base: AUTOTILE_BASE, name: "open-blue-square", x: 1308, y: 414, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "open-blue-wide", x: 1446, y: 414, w: 192, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-mega-tall", x: 10, y: 616, w: 160, h: 320 },
  { base: AUTOTILE_BASE, name: "open-blue-wide", x: 180, y: 616, w: 192, h: 128 },
  { base: AUTOTILE_BASE, name: "open-purple-square", x: 382, y: 616, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "open-blue-tall", x: 520, y: 616, w: 128, h: 192 },
  { base: CRYSTAL_BASE, name: "accent-small", x: 658, y: 616, w: 40, h: 40 },
  { base: CRYSTAL_BASE, name: "cluster-wide", x: 708, y: 616, w: 120, h: 80 },
  { base: AUTOTILE_BASE, name: "covered-square", x: 838, y: 616, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-l", x: 976, y: 616, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "open-blue-tall", x: 1178, y: 616, w: 128, h: 192 },
];
