"use client";

import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { formatTime } from "@/hooks/useTimer";

interface TimerDisplayProps {
  /** 計測中かどうか。false の間は止まり、true に戻ると続きから再開する */
  running: boolean;
  /** 表示に加算するペナルティ時間 */
  penaltyMs: number;
  /**
   * 経過時間の書き込み先。
   * 親は結果画面へ渡すときにこの ref を読む。
   * state ではなく ref にすることで、親は 100ms ごとの更新で再描画されない。
   */
  elapsedRef: MutableRefObject<number>;
}

const TICK_MS = 100;

/**
 * 経過時間の表示。
 *
 * 計測の state をこのコンポーネントの中に閉じ込めるためだけに存在する。
 * 以前は `/game` ページ本体が useTimer の state を持っていたため、
 * 100ms ごとに盤面の81セルまで巻き込んで再描画されていた。
 * ここに閉じ込めると、再描画されるのはこの数字だけになる。
 */
export function TimerDisplay({ running, penaltyMs, elapsedRef }: TimerDisplayProps) {
  const [elapsedMs, setElapsedMs] = useState(elapsedRef.current);
  const lastTickRef = useRef(0);

  useEffect(() => {
    if (!running) return;

    lastTickRef.current = Date.now();

    const intervalId = setInterval(() => {
      const now = Date.now();
      elapsedRef.current += now - lastTickRef.current;
      lastTickRef.current = now;
      setElapsedMs(elapsedRef.current);
    }, TICK_MS);

    return () => clearInterval(intervalId);
  }, [running, elapsedRef]);

  return <strong>{formatTime(elapsedMs + penaltyMs)}</strong>;
}
