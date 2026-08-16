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
  { base: AUTOTILE_BASE, name: "covered-l-rotated", x: -96, y: 317, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "open-blue-l-rotated", x: -47, y: 537, w: 144, h: 140 },
  { base: AUTOTILE_BASE, name: "open-blue-l", x: -34, y: 797, w: 144, h: 140 },
  { base: CRYSTAL_BASE, name: "accent-small", x: 298, y: 32, w: 40, h: 40 },
  { base: CRYSTAL_BASE, name: "cluster-medium", x: 134, y: 520, w: 110, h: 90 },
  { base: CRYSTAL_BASE, name: "cluster-wide", x: 78, y: 696, w: 120, h: 80 },
  { base: AUTOTILE_BASE, name: "open-red-tall", x: 80, y: -9, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-l-rotated", x: 294, y: 317, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-l", x: 136, y: 797, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "open-blue-l-rotated", x: 343, y: 537, w: 144, h: 140 },
  { base: AUTOTILE_BASE, name: "covered-wide", x: 224, y: 122, w: 192, h: 128 },
  { base: AUTOTILE_BASE, name: "open-blue-l", x: 134, y: 315, w: 144, h: 140 },
];
