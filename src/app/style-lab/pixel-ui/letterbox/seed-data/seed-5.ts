// このファイルは scripts/generate-background-world.mjs が生成した固定値です。
// 手で座標を直した場合は、再実行で上書きされるため注意してください。

export const CRYSTAL_BASE = "/assets/frostbound/crystals-v2";
export const AUTOTILE_BASE = "/assets/frostbound/cell-autotile-v2";

export const WORLD_WIDTH = 390;
export const WORLD_HEIGHT = 844;

export type BackgroundPlacement = {
  base: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export const BACKGROUND_WORLD: BackgroundPlacement[] = [
  { base: AUTOTILE_BASE, name: "covered-wide", x: -35, y: 353, w: 192, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-tall", x: -36, y: 801, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "open-blue-wide", x: -183, y: 112, w: 192, h: 128 },
  { base: AUTOTILE_BASE, name: "open-blue-square", x: -81, y: -85, w: 128, h: 128 },
  { base: CRYSTAL_BASE, name: "accent-small", x: 238, y: 48, w: 40, h: 40 },
  { base: CRYSTAL_BASE, name: "cluster-large", x: 63, y: 642, w: 130, h: 110 },
  { base: CRYSTAL_BASE, name: "cluster-medium", x: 245, y: 557, w: 110, h: 90 },
  { base: CRYSTAL_BASE, name: "cluster-wide", x: 73, y: 505, w: 120, h: 80 },
  { base: AUTOTILE_BASE, name: "covered-wide", x: 355, y: 353, w: 192, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-tall", x: 354, y: 801, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "open-blue-wide", x: 207, y: 112, w: 192, h: 128 },
  { base: AUTOTILE_BASE, name: "open-blue-square", x: 37, y: 203, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-l", x: 81, y: -172, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "open-blue-square", x: 135, y: 821, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "open-purple-square", x: 196, y: 356, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "open-blue-square", x: 309, y: -85, w: 128, h: 128 },
];
