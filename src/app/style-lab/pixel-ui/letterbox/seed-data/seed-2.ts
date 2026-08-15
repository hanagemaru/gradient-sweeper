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
  { base: AUTOTILE_BASE, name: "covered-step", x: -92, y: 677, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-square", x: -85, y: -100, w: 128, h: 128 },
  { base: CRYSTAL_BASE, name: "cluster-wide", x: -30, y: 436, w: 120, h: 80 },
  { base: CRYSTAL_BASE, name: "accent-small", x: 238, y: 46, w: 40, h: 40 },
  { base: CRYSTAL_BASE, name: "cluster-medium", x: 97, y: 537, w: 110, h: 90 },
  { base: AUTOTILE_BASE, name: "covered-step", x: 17, y: 125, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-step", x: 298, y: 677, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-square", x: 145, y: 651, w: 128, h: 128 },
  { base: CRYSTAL_BASE, name: "accent-small", x: 314, y: 612, w: 40, h: 40 },
  { base: AUTOTILE_BASE, name: "covered-tall", x: 64, y: -168, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "open-purple-wide", x: 124, y: 381, w: 192, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-square", x: 305, y: -100, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "open-red-square", x: 248, y: 219, w: 128, h: 128 },
  { base: CRYSTAL_BASE, name: "cluster-wide", x: 360, y: 436, w: 120, h: 80 },
];
