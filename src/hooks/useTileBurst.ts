"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";
import { MAX_ADJACENT, proposedColor } from "@/lib/ice-colors";

/**
 * マスを開けたときに飛び散る破片。
 *
 * ## DOM を増やさないこと
 *
 * 1回の連鎖で数十セルが同時に開くため、破片を DOM 要素で作ると
 * 一瞬で数百ノードが生成・破棄される。盤面は `Cell` の memo 化で
 * 「タイマー更新のたびに81セル再描画」を潰してあるので、その成果を打ち消してしまう。
 *
 * ここでは盤面に重ねた `<canvas>` 1枚にすべての破片を描く。増える DOM は canvas 1個だけ。
 *
 * ## 常時負荷を残さないこと
 *
 * `requestAnimationFrame` のループは破片が1個もなくなった時点で止める。
 * 回しっぱなしにすると、何も起きていない画面でも毎フレーム起こされてバッテリーを食う。
 */

/** 破片1個あたりの数値フィールド数（x, y, vx, vy, age, life, size） */
const FIELDS = 7;
const F_X = 0;
const F_Y = 1;
const F_VX = 2;
const F_VY = 3;
const F_AGE = 4;
const F_LIFE = 5;
const F_SIZE = 6;

/** 同時に存在できる破片の上限。全81セルが一度に開いても収まる数にしてある */
const MAX_PARTICLES = 260;

/** 重力（px/秒^2）。跳ね上がってから落ちるまでが 0.4〜0.6 秒に収まる強さ */
const GRAVITY = 620;

/**
 * 飛び散り方のパターン。開いたセルごとに1つ選ぶ。
 *
 * 1種類だけだと、連鎖で並んだセルが同じ形に弾けて機械的に見える。
 * セル単位で振ることで、同じ連鎖の中でも弾け方が揃わない。
 * 寿命はどのパターンでも 0.4〜0.6 秒の範囲に収めている。
 */
interface BurstPattern {
  /** 上向きの初速（px/秒） */
  jumpMin: number;
  jumpSpan: number;
  /** 横方向の初速の広がり（px/秒） */
  spread: number;
  /** 左右どちらかに寄せる強さ（px/秒）。0 なら対称に散る */
  bias: number;
  /** 発生位置の散らばり（セルの一辺に対する比） */
  scatter: number;
  lifeMin: number;
  lifeSpan: number;
}

const PATTERNS: readonly BurstPattern[] = [
  /** 高く跳ね上がる */
  { jumpMin: 115, jumpSpan: 55, spread: 55, bias: 0, scatter: 0.45, lifeMin: 0.45, lifeSpan: 0.15 },
  /** 低く横へ大きく広がる */
  { jumpMin: 55, jumpSpan: 45, spread: 155, bias: 0, scatter: 0.6, lifeMin: 0.4, lifeSpan: 0.15 },
  /** 片側へ寄って飛ぶ */
  { jumpMin: 80, jumpSpan: 60, spread: 70, bias: 75, scatter: 0.5, lifeMin: 0.42, lifeSpan: 0.18 },
  /** 手前で細かく散る */
  { jumpMin: 45, jumpSpan: 50, spread: 105, bias: 0, scatter: 0.7, lifeMin: 0.4, lifeSpan: 0.12 },
];

/**
 * 破片の一辺（px）。ピクセルアートなので角ばった四角のまま扱う。
 * 1px の縁取りが付くので、これ以下にすると縁ばかりになって本体の色が読めない。
 */
const SIZE_MIN = 3;
const SIZE_SPAN = 1;

/** 寿命の終盤で薄くする閾値と、そのときの不透明度 */
const FADE_AT = 0.65;
const FADE_ALPHA = 0.55;

/**
 * キャンバスが盤面より外側にはみ出す量（px）。
 * これがないと上端の行から飛んだ破片が盤面の縁で切れる。
 * `TileBurst.module.css` の値と揃えること。
 */
export const BURST_BLEED = 6;

/** タブ復帰時に dt が跳ねて破片が吹き飛ぶのを防ぐ上限（秒） */
const MAX_DELTA = 0.05;

export interface BurstSource {
  row: number;
  col: number;
  adjacentRed: number;
  adjacentBlue: number;
}

/**
 * 縁取りの色味と混ぜる割合。
 *
 * 黒方向に暗くすると、ほぼ白のタイルの破片では黒い線に見えて浮いてしまう。
 * 氷の水色に寄せて薄く混ぜると、盤面の罫線と同じ系統の色になって輪郭だけが主張しない。
 */
const EDGE_TINT = { r: 74, g: 134, b: 180 } as const;
const EDGE_MIX = 0.3;

interface FragmentColor {
  /** 破片の本体。盤面のセルとまったく同じ色 */
  fill: string;
  /**
   * 1px の縁取り。
   * 隣接0のタイルはほぼ白なので、本体だけだと明るい盤面に溶けて破片が見えない。
   * ピクセルアートの流儀どおり輪郭を1px入れて、色は本体側で保つ。
   */
  edge: string;
}

/**
 * 隣接数から破片の色を引く。
 * 盤面のセルとまったく同じ `proposedColor()` を使う。破片の色が元のマスとずれると演出の意味がなくなる。
 * 取りうる組み合わせは45通りしかないので結果を覚えておく。
 */
const colorCache = new Map<number, FragmentColor>();

/** 本体の色に氷の水色を混ぜて縁取りの色を作る */
function edgeColor(hex: string): string {
  const value = parseInt(hex.slice(1), 16);
  const keep = 1 - EDGE_MIX;
  const r = Math.round(((value >> 16) & 0xff) * keep + EDGE_TINT.r * EDGE_MIX);
  const g = Math.round(((value >> 8) & 0xff) * keep + EDGE_TINT.g * EDGE_MIX);
  const b = Math.round((value & 0xff) * keep + EDGE_TINT.b * EDGE_MIX);
  return `rgb(${r},${g},${b})`;
}

function colorFor(red: number, blue: number): FragmentColor {
  const key = red * (MAX_ADJACENT + 1) + blue;
  const cached = colorCache.get(key);
  if (cached !== undefined) return cached;

  const fill = proposedColor(red, blue).hex;
  const color: FragmentColor = { fill, edge: edgeColor(fill) };
  colorCache.set(key, color);
  return color;
}

/**
 * 同時に開いたセル数から、1セルあたりの破片数を決める。
 * 連鎖で大量に開いたときに1セルぶんを減らし、総数が跳ね上がらないようにする。
 */
function fragmentsPerCell(cellCount: number): number {
  if (cellCount <= 4) return 7;
  if (cellCount <= 12) return 4;
  if (cellCount <= 30) return 3;
  return 2;
}

interface Geometry {
  /** セルの一辺（px） */
  cell: number;
  /** 隣のセルまでの距離（セル + すき間、px） */
  step: number;
}

function readGeometry(canvas: HTMLCanvasElement): Geometry {
  const host = canvas.parentElement ?? canvas;
  const style = getComputedStyle(host);
  const cell = parseFloat(style.getPropertyValue("--cell-size")) || 36;
  const gap = parseFloat(style.getPropertyValue("--gap")) || 0;
  return { cell, step: cell + gap };
}

export interface TileBurstController {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  /** 開いたセルの位置と隣接数を渡すと、そのセルの色で破片が飛ぶ */
  burst: (sources: BurstSource[]) => void;
}

export function useTileBurst(): TileBurstController {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  // 破片は毎フレーム生成・破棄されるので、オブジェクトではなく固定長の数値配列に持つ。
  // GC を発生させないことが、連鎖でカクつかせないための条件になる。
  const dataRef = useRef<Float32Array>(new Float32Array(MAX_PARTICLES * FIELDS));
  const colorsRef = useRef<FragmentColor[]>(new Array<FragmentColor>(MAX_PARTICLES));
  const countRef = useRef(0);

  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const geometryRef = useRef<Geometry>({ cell: 36, step: 36 });
  const reduceMotionRef = useRef(false);

  /** 論理サイズ（CSS px）。描画位置の計算に使う */
  const sizeRef = useRef({ width: 0, height: 0 });

  // 端末の DPR に合わせて実解像度を上げる。等倍のままだと破片がぼやける
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (width === 0 || height === 0) return;

      const dpr = window.devicePixelRatio || 1;
      const nextWidth = Math.round(width * dpr);
      const nextHeight = Math.round(height * dpr);

      if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
        canvas.width = nextWidth;
        canvas.height = nextHeight;
      }

      sizeRef.current = { width, height };
      geometryRef.current = readGeometry(canvas);

      const ctx = canvas.getContext("2d");
      if (ctx) {
        // 以降は CSS px で描ける
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.imageSmoothingEnabled = false;
        ctxRef.current = ctx;
      }
    };

    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    // DPR はウィンドウのズームやディスプレイ間の移動で変わる
    window.addEventListener("resize", resize);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, []);

  // prefers-reduced-motion。設定変更に追随できるよう購読しておく
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduceMotionRef.current = query.matches;

    const onChange = (event: MediaQueryListEvent) => {
      reduceMotionRef.current = event.matches;
      if (event.matches) {
        countRef.current = 0;
      }
    };

    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const clear = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const { width, height } = sizeRef.current;
    ctx.clearRect(0, 0, width, height);
  }, []);

  const draw = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    const data = dataRef.current;
    const colors = colorsRef.current;
    const count = countRef.current;
    const { width, height } = sizeRef.current;

    ctx.clearRect(0, 0, width, height);

    // 縁取り → 本体の2パス。1つずつ塗り分けるより fillStyle の切り替えが減り、
    // 破片同士が重なっても縁が本体の上に乗らない
    for (let pass = 0; pass < 2; pass += 1) {
      let currentColor = "";
      let currentAlpha = 1;
      ctx.globalAlpha = 1;

      for (let i = 0; i < count; i += 1) {
        const base = i * FIELDS;
        const color = pass === 0 ? colors[i].edge : colors[i].fill;
        if (color !== currentColor) {
          ctx.fillStyle = color;
          currentColor = color;
        }

        const ratio = data[base + F_AGE] / data[base + F_LIFE];
        const alpha = ratio > FADE_AT ? FADE_ALPHA : 1;
        if (alpha !== currentAlpha) {
          ctx.globalAlpha = alpha;
          currentAlpha = alpha;
        }

        // ピクセルアートなので座標を整数に落として四角の角を立てる
        const size = data[base + F_SIZE];
        const x = Math.round(data[base + F_X]);
        const y = Math.round(data[base + F_Y]);

        if (pass === 0) {
          ctx.fillRect(x - 1, y - 1, size + 2, size + 2);
        } else {
          ctx.fillRect(x, y, size, size);
        }
      }
    }

    ctx.globalAlpha = 1;
  }, []);

  const step = useCallback(
    (now: number) => {
      rafRef.current = null;

      const delta = Math.min((now - lastTimeRef.current) / 1000, MAX_DELTA);
      lastTimeRef.current = now;

      const data = dataRef.current;
      const colors = colorsRef.current;
      const height = sizeRef.current.height;

      let count = countRef.current;
      let i = 0;

      while (i < count) {
        const base = i * FIELDS;
        const age = data[base + F_AGE] + delta;

        // 寿命切れ、または下に抜けた破片は末尾と入れ替えて詰める（順序は見た目に影響しない）
        if (age >= data[base + F_LIFE] || data[base + F_Y] > height) {
          count -= 1;
          const last = count * FIELDS;
          for (let f = 0; f < FIELDS; f += 1) {
            data[base + f] = data[last + f];
          }
          colors[i] = colors[count];
          continue;
        }

        data[base + F_AGE] = age;
        data[base + F_VY] += GRAVITY * delta;
        data[base + F_X] += data[base + F_VX] * delta;
        data[base + F_Y] += data[base + F_VY] * delta;
        i += 1;
      }

      countRef.current = count;
      draw();

      // 破片が尽きたらループを止める。次に開いたときに burst() が動かし直す
      if (count > 0) {
        rafRef.current = requestAnimationFrame(step);
      }
    },
    [draw],
  );

  const burst = useCallback(
    (sources: BurstSource[]) => {
      if (sources.length === 0) return;
      if (reduceMotionRef.current) return;
      if (!ctxRef.current || sizeRef.current.width === 0) return;

      const data = dataRef.current;
      const colors = colorsRef.current;
      const { cell, step: cellStep } = geometryRef.current;
      const perCell = fragmentsPerCell(sources.length);

      let count = countRef.current;

      for (const source of sources) {
        if (count >= MAX_PARTICLES) break;

        const color = colorFor(source.adjacentRed, source.adjacentBlue);
        const centerX = BURST_BLEED + source.col * cellStep + cell / 2;
        const centerY = BURST_BLEED + source.row * cellStep + cell / 2;

        // 弾け方はセルごとに選ぶ。連鎖でも隣のセルと同じ形にならない
        const pattern = PATTERNS[Math.floor(Math.random() * PATTERNS.length)];
        const bias = pattern.bias === 0 ? 0 : Math.random() < 0.5 ? -pattern.bias : pattern.bias;

        for (let n = 0; n < perCell && count < MAX_PARTICLES; n += 1) {
          const base = count * FIELDS;
          data[base + F_X] = centerX + (Math.random() - 0.5) * cell * pattern.scatter;
          data[base + F_Y] = centerY + (Math.random() - 0.5) * cell * pattern.scatter * 0.8;
          data[base + F_VX] = bias + (Math.random() - 0.5) * pattern.spread;
          data[base + F_VY] = -(pattern.jumpMin + Math.random() * pattern.jumpSpan);
          data[base + F_AGE] = 0;
          data[base + F_LIFE] = pattern.lifeMin + Math.random() * pattern.lifeSpan;
          data[base + F_SIZE] = SIZE_MIN + Math.floor(Math.random() * (SIZE_SPAN + 1));
          colors[count] = color;
          count += 1;
        }
      }

      countRef.current = count;

      if (rafRef.current === null) {
        lastTimeRef.current = performance.now();
        rafRef.current = requestAnimationFrame(step);
      }
    },
    [step],
  );

  // アンマウント時にループを確実に止める
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      countRef.current = 0;
    };
  }, []);

  // 破片が残ったままタブを離れると復帰時に一瞬止まった絵が見えるので消しておく
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState !== "hidden") return;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      countRef.current = 0;
      clear();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [clear]);

  return { canvasRef, burst };
}
