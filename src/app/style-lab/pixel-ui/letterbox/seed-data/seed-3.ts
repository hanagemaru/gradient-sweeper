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
  { base: AUTOTILE_BASE, name: "open-blue-l", x: -126, y: 643, w: 144, h: 140 },
  { base: AUTOTILE_BASE, name: "covered-l", x: -99, y: 841, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-square", x: -29, y: 119, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-l", x: -157, y: 272, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-square", x: -65, y: 499, w: 128, h: 128 },
  { base: CRYSTAL_BASE, name: "accent-small", x: 298, y: 32, w: 40, h: 40 },
  { base: CRYSTAL_BASE, name: "cluster-medium", x: 134, y: 520, w: 110, h: 90 },
  { base: CRYSTAL_BASE, name: "cluster-wide", x: 78, y: 696, w: 120, h: 80 },
  { base: AUTOTILE_BASE, name: "open-blue-l", x: 264, y: 643, w: 144, h: 140 },
  { base: AUTOTILE_BASE, name: "covered-l", x: 291, y: 841, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "open-blue-l", x: 63, y: 338, w: 144, h: 140 },
  { base: AUTOTILE_BASE, name: "open-blue-square", x: 39, y: -56, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-square", x: 361, y: 119, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-l", x: 233, y: 272, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-square", x: 325, y: 499, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "open-blue-wide", x: 133, y: 121, w: 192, h: 128 },
  { base: AUTOTILE_BASE, name: "open-red-square", x: 139, y: 818, w: 128, h: 128 },
];
