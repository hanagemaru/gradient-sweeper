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
  { base: CRYSTAL_BASE, name: "accent-small", x: 252, y: 9, w: 40, h: 40 },
  { base: CRYSTAL_BASE, name: "cluster-medium", x: 16, y: 519, w: 110, h: 90 },
  { base: CRYSTAL_BASE, name: "cluster-wide", x: 191, y: 544, w: 120, h: 80 },
  { base: AUTOTILE_BASE, name: "open-red-square", x: 15, y: 40, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-wide", x: 36, y: 207, w: 192, h: 128 },
  { base: AUTOTILE_BASE, name: "open-blue-tall", x: 256, y: 81, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "open-blue-wide", x: 30, y: 367, w: 192, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-tall", x: 272, y: 294, w: 128, h: 192 },
];
