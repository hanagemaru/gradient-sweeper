// このファイルは scripts/generate-background-world.mjs が生成した固定値です。
// 手で座標を直した場合は、再実行で上書きされるため注意してください。

export const CRYSTAL_BASE = "/assets/frostbound/crystals-v2";
export const AUTOTILE_BASE = "/assets/frostbound/cell-autotile-v2";

export const WORLD_WIDTH = 390;
export const WORLD_HEIGHT = 670;

export type BackgroundPlacement = {
  base: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export const BACKGROUND_WORLD: BackgroundPlacement[] = [
  { base: CRYSTAL_BASE, name: "accent-small", x: 117, y: 23, w: 40, h: 40 },
  { base: CRYSTAL_BASE, name: "cluster-medium", x: 73, y: 533, w: 110, h: 90 },
  { base: CRYSTAL_BASE, name: "cluster-wide", x: 238, y: 493, w: 120, h: 80 },
  { base: AUTOTILE_BASE, name: "open-red-square", x: 213, y: 51, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-wide", x: 33, y: 306, w: 192, h: 128 },
  { base: AUTOTILE_BASE, name: "open-blue-l-rotated", x: 43, y: 134, w: 144, h: 140 },
  { base: AUTOTILE_BASE, name: "covered-square", x: 276, y: 290, w: 128, h: 128 },
];
