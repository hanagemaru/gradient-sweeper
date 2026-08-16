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
  { base: AUTOTILE_BASE, name: "covered-l", x: -17, y: 190, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "open-blue-l", x: -118, y: 421, w: 144, h: 140 },
  { base: AUTOTILE_BASE, name: "covered-square", x: -123, y: 784, w: 128, h: 128 },
  { base: CRYSTAL_BASE, name: "accent-small", x: 315, y: 25, w: 40, h: 40 },
  { base: CRYSTAL_BASE, name: "cluster-large", x: 63, y: 519, w: 130, h: 110 },
  { base: CRYSTAL_BASE, name: "cluster-medium", x: 30, y: 742, w: 110, h: 90 },
  { base: CRYSTAL_BASE, name: "cluster-wide", x: 166, y: 676, w: 120, h: 80 },
  { base: AUTOTILE_BASE, name: "covered-l", x: 373, y: 190, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "open-blue-l-rotated", x: 7, y: -22, w: 144, h: 140 },
  { base: AUTOTILE_BASE, name: "open-blue-l", x: 272, y: 421, w: 144, h: 140 },
  { base: AUTOTILE_BASE, name: "covered-square", x: 199, y: 242, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-square", x: 267, y: 784, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "open-red-square", x: 197, y: 85, w: 128, h: 128 },
];
