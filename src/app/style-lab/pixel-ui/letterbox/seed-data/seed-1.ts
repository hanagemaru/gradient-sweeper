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
  { base: AUTOTILE_BASE, name: "open-red-square", x: -115, y: 446, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-tall", x: -93, y: 146, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-tall", x: -74, y: 836, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-square", x: -13, y: -25, w: 128, h: 128 },
  { base: CRYSTAL_BASE, name: "accent-small", x: 217, y: 120, w: 40, h: 40 },
  { base: CRYSTAL_BASE, name: "cluster-large", x: 137, y: 177, w: 130, h: 110 },
  { base: CRYSTAL_BASE, name: "cluster-medium", x: 262, y: 714, w: 110, h: 90 },
  { base: CRYSTAL_BASE, name: "cluster-wide", x: 116, y: 758, w: 120, h: 80 },
  { base: AUTOTILE_BASE, name: "open-red-square", x: 275, y: 446, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-tall", x: 297, y: 146, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-tall", x: 316, y: 836, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "open-purple-step", x: 39, y: 468, w: 192, h: 140 },
  { base: AUTOTILE_BASE, name: "covered-wide", x: 147, y: -105, w: 192, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-square", x: 377, y: -25, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "open-purple-l-rotated", x: 73, y: 311, w: 144, h: 140 },
];
