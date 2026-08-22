"use client";

import { useRef, useCallback } from "react";

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

interface UseSwipeOptions {
  /** スワイプと判定する最小距離（キャンバス px。既定は cellSize） */
  threshold?: number;
  onSwipe: (row: number, col: number) => void;
  onTap: (row: number, col: number) => void;
  getCellFromPoint: (x: number, y: number) => { row: number; col: number } | null;
  /**
   * ビューポート px とキャンバス px の比。
   *
   * タッチイベントの座標はビューポート px だが、`threshold` はセルの一辺と同じ
   * キャンバス px で決めている。固定キャンバスは機種ごとに 0.83〜1.10 倍で
   * 拡大縮小されるので、換算しないと旗を立てるのに必要なドラッグ量が機種で変わる。
   */
  getScale?: () => number;
}

export function useSwipe({
  threshold = 36, // デフォルトは cellSize
  onSwipe,
  onTap,
  getCellFromPoint,
  getScale,
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
      // ビューポート px → キャンバス px。threshold と単位を揃える
      const scale = getScale?.() || 1;
      const distance = Math.sqrt(dx * dx + dy * dy) / scale;

      // スワイプ判定
      if (distance >= threshold) {
        swipeTriggeredRef.current = true;
        onSwipe(startCellRef.current.row, startCellRef.current.col);
      }
    },
    [threshold, onSwipe, getScale]
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
