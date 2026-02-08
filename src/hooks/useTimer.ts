"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface UseTimerReturn {
  elapsedMs: number;
  isRunning: boolean;
  start: () => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
}

export function useTimer(): UseTimerReturn {
  const [elapsedMs, setElapsedMs] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTickRef = useRef<number>(0);
  // isRunning を ref で管理して stale closure を防ぐ
  const isRunningRef = useRef(false);
  const [isRunning, setIsRunning] = useState(false);

  const clearTimerInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startInterval = useCallback(() => {
    clearTimerInterval();
    lastTickRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;
      setElapsedMs((prev) => prev + delta);
    }, 100);
  }, [clearTimerInterval]);

  // すべての関数は ref を参照するので依存配列が安定し、stale closure が起きない
  const start = useCallback(() => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    setIsRunning(true);
    startInterval();
  }, [startInterval]);

  const stop = useCallback(() => {
    clearTimerInterval();
    isRunningRef.current = false;
    setIsRunning(false);
  }, [clearTimerInterval]);

  const pause = useCallback(() => {
    clearTimerInterval();
    isRunningRef.current = false;
    setIsRunning(false);
  }, [clearTimerInterval]);

  const resume = useCallback(() => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    setIsRunning(true);
    startInterval();
  }, [startInterval]);

  const reset = useCallback(() => {
    clearTimerInterval();
    isRunningRef.current = false;
    setIsRunning(false);
    setElapsedMs(0);
  }, [clearTimerInterval]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      clearTimerInterval();
    };
  }, [clearTimerInterval]);

  return {
    elapsedMs,
    isRunning,
    start,
    stop,
    pause,
    resume,
    reset,
  };
}

/**
 * ミリ秒を MM:SS.ss 形式にフォーマット
 */
export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((ms % 1000) / 10);

  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`;
}
