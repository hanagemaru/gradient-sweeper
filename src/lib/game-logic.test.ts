import { describe, expect, it } from "vitest";
import { GRID_SIZE, type Board } from "@/types/game";
import { checkWin, generateBoard, revealCell, toggleFlag } from "./game-logic";

/**
 * テストランナーが動いていることを示すための最小限のテスト。
 *
 * 本格的なカバレッジは `docs/tasks/D-tests.md` の担当。
 * 特に連鎖開放（BFS）の網羅は D で厚く書くこと。ここでは触りだけ。
 */

function allCells(board: Board) {
  return board.cells.flat();
}

function countBombs(board: Board) {
  return allCells(board).filter((cell) => cell.hasBomb).length;
}

describe("generateBoard", () => {
  it("指定した数の爆弾を置く", () => {
    for (const bombCount of [1, 3, 10, 30, 80]) {
      expect(countBombs(generateBoard(bombCount))).toBe(bombCount);
    }
  });

  it("すべての爆弾に色がついている", () => {
    const board = generateBoard(20);
    for (const cell of allCells(board)) {
      if (cell.hasBomb) {
        expect(cell.bombType === "red" || cell.bombType === "blue").toBe(true);
      } else {
        expect(cell.bombType).toBeNull();
      }
    }
  });

  it("隣接数が実際の爆弾配置と一致する", () => {
    const board = generateBoard(15);

    for (let row = 0; row < GRID_SIZE; row += 1) {
      for (let col = 0; col < GRID_SIZE; col += 1) {
        let red = 0;
        let blue = 0;

        for (let dr = -1; dr <= 1; dr += 1) {
          for (let dc = -1; dc <= 1; dc += 1) {
            if (dr === 0 && dc === 0) continue;
            const neighbor = board.cells[row + dr]?.[col + dc];
            if (!neighbor?.hasBomb) continue;
            if (neighbor.bombType === "red") red += 1;
            else blue += 1;
          }
        }

        expect({ red, blue }).toEqual({
          red: board.cells[row][col].adjacentRed,
          blue: board.cells[row][col].adjacentBlue,
        });
      }
    }
  });

  it("最初はすべてのセルが hidden", () => {
    expect(allCells(generateBoard(10)).every((cell) => cell.state === "hidden")).toBe(true);
  });
});

describe("revealCell", () => {
  it("爆弾のないセルを開くと revealed になる", () => {
    const board = generateBoard(0);
    const result = revealCell(board, 4, 4);

    expect(result.type).toBe("reveal");
    expect(board.cells[4][4].state).toBe("revealed");
  });

  it("爆弾が0個なら盤面全体が連鎖して開く", () => {
    const board = generateBoard(0);
    const result = revealCell(board, 0, 0);

    expect(result.type).toBe("reveal");
    if (result.type !== "reveal") return;
    expect(result.cells.length).toBe(GRID_SIZE * GRID_SIZE);
  });

  it("すでに開いているセルは noop", () => {
    const board = generateBoard(0);
    revealCell(board, 4, 4);

    expect(revealCell(board, 4, 4).type).toBe("noop");
  });
});

describe("toggleFlag", () => {
  it("hidden と flagged を行き来する", () => {
    const board = generateBoard(10);

    toggleFlag(board, 0, 0);
    expect(board.cells[0][0].state).toBe("flagged");

    toggleFlag(board, 0, 0);
    expect(board.cells[0][0].state).toBe("hidden");
  });

  it("開いているセルには効かない", () => {
    const board = generateBoard(0);
    revealCell(board, 4, 4);
    toggleFlag(board, 4, 4);

    expect(board.cells[4][4].state).toBe("revealed");
  });
});

describe("checkWin", () => {
  it("爆弾以外がすべて開いていれば勝利", () => {
    const board = generateBoard(0);
    expect(checkWin(board)).toBe(false);

    revealCell(board, 0, 0);
    expect(checkWin(board)).toBe(true);
  });

  it("旗を立てただけでは勝利にならない", () => {
    const board = generateBoard(0);

    for (let row = 0; row < GRID_SIZE; row += 1) {
      for (let col = 0; col < GRID_SIZE; col += 1) {
        toggleFlag(board, row, col);
      }
    }

    expect(checkWin(board)).toBe(false);
  });
});
