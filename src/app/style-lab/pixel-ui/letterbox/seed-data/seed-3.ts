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
  { base: AUTOTILE_BASE, name: "open-purple-l", x: -85, y: 366, w: 144, h: 140 },
  { base: AUTOTILE_BASE, name: "open-blue-l", x: -106, y: 551, w: 144, h: 140 },
  { base: AUTOTILE_BASE, name: "open-blue-square", x: -113, y: 187, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "open-blue-l", x: -6, y: -106, w: 144, h: 140 },
  { base: CRYSTAL_BASE, name: "accent-small", x: 248, y: 125, w: 40, h: 40 },
  { base: CRYSTAL_BASE, name: "cluster-large", x: 73, y: 108, w: 130, h: 110 },
  { base: CRYSTAL_BASE, name: "cluster-medium", x: 61, y: 704, w: 110, h: 90 },
  { base: CRYSTAL_BASE, name: "cluster-wide", x: 188, y: 713, w: 120, h: 80 },
  { base: AUTOTILE_BASE, name: "open-red-l", x: 82, y: 534, w: 144, h: 140 },
  { base: AUTOTILE_BASE, name: "open-purple-l", x: 305, y: 366, w: 144, h: 140 },
  { base: AUTOTILE_BASE, name: "open-red-step", x: 163, y: -83, w: 192, h: 140 },
  { base: AUTOTILE_BASE, name: "covered-square", x: 122, y: 368, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-step", x: 128, y: 826, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "open-blue-l", x: 284, y: 551, w: 144, h: 140 },
  { base: AUTOTILE_BASE, name: "open-blue-square", x: 277, y: 187, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "open-blue-l", x: 384, y: -106, w: 144, h: 140 },
];
