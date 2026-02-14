"use client";

import { useState, useCallback, useRef } from "react";

export interface ScorePopupItem {
  id: string;
  value: number;
  x: number;
  y: number;
  /** テキストラベル（設定時はvalueの代わりにこちらを表示） */
  label?: string;
}

const POPUP_DURATION_MS = 1000;

/**
 * スコアポップアップの管理フック
 * popup追加 → 一定時間後に自動削除
 */
export function useScorePopup() {
  const [popups, setPopups] = useState<ScorePopupItem[]>([]);
  const idCounterRef = useRef(0);

  const addPopup = useCallback((value: number, x: number, y: number, label?: string) => {
    const id = `popup-${Date.now()}-${idCounterRef.current++}`;
    const newPopup: ScorePopupItem = { id, value, x, y, label };

    setPopups((prev) => [...prev, newPopup]);

    // 自動削除
    setTimeout(() => {
      setPopups((prev) => prev.filter((p) => p.id !== id));
    }, POPUP_DURATION_MS);
  }, []);

  const clearPopups = useCallback(() => {
    setPopups([]);
  }, []);

  return { popups, addPopup, clearPopups };
}
