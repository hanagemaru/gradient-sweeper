/**
 * 背景装飾のセルモチーフ。
 *
 * `scripts/generate-motif-masks.mjs` が生成したマスクを、
 * 盤面と同じ「背景色 + マスクを overlay」の方式で描く。
 *
 * 既存の36pxタイルを拡大する方式は採っていない。
 * 拡大すると1ドットが数px角になり、盤面よりザラつきが粗くなって
 * 画面内でドットの大きさが揃わなくなるため。
 * マスクは最初から表示サイズぶんのドット数で生成してある。
 */

export const MOTIF_BASE = "/assets/frostbound/motifs-v1";

export interface MotifSpec {
  name: string;
  width: number;
  height: number;
}

/** 生成済みのモチーフ。scripts/generate-motif-masks.mjs の MOTIFS と対応する */
export const MOTIFS: MotifSpec[] = [
  { name: "square-lg", width: 168, height: 168 },
  { name: "square-md", width: 120, height: 120 },
  { name: "square-sm", width: 84, height: 84 },
  { name: "rect-wide", width: 192, height: 108 },
  { name: "rect-tall", width: 108, height: 192 },
  { name: "l-shape", width: 180, height: 180 },
  { name: "l-shape-flip", width: 168, height: 156 },
];

export function motifAsset(name: string): string {
  return `${MOTIF_BASE}/${name}.png`;
}

export function findMotif(name: string): MotifSpec {
  const motif = MOTIFS.find((m) => m.name === name);
  if (!motif) throw new Error(`不明なモチーフ: ${name}`);
  return motif;
}
