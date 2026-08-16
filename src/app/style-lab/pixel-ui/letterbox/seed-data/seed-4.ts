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
  { base: AUTOTILE_BASE, name: "open-blue-wide", x: -103, y: 343, w: 192, h: 128 },
  { base: AUTOTILE_BASE, name: "open-blue-square", x: -44, y: 90, w: 128, h: 128 },
  { base: CRYSTAL_BASE, name: "accent-small", x: 124, y: 44, w: 40, h: 40 },
  { base: CRYSTAL_BASE, name: "cluster-medium", x: 15, y: 555, w: 110, h: 90 },
  { base: CRYSTAL_BASE, name: "cluster-wide", x: 255, y: 714, w: 120, h: 80 },
  { base: AUTOTILE_BASE, name: "open-red-wide", x: 156, y: 493, w: 192, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-square", x: 269, y: -87, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-tall", x: 144, y: 108, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-tall", x: 44, y: 805, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "open-blue-wide", x: 287, y: 343, w: 192, h: 128 },
  { base: AUTOTILE_BASE, name: "open-blue-square", x: 346, y: 90, w: 128, h: 128 },
];
