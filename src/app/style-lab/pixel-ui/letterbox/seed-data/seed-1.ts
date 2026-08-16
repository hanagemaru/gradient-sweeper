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
  { base: AUTOTILE_BASE, name: "covered-l", x: -108, y: -173, w: 192, h: 192 },
  { base: CRYSTAL_BASE, name: "accent-small", x: 223, y: 33, w: 40, h: 40 },
  { base: CRYSTAL_BASE, name: "cluster-medium", x: 256, y: 706, w: 110, h: 90 },
  { base: CRYSTAL_BASE, name: "cluster-wide", x: 174, y: 528, w: 120, h: 80 },
  { base: AUTOTILE_BASE, name: "open-blue-l-rotated", x: 81, y: 808, w: 144, h: 140 },
  { base: AUTOTILE_BASE, name: "covered-square", x: 253, y: 826, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-l", x: 282, y: -173, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-square", x: 8, y: 460, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-tall", x: 182, y: 114, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "open-blue-square", x: 187, y: 381, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "open-purple-square", x: 9, y: 102, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "open-purple-l", x: 13, y: 293, w: 144, h: 140 },
  { base: AUTOTILE_BASE, name: "open-purple-step", x: 26, y: 624, w: 192, h: 140 },
  { base: AUTOTILE_BASE, name: "covered-square", x: 130, y: -115, w: 128, h: 128 },
];
