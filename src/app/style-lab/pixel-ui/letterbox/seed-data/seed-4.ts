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
  { base: AUTOTILE_BASE, name: "covered-l-rotated", x: -139, y: 171, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-l-rotated", x: -160, y: 746, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-square", x: -73, y: -117, w: 128, h: 128 },
  { base: CRYSTAL_BASE, name: "cluster-large", x: -123, y: 619, w: 130, h: 110 },
  { base: CRYSTAL_BASE, name: "accent-small", x: 289, y: 47, w: 40, h: 40 },
  { base: CRYSTAL_BASE, name: "cluster-medium", x: 84, y: 455, w: 110, h: 90 },
  { base: AUTOTILE_BASE, name: "covered-l-rotated", x: 251, y: 171, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-l-rotated", x: 230, y: 746, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-square", x: 317, y: -117, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-tall", x: 71, y: -16, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-tall", x: 260, y: 408, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "open-purple-square", x: 57, y: 840, w: 128, h: 128 },
  { base: CRYSTAL_BASE, name: "accent-small", x: 38, y: 622, w: 40, h: 40 },
  { base: AUTOTILE_BASE, name: "open-blue-tall", x: 85, y: 241, w: 128, h: 192 },
  { base: CRYSTAL_BASE, name: "cluster-wide", x: 108, y: 631, w: 120, h: 80 },
  { base: CRYSTAL_BASE, name: "cluster-large", x: 267, y: 619, w: 130, h: 110 },
];
