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
  { base: AUTOTILE_BASE, name: "open-blue-wide", x: -18, y: 372, w: 192, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-step", x: -77, y: 83, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "open-blue-wide", x: -180, y: -92, w: 192, h: 128 },
  { base: CRYSTAL_BASE, name: "accent-small", x: 193, y: 52, w: 40, h: 40 },
  { base: CRYSTAL_BASE, name: "cluster-medium", x: 201, y: 538, w: 110, h: 90 },
  { base: CRYSTAL_BASE, name: "cluster-wide", x: 184, y: 721, w: 120, h: 80 },
  { base: AUTOTILE_BASE, name: "open-blue-wide", x: 372, y: 372, w: 192, h: 128 },
  { base: AUTOTILE_BASE, name: "covered-tall", x: 6, y: 645, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-step", x: 313, y: 83, w: 192, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-tall", x: 43, y: -168, w: 128, h: 192 },
  { base: AUTOTILE_BASE, name: "covered-square", x: 168, y: 171, w: 128, h: 128 },
  { base: AUTOTILE_BASE, name: "open-blue-l", x: 206, y: 330, w: 144, h: 140 },
  { base: AUTOTILE_BASE, name: "open-blue-wide", x: 210, y: -92, w: 192, h: 128 },
];
