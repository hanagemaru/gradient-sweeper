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
  { base: AUTOTILE_BASE, name: "covered-l-rotated", x: -57, y: 758, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "open-blue-l", x: -79, y: 219, w: 144, h: 140 },
  { base: CRYSTAL_BASE, name: "accent-small", x: 193, y: 52, w: 40, h: 40 },
  { base: CRYSTAL_BASE, name: "cluster-medium", x: 201, y: 538, w: 110, h: 90 },
  { base: CRYSTAL_BASE, name: "cluster-wide", x: 184, y: 721, w: 120, h: 80 },
  { base: AUTOTILE_BASE, name: "open-red-l-rotated", x: 2, y: 504, w: 144, h: 140 },
  { base: AUTOTILE_BASE, name: "covered-l-rotated", x: 333, y: 758, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-square", x: 21, y: -73, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-l-rotated", x: 97, y: 209, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "open-blue-l", x: 311, y: 219, w: 144, h: 140 },
  { base: AUTOTILE_BASE, name: "open-blue-tall", x: 253, y: -73, w: 128, h: 192 },
];
