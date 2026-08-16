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
  { base: AUTOTILE_BASE, name: "open-blue-l", x: -120, y: -138, w: 144, h: 140 },
  { base: AUTOTILE_BASE, name: "covered-tall", x: -18, y: 834, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-square", x: -104, y: 259, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-square", x: -89, y: 555, w: 128, h: 128 },
  { base: CRYSTAL_BASE, name: "accent-small", x: 315, y: 160, w: 40, h: 40 },
  { base: CRYSTAL_BASE, name: "cluster-large", x: 63, y: 33, w: 130, h: 110 },
  { base: CRYSTAL_BASE, name: "cluster-medium", x: 71, y: 725, w: 110, h: 90 },
  { base: CRYSTAL_BASE, name: "cluster-wide", x: 202, y: 704, w: 120, h: 80 },
  { base: AUTOTILE_BASE, name: "open-blue-tall", x: 42, y: 176, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-l", x: 70, y: 404, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "open-blue-l", x: 270, y: -138, w: 144, h: 140 },
  { base: AUTOTILE_BASE, name: "covered-tall", x: 372, y: 834, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-square", x: 286, y: 259, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-square", x: 301, y: 555, w: 128, h: 128 },
];
