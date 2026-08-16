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
  { base: AUTOTILE_BASE, name: "covered-step", x: -4, y: 819, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-wide", x: -3, y: 69, w: 192, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-square", x: -53, y: 498, w: 128, h: 128 },
  { base: CRYSTAL_BASE, name: "accent-small", x: 248, y: 10, w: 40, h: 40 },
  { base: CRYSTAL_BASE, name: "cluster-large", x: 119, y: 517, w: 130, h: 110 },
  { base: CRYSTAL_BASE, name: "cluster-medium", x: 216, y: 718, w: 110, h: 90 },
  { base: CRYSTAL_BASE, name: "cluster-wide", x: 49, y: 676, w: 120, h: 80 },
  { base: AUTOTILE_BASE, name: "open-red-square", x: 93, y: -122, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-tall", x: 212, y: 250, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "open-purple-tall", x: 30, y: 281, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-step", x: 386, y: 819, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-wide", x: 387, y: 69, w: 192, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-square", x: 337, y: 498, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-square", x: 238, y: 67, w: 128, h: 128 },
];
