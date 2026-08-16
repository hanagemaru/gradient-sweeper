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
  { base: AUTOTILE_BASE, name: "covered-square", x: -41, y: 795, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-square", x: -57, y: 271, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "open-blue-l", x: -65, y: 31, w: 144, h: 140 },
  { base: CRYSTAL_BASE, name: "accent-small", x: 252, y: 25, w: 40, h: 40 },
  { base: CRYSTAL_BASE, name: "cluster-large", x: 78, y: 623, w: 130, h: 110 },
  { base: CRYSTAL_BASE, name: "cluster-medium", x: 238, y: 656, w: 110, h: 90 },
  { base: CRYSTAL_BASE, name: "cluster-wide", x: 253, y: 510, w: 120, h: 80 },
  { base: AUTOTILE_BASE, name: "covered-square", x: 349, y: 795, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-square", x: 333, y: 271, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "open-purple-l", x: 97, y: 340, w: 144, h: 140 },
  { base: AUTOTILE_BASE, name: "covered-step", x: 35, y: -184, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-tall", x: 124, y: 104, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "open-blue-l", x: 325, y: 31, w: 144, h: 140 },
  { base: AUTOTILE_BASE, name: "open-blue-l", x: 163, y: 766, w: 144, h: 140 },
];
