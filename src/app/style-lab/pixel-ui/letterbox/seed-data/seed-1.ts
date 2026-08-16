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
  { base: AUTOTILE_BASE, name: "open-purple-square", x: -40, y: 353, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-square", x: -17, y: 778, w: 128, h: 128 },
  { base: CRYSTAL_BASE, name: "accent-small", x: 217, y: 8, w: 40, h: 40 },
  { base: CRYSTAL_BASE, name: "cluster-large", x: 137, y: 724, w: 130, h: 110 },
  { base: CRYSTAL_BASE, name: "cluster-medium", x: 262, y: 570, w: 110, h: 90 },
  { base: CRYSTAL_BASE, name: "cluster-wide", x: 124, y: 625, w: 120, h: 80 },
  { base: AUTOTILE_BASE, name: "open-red-square", x: 237, y: 73, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-l", x: 107, y: 352, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "open-purple-square", x: 350, y: 353, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-step", x: 6, y: -157, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-square", x: 373, y: 778, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-square", x: 37, y: 101, w: 128, h: 128 },
];
