"use client";

import { useRef, useCallback } from "react";

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

interface UseSwipeOptions {
  threshold?: number; // スワイプと判定する最小距離（px）
  onSwipe: (row: number, col: number) => void;
  onTap: (row: number, col: number) => void;
  getCellFromPoint: (x: number, y: number) => { row: number; col: number } | null;
}

export function useSwipe({
  threshold = 36, // デフォルトは cellSize
  onSwipe,
  onTap,
  getCellFromPoint,
}: UseSwipeOptions): SwipeHandlers {
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const startCellRef = useRef<{ row: number; col: number } | null>(null);
  const swipeTriggeredRef = useRef(false);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      startPosRef.current = { x: touch.clientX, y: touch.clientY };
      swipeTriggeredRef.current = false;

      const cell = getCellFromPoint(touch.clientX, touch.clientY);
      startCellRef.current = cell;
    },
    [getCellFromPoint]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!startPosRef.current || !startCellRef.current || swipeTriggeredRef.current) {
        return;
      }

      const touch = e.touches[0];
      const dx = touch.clientX - startPosRef.current.x;
      const dy = touch.clientY - startPosRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // スワイプ判定
      if (distance >= threshold) {
        swipeTriggeredRef.current = true;
        onSwipe(startCellRef.current.row, startCellRef.current.col);
      }
    },
    [threshold, onSwipe]
  );

  const onTouchEnd = useCallback(
    (_e: React.TouchEvent) => {
      // スワイプが成立していなければタップとして処理
      if (!swipeTriggeredRef.current && startCellRef.current) {
        onTap(startCellRef.current.row, startCellRef.current.col);
      }

      // リセット
      startPosRef.current = null;
      startCellRef.current = null;
      swipeTriggeredRef.current = false;
    },
    [onTap]
  );

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}
