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
  { base: AUTOTILE_BASE, name: "covered-square", x: -26, y: 519, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-l", x: -14, y: -191, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-wide", x: -171, y: 133, w: 192, h: 128 },
  { base: AUTOTILE_BASE, name: "open-blue-square", x: -22, y: 370, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "open-blue-square", x: -23, y: 818, w: 128, h: 128 },
  { base: CRYSTAL_BASE, name: "accent-small", x: 223, y: 33, w: 40, h: 40 },
  { base: CRYSTAL_BASE, name: "cluster-medium", x: 256, y: 706, w: 110, h: 90 },
  { base: CRYSTAL_BASE, name: "cluster-wide", x: 174, y: 528, w: 120, h: 80 },
  { base: AUTOTILE_BASE, name: "open-red-square", x: 85, y: 668, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-square", x: 364, y: 519, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-l", x: 376, y: -191, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-step", x: 125, y: 294, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "open-blue-tall", x: 73, y: 77, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-wide", x: 219, y: 133, w: 192, h: 128 },
  { base: AUTOTILE_BASE, name: "open-blue-wide", x: 135, y: 839, w: 192, h: 128 },
  { base: AUTOTILE_BASE, name: "open-blue-square", x: 368, y: 370, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "open-blue-square", x: 367, y: 818, w: 128, h: 128 },
];
