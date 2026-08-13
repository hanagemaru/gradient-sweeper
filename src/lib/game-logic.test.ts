import { describe, expect, it } from "vitest";
import { GRID_SIZE, type Board } from "@/types/game";
import {
  checkWin,
  countFlags,
  generateBoard,
  getFirstClickExclusions,
  isFirstClick,
  regenerateForFirstClick,
  revealCell,
  toggleFlag,
} from "./game-logic";

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

describe("getFirstClickExclusions", () => {
  it("通常時はタップしたマスと周囲8マス（3x3）を除外する", () => {
    const excluded = getFirstClickExclusions(4, 4, 10);
    expect(excluded.size).toBe(9);
    expect(excluded.has(4 * GRID_SIZE + 4)).toBe(true);
  });

  it("盤面の端では3x3が欠けるぶんだけ除外マスが減る", () => {
    expect(getFirstClickExclusions(0, 0, 10).size).toBe(4); // 角
    expect(getFirstClickExclusions(0, 4, 10).size).toBe(6); // 辺
  });

  it("境界値: 爆弾72個ちょうどなら3x3除外のまま", () => {
    expect(getFirstClickExclusions(4, 4, 72).size).toBe(9);
  });

  it("境界値: 爆弾73個ではタップしたマス1つだけの除外にフォールバックする", () => {
    const excluded = getFirstClickExclusions(4, 4, 73);
    expect(excluded.size).toBe(1);
    expect(excluded.has(4 * GRID_SIZE + 4)).toBe(true);
  });

  it("MAX_BOMBS（80個）でもフォールバックが働く", () => {
    expect(getFirstClickExclusions(4, 4, 80).size).toBe(1);
  });

  it("MAX_BOMBS（80個）は1マス除外後の空き（80）とちょうど一致する", () => {
    const excluded = getFirstClickExclusions(4, 4, 80);
    expect(GRID_SIZE * GRID_SIZE - excluded.size).toBe(80);
  });
});

describe("generateBoard の除外リスト", () => {
  it("除外したマスに爆弾が置かれない", () => {
    for (let trial = 0; trial < 20; trial += 1) {
      const excluded = getFirstClickExclusions(4, 4, 30);
      const board = generateBoard(30, excluded);
      for (const pos of excluded) {
        const row = Math.floor(pos / GRID_SIZE);
        const col = pos % GRID_SIZE;
        expect(board.cells[row][col].hasBomb).toBe(false);
      }
    }
  });

  it("除外しても指定した爆弾数はちゃんと置かれる", () => {
    const excluded = getFirstClickExclusions(4, 4, 30);
    expect(countBombs(generateBoard(30, excluded))).toBe(30);
  });

  it("3x3を除外したとき、中心の隣接数が0になる", () => {
    const excluded = getFirstClickExclusions(4, 4, 10);
    const board = generateBoard(10, excluded);
    expect(board.cells[4][4].adjacentRed).toBe(0);
    expect(board.cells[4][4].adjacentBlue).toBe(0);
  });

  it("境界値: 爆弾72個超は1マス除外だけで生成に失敗しない", () => {
    for (const bombCount of [73, 80]) {
      const excluded = getFirstClickExclusions(4, 4, bombCount);
      const board = generateBoard(bombCount, excluded);
      expect(countBombs(board)).toBe(bombCount);
      expect(board.cells[4][4].hasBomb).toBe(false);
    }
  });

  it("候補より多い爆弾数を要求されても落ちず、置ける分だけに切る", () => {
    // 現在の呼び出しでは起きない組み合わせだが、上限を変えたときに
    // undefined 参照でクラッシュしないことを保証する
    const excluded = new Set([0, 1, 2]);
    const board = generateBoard(GRID_SIZE * GRID_SIZE, excluded);

    expect(countBombs(board)).toBe(GRID_SIZE * GRID_SIZE - excluded.size);
    expect(board.bombCount).toBe(GRID_SIZE * GRID_SIZE - excluded.size);
  });

  it("境界値: 爆弾72個ちょうどは3x3除外のまま生成できる", () => {
    const excluded = getFirstClickExclusions(4, 4, 72);
    const board = generateBoard(72, excluded);
    expect(countBombs(board)).toBe(72);
    for (const pos of excluded) {
      const row = Math.floor(pos / GRID_SIZE);
      const col = pos % GRID_SIZE;
      expect(board.cells[row][col].hasBomb).toBe(false);
    }
  });
});

describe("初手保証", () => {
  it("初手は必ず連鎖して複数マス開く（爆弾72個以下）", () => {
    for (const bombCount of [10, 30, 72]) {
      for (const [row, col] of [[4, 4], [0, 0], [0, 8]] as const) {
        const excluded = getFirstClickExclusions(row, col, bombCount);
        const board = generateBoard(bombCount, excluded);
        const result = revealCell(board, row, col);

        expect(result.type).toBe("reveal");
        if (result.type === "reveal") {
          expect(result.cells.length).toBeGreaterThan(1);
        }
      }
    }
  });

  it("爆弾72個超（フォールバック時）でもタップしたマスは爆発しない", () => {
    for (const bombCount of [73, 80]) {
      for (let trial = 0; trial < 20; trial += 1) {
        const excluded = getFirstClickExclusions(0, 0, bombCount);
        const board = generateBoard(bombCount, excluded);
        const result = revealCell(board, 0, 0);

        expect(result.type).not.toBe("bomb");
      }
    }
  });

  it("盤面を作り直しても、すでに立てた旗は引き継がれる", () => {
    const board = generateBoard(10);
    toggleFlag(board, 0, 0);
    toggleFlag(board, 8, 8);
    toggleFlag(board, 3, 3); // 除外される3x3の中の旗

    const next = regenerateForFirstClick(board, 10, 4, 4);

    expect(next.cells[0][0].state).toBe("flagged");
    expect(next.cells[8][8].state).toBe("flagged");
    expect(next.cells[3][3].state).toBe("flagged");
    expect(countFlags(next)).toBe(3);
  });

  it("旗を引き継いでも初手の安全性と除外は保たれる", () => {
    const board = generateBoard(30);
    toggleFlag(board, 0, 0);

    const next = regenerateForFirstClick(board, 30, 4, 4);

    expect(countBombs(next)).toBe(30);
    for (let dr = -1; dr <= 1; dr += 1) {
      for (let dc = -1; dc <= 1; dc += 1) {
        expect(next.cells[4 + dr][4 + dc].hasBomb).toBe(false);
      }
    }
  });

  it("旗を立てたマスをタップしても開かない（旗が消えないので noop のまま）", () => {
    const board = generateBoard(10);
    toggleFlag(board, 4, 4);

    const next = regenerateForFirstClick(board, 10, 4, 4);

    expect(revealCell(next, 4, 4).type).toBe("noop");
    expect(next.cells[4][4].state).toBe("flagged");
  });

  it("isFirstClick は開いたセルが1つも無ければtrueを返す", () => {
    expect(isFirstClick(generateBoard(10))).toBe(true);
  });

  it("isFirstClick はセルが開いた後はfalseを返す（＝初手以降は保証が働かない）", () => {
    const board = generateBoard(0);
    revealCell(board, 4, 4);

    expect(isFirstClick(board)).toBe(false);
  });

  it("旗を立てただけでは初手判定は変わらない", () => {
    const board = generateBoard(10);
    toggleFlag(board, 0, 0);

    expect(isFirstClick(board)).toBe(true);
  });

  it("新しく生成した盤面は常に初手扱いになる（レベルアップ時も自動的に初手保証される）", () => {
    const board = generateBoard(10);
    revealCell(board, 4, 4);
    expect(isFirstClick(board)).toBe(false);

    const nextLevelBoard = generateBoard(11);
    expect(isFirstClick(nextLevelBoard)).toBe(true);
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
