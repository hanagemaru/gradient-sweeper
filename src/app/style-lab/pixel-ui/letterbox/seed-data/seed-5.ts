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
  { base: AUTOTILE_BASE, name: "open-red-wide", x: -34, y: 154, w: 192, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-step", x: -183, y: 679, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-l", x: -2, y: -86, w: 192, h: 192 },
  { base: CRYSTAL_BASE, name: "accent-small", x: -24, y: 583, w: 40, h: 40 },
  { base: CRYSTAL_BASE, name: "accent-small", x: 234, y: 53, w: 40, h: 40 },
  { base: CRYSTAL_BASE, name: "cluster-medium", x: 221, y: 481, w: 110, h: 90 },
  { base: AUTOTILE_BASE, name: "open-red-wide", x: 356, y: 154, w: 192, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-tall", x: 53, y: 577, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-step", x: 207, y: 679, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-l", x: 388, y: -86, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-square", x: 179, y: 220, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "open-blue-l", x: 15, y: 336, w: 144, h: 140 },
  { base: CRYSTAL_BASE, name: "accent-small", x: 366, y: 583, w: 40, h: 40 },
  { base: CRYSTAL_BASE, name: "cluster-wide", x: 215, y: 370, w: 120, h: 80 },
  { base: AUTOTILE_BASE, name: "covered-square", x: 237, y: -94, w: 128, h: 128 },
  { base: CRYSTAL_BASE, name: "cluster-wide", x: 71, y: 806, w: 120, h: 80 },
];
