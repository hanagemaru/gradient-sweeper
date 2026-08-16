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
  { base: AUTOTILE_BASE, name: "covered-l-rotated", x: -66, y: 260, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-wide", x: -164, y: -40, w: 192, h: 128 },
  { base: CRYSTAL_BASE, name: "accent-small", x: 238, y: 213, w: 40, h: 40 },
  { base: CRYSTAL_BASE, name: "cluster-large", x: 63, y: 120, w: 130, h: 110 },
  { base: CRYSTAL_BASE, name: "cluster-medium", x: 32, y: 730, w: 110, h: 90 },
  { base: CRYSTAL_BASE, name: "cluster-wide", x: 190, y: 711, w: 120, h: 80 },
  { base: AUTOTILE_BASE, name: "covered-l-rotated", x: 324, y: 260, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-tall", x: 68, y: -111, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-wide", x: 226, y: -40, w: 192, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-l-rotated", x: 173, y: 816, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "open-blue-l-rotated", x: 58, y: 503, w: 144, h: 140 },
  { base: AUTOTILE_BASE, name: "covered-tall", x: 244, y: 490, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "open-purple-l", x: 159, y: 295, w: 144, h: 140 },
];
