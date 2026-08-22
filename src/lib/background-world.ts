// このファイルは scripts/generate-background-world.mjs が生成した固定値です。
// 手で座標を直した場合は、再実行で上書きされるため注意してください。

export const CRYSTAL_BASE = "/assets/frostbound/crystals-v2";
export const AUTOTILE_BASE = "/assets/frostbound/cell-autotile-v2";

export const WORLD_WIDTH = 390;
export const WORLD_HEIGHT = 550;

export type BackgroundPlacement = {
  base: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export const BACKGROUND_WORLD: BackgroundPlacement[] = [
  { base: CRYSTAL_BASE, name: "accent-small", x: 333, y: 17, w: 40, h: 40 },
  { base: CRYSTAL_BASE, name: "cluster-wide", x: 229, y: 468, w: 120, h: 80 },
  { base: AUTOTILE_BASE, name: "open-red-l", x: 161, y: 24, w: 144, h: 140 },
  { base: AUTOTILE_BASE, name: "covered-tall", x: 191, y: 258, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "open-blue-square", x: 3, y: 336, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "open-blue-tall", x: 3, y: 40, w: 128, h: 192 },
];
