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
  { base: AUTOTILE_BASE, name: "covered-l-rotated", x: -92, y: 477, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-step", x: -101, y: 841, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "open-blue-l", x: -44, y: -79, w: 144, h: 140 },
  { base: AUTOTILE_BASE, name: "covered-square", x: -1, y: 306, w: 128, h: 128 },
  { base: CRYSTAL_BASE, name: "accent-small", x: 252, y: 159, w: 40, h: 40 },
  { base: CRYSTAL_BASE, name: "cluster-large", x: 78, y: 106, w: 130, h: 110 },
  { base: CRYSTAL_BASE, name: "cluster-medium", x: 238, y: 732, w: 110, h: 90 },
  { base: CRYSTAL_BASE, name: "cluster-wide", x: 42, y: 689, w: 120, h: 80 },
  { base: AUTOTILE_BASE, name: "covered-l-rotated", x: 298, y: 477, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-tall", x: 181, y: 256, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-step", x: 289, y: 841, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "open-blue-l", x: 346, y: -79, w: 144, h: 140 },
  { base: AUTOTILE_BASE, name: "covered-square", x: 389, y: 306, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "open-blue-square", x: 183, y: -70, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "open-blue-square", x: 141, y: 544, w: 128, h: 128 },
];
