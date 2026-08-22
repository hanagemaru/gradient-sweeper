"use client";

import { useRef, useCallback, useEffect } from "react";
import { Board as BoardType, GRID_SIZE } from "@/types/game";
import { Cell } from "./Cell";
import { TileBurst } from "./TileBurst";
import { useSwipe } from "@/hooks/useSwipe";

interface BoardProps {
  board: BoardType;
  onReveal: (row: number, col: number) => void;
  onFlag: (row: number, col: number) => void;
  disabled?: boolean;
  showAllBombs?: boolean;
  maskCells?: boolean;
}

export function Board({ board, onReveal, onFlag, disabled = false, showAllBombs = false, maskCells = false }: BoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);

  // ネイティブ touchmove リスナーでブラウザのスワイプナビゲーションを防止
  // React の SyntheticEvent は passive なので preventDefault() が効かない
  // addEventListener で { passive: false } を指定する必要がある
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;

    const preventNativeSwipe = (e: TouchEvent) => {
      e.preventDefault();
    };

    el.addEventListener("touchmove", preventNativeSwipe, { passive: false });

    return () => {
      el.removeEventListener("touchmove", preventNativeSwipe);
    };
  }, []);

  /**
   * 盤面の実効倍率（ビューポート px / キャンバス px）。
   *
   * 盤面は `PixelScene` の固定キャンバスの中にあり、`.scene` には
   * `transform: scale()` が掛かっている。`getBoundingClientRect()` はその適用後の
   * 実寸を返すので、transform 前の値である `--cell-size`（36px）と直接割り算すると
   * 倍率のぶんだけずれる。
   *
   * 倍率は `rect.width`（transform 後）と `offsetWidth`（transform 前のレイアウト幅）の
   * 比から求める。`.scene` の倍率式を JS 側へ書き写さずに済むので、将来キャンバスの
   * 寸法や倍率式を変えてもここは直さなくてよい。
   */
  const getScale = useCallback((): number => {
    const el = boardRef.current;
    if (!el) return 1;
    const width = el.getBoundingClientRect().width;
    return el.offsetWidth > 0 && width > 0 ? width / el.offsetWidth : 1;
  }, []);

  const getCellFromPoint = useCallback(
    (x: number, y: number): { row: number; col: number } | null => {
      if (!boardRef.current) return null;

      const rect = boardRef.current.getBoundingClientRect();
      // ビューポート px → キャンバス px。以降はすべてキャンバス座標系で扱う
      const scale = getScale();
      const relX = (x - rect.left) / scale;
      const relY = (y - rect.top) / scale;

      // CSS変数から値を取得（transform 前の値なので、上で換算した座標と単位が揃う）
      const style = getComputedStyle(boardRef.current);
      const cellSize = parseFloat(style.getPropertyValue("--cell-size")) || 36;
      const gap = parseFloat(style.getPropertyValue("--gap") || "0");

      const cellWithGap = cellSize + gap;

      const col = Math.floor(relX / cellWithGap);
      const row = Math.floor(relY / cellWithGap);

      if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) {
        return null;
      }

      return { row, col };
    },
    [getScale]
  );

  const handleSwipe = useCallback(
    (row: number, col: number) => {
      if (!disabled) {
        onFlag(row, col);
      }
    },
    [disabled, onFlag]
  );

  const handleTap = useCallback(
    (row: number, col: number) => {
      if (!disabled) {
        onReveal(row, col);
      }
    },
    [disabled, onReveal]
  );

  const swipeHandlers = useSwipe({
    threshold: 36, // cellSize（キャンバス px）
    onSwipe: handleSwipe,
    onTap: handleTap,
    getCellFromPoint,
    getScale,
  });

  // PC用のクリックハンドラ
  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return;
    const cell = getCellFromPoint(e.clientX, e.clientY);
    if (cell) {
      onReveal(cell.row, cell.col);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled) return;
    const cell = getCellFromPoint(e.clientX, e.clientY);
    if (cell) {
      onFlag(cell.row, cell.col);
    }
  };

  return (
    <div
      ref={boardRef}
      className="game-board relative inline-grid touch-none isolate"
      style={{
        gridTemplateColumns: `repeat(${GRID_SIZE}, var(--cell-size))`,
        gap: "var(--gap)",
      }}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      {...swipeHandlers}
    >
      {board.cells.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <Cell key={`${rowIndex}-${colIndex}`} cell={cell} row={rowIndex} col={colIndex} showBomb={showAllBombs && cell.hasBomb} masked={maskCells} />
        ))
      )}

      {/*
        開けたマスの破片。セルごとに要素を足さず、盤面に重ねた canvas 1枚に描く。
        絶対配置なのでグリッドの配置には影響しない。
      */}
      <TileBurst board={board} />
    </div>
  );
}
