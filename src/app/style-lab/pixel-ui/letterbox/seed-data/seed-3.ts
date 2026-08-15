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
  { base: AUTOTILE_BASE, name: "open-purple-tall", x: -27, y: 168, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "open-purple-tall", x: -43, y: -187, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-wide", x: -191, y: 585, w: 192, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-square", x: -45, y: 767, w: 128, h: 128 },
  { base: CRYSTAL_BASE, name: "accent-small", x: -10, y: 446, w: 40, h: 40 },
  { base: CRYSTAL_BASE, name: "accent-small", x: 234, y: 32, w: 40, h: 40 },
  { base: CRYSTAL_BASE, name: "cluster-medium", x: 131, y: 453, w: 110, h: 90 },
  { base: AUTOTILE_BASE, name: "open-purple-tall", x: 363, y: 168, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "open-purple-tall", x: 347, y: -187, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-wide", x: 199, y: 585, w: 192, h: 128 },
  { base: AUTOTILE_BASE, name: "open-blue-wide", x: 132, y: 740, w: 192, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-square", x: 204, y: 301, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-square", x: 345, y: 767, w: 128, h: 128 },
  { base: CRYSTAL_BASE, name: "accent-small", x: 380, y: 446, w: 40, h: 40 },
  { base: CRYSTAL_BASE, name: "cluster-large", x: 24, y: 603, w: 130, h: 110 },
  { base: AUTOTILE_BASE, name: "open-blue-square", x: 142, y: 105, w: 128, h: 128 },
];
