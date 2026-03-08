"use client";

import { useRef, useCallback, useEffect } from "react";
import { Board as BoardType, GRID_SIZE } from "@/types/game";
import { Cell } from "./Cell";
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

  const getCellFromPoint = useCallback(
    (x: number, y: number): { row: number; col: number } | null => {
      if (!boardRef.current) return null;

      const rect = boardRef.current.getBoundingClientRect();
      const relX = x - rect.left;
      const relY = y - rect.top;

      // CSS変数から値を取得
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
    []
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
    threshold: 36, // cellSize
    onSwipe: handleSwipe,
    onTap: handleTap,
    getCellFromPoint,
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
      className="game-board inline-grid touch-none isolate"
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
    </div>
  );
}
