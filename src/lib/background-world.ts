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
  { base: CRYSTAL_BASE, name: "accent-small", x: 295, y: 41, w: 40, h: 40 },
  { base: CRYSTAL_BASE, name: "cluster-medium", x: 17, y: 520, w: 110, h: 90 },
  { base: CRYSTAL_BASE, name: "cluster-wide", x: 187, y: 545, w: 120, h: 80 },
  { base: AUTOTILE_BASE, name: "open-red-l-rotated", x: 14, y: 41, w: 144, h: 140 },
  { base: AUTOTILE_BASE, name: "covered-square", x: 177, y: 241, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "open-blue-square", x: 227, y: 398, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-tall", x: 0, y: 275, w: 128, h: 192 },
];
