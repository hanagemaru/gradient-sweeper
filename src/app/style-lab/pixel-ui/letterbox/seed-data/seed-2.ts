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
  { base: AUTOTILE_BASE, name: "covered-l-rotated", x: -41, y: 836, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "open-blue-step", x: -183, y: -110, w: 192, h: 140 },
  { base: AUTOTILE_BASE, name: "covered-square", x: -56, y: 281, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "open-blue-square", x: -31, y: 672, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "open-blue-l-rotated", x: -78, y: 100, w: 144, h: 140 },
  { base: CRYSTAL_BASE, name: "accent-small", x: 193, y: 52, w: 40, h: 40 },
  { base: CRYSTAL_BASE, name: "cluster-medium", x: 201, y: 538, w: 110, h: 90 },
  { base: CRYSTAL_BASE, name: "cluster-wide", x: 184, y: 721, w: 120, h: 80 },
  { base: AUTOTILE_BASE, name: "open-red-l-rotated", x: 2, y: 504, w: 144, h: 140 },
  { base: AUTOTILE_BASE, name: "covered-l-rotated", x: 349, y: 836, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-tall", x: 32, y: -107, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-l", x: 105, y: 216, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "open-blue-step", x: 207, y: -110, w: 192, h: 140 },
  { base: AUTOTILE_BASE, name: "covered-square", x: 334, y: 281, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "open-blue-square", x: 359, y: 672, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "open-blue-l-rotated", x: 312, y: 100, w: 144, h: 140 },
];
