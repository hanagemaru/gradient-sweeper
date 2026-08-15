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
  { base: AUTOTILE_BASE, name: "covered-tall", x: -4, y: 241, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "open-purple-tall", x: -16, y: 527, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-square", x: -61, y: 816, w: 128, h: 128 },
  { base: CRYSTAL_BASE, name: "accent-small", x: -23, y: 756, w: 40, h: 40 },
  { base: AUTOTILE_BASE, name: "covered-square", x: -71, y: -98, w: 128, h: 128 },
  { base: CRYSTAL_BASE, name: "accent-small", x: 209, y: 30, w: 40, h: 40 },
  { base: CRYSTAL_BASE, name: "cluster-medium", x: 145, y: 617, w: 110, h: 90 },
  { base: AUTOTILE_BASE, name: "open-purple-l", x: 16, y: 50, w: 144, h: 140 },
  { base: AUTOTILE_BASE, name: "open-purple-l", x: 155, y: 755, w: 144, h: 140 },
  { base: AUTOTILE_BASE, name: "covered-tall", x: 386, y: 241, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "open-blue-l", x: 211, y: 376, w: 144, h: 140 },
  { base: AUTOTILE_BASE, name: "open-purple-tall", x: 374, y: 527, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "open-blue-square", x: 146, y: -125, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-square", x: 329, y: 816, w: 128, h: 128 },
  { base: CRYSTAL_BASE, name: "accent-small", x: 367, y: 756, w: 40, h: 40 },
  { base: AUTOTILE_BASE, name: "covered-square", x: 181, y: 191, w: 128, h: 128 },
  { base: CRYSTAL_BASE, name: "accent-small", x: 286, y: 557, w: 40, h: 40 },
  { base: CRYSTAL_BASE, name: "accent-small", x: 95, y: 464, w: 40, h: 40 },
  { base: AUTOTILE_BASE, name: "covered-square", x: 319, y: -98, w: 128, h: 128 },
];
