"use client";

import { useRef, useCallback } from "react";
import { Board as BoardType, GRID_SIZE } from "@/types/game";
import { Cell } from "./Cell";
import { useSwipe } from "@/hooks/useSwipe";

interface BoardProps {
  board: BoardType;
  onReveal: (row: number, col: number) => void;
  onFlag: (row: number, col: number) => void;
  disabled?: boolean;
}

export function Board({ board, onReveal, onFlag, disabled = false }: BoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);

  const getCellFromPoint = useCallback(
    (x: number, y: number): { row: number; col: number } | null => {
      if (!boardRef.current) return null;

      const rect = boardRef.current.getBoundingClientRect();
      const relX = x - rect.left;
      const relY = y - rect.top;

      // CSS変数から値を取得
      const style = getComputedStyle(boardRef.current);
      const cellSize = parseFloat(style.getPropertyValue("--cell-size")) || 36;
      const gap = parseFloat(style.getPropertyValue("--gap")) || 2;

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
      className="game-board inline-grid touch-none"
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
          <Cell key={`${rowIndex}-${colIndex}`} cell={cell} />
        ))
      )}
    </div>
  );
}
