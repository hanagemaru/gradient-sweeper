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
  { base: AUTOTILE_BASE, name: "covered-square", x: -36, y: 303, w: 128, h: 128 },
  { base: CRYSTAL_BASE, name: "accent-small", x: 117, y: 23, w: 40, h: 40 },
  { base: CRYSTAL_BASE, name: "cluster-medium", x: 73, y: 533, w: 110, h: 90 },
  { base: CRYSTAL_BASE, name: "cluster-wide", x: 238, y: 493, w: 120, h: 80 },
  { base: AUTOTILE_BASE, name: "open-red-square", x: 221, y: 35, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-square", x: 216, y: 591, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "open-blue-tall", x: 134, y: 274, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "open-blue-square", x: 66, y: 127, w: 128, h: 128 },
];
