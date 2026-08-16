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
  { base: AUTOTILE_BASE, name: "open-blue-tall", x: -35, y: 200, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-wide", x: -12, y: 513, w: 192, h: 128 },
  { base: AUTOTILE_BASE, name: "open-blue-square", x: -30, y: -13, w: 128, h: 128 },
  { base: CRYSTAL_BASE, name: "accent-small", x: 117, y: 23, w: 40, h: 40 },
  { base: CRYSTAL_BASE, name: "cluster-medium", x: 73, y: 712, w: 110, h: 90 },
  { base: CRYSTAL_BASE, name: "cluster-wide", x: 238, y: 518, w: 120, h: 80 },
  { base: AUTOTILE_BASE, name: "open-red-square", x: 213, y: 25, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-tall", x: 232, y: 773, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "open-blue-square", x: 218, y: 627, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "open-blue-l", x: 191, y: 305, w: 144, h: 140 },
];
