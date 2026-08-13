"use client";

import { memo, useEffect, useRef } from "react";
import { Board as BoardType } from "@/types/game";
import { useTileBurst, type BurstSource } from "@/hooks/useTileBurst";
import styles from "./TileBurst.module.css";

interface TileBurstProps {
  board: BoardType;
}

/**
 * 盤面に重ねる破片用のキャンバス。
 *
 * 盤面の上に絶対配置した canvas 1枚で、開いたマスから飛ぶ破片をすべて描く。
 * セルごとに DOM を足さないので、連鎖で数十マスが同時に開いてもノード数は変わらない。
 *
 * 開いたセルは、前回描画時との盤面の差分から拾う。
 * こうしておくと発生源が盤面の状態だけで決まり、ゲーム画面側に配線を足さずに済む。
 * （`revealCell` の戻り値を引き回すには、レーン外の `src/app/game/page.tsx` を通す必要がある）
 */
function TileBurstComponent({ board }: TileBurstProps) {
  const { canvasRef, burst } = useTileBurst();

  /** 前回の「開いているか」。初回は null なので、既に開いているセルでは破片を出さない */
  const openedRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    const rows = board.cells.length;
    const cols = rows > 0 ? board.cells[0].length : 0;
    const previous = openedRef.current;
    const opened = new Uint8Array(rows * cols);
    const sources: BurstSource[] = [];

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const cell = board.cells[row][col];
        // 爆弾のマスは専用の爆発エフェクトがあるので対象外
        const isOpen = cell.state === "revealed" && !cell.hasBomb;
        const index = row * cols + col;
        opened[index] = isOpen ? 1 : 0;

        if (isOpen && previous !== null && previous.length === opened.length && !previous[index]) {
          sources.push({
            row,
            col,
            adjacentRed: cell.adjacentRed,
            adjacentBlue: cell.adjacentBlue,
          });
        }
      }
    }

    openedRef.current = opened;
    burst(sources);
  }, [board, burst]);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}

export const TileBurst = memo(TileBurstComponent);
