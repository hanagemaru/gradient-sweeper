import {
  Cell,
  Board,
  RevealResult,
  GRID_SIZE,
} from "@/types/game";

// 8方向
const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],          [0, 1],
  [1, -1],  [1, 0], [1, 1],
] as const;

/**
 * 色計算
 * @param r 隣接する赤爆弾の数
 * @param b 隣接する青爆弾の数
 * @returns [R, G, B] (0-255)
 */
export function getCellColor(r: number, b: number): [number, number, number] {
  // 爆弾がない場合は白
  if (r === 0 && b === 0) {
    return [255, 255, 255];
  }

  // 爆弾密度
  const t = (r + b) / 8;

  // ベースカラー計算（G=0固定）
  let base: [number, number, number];
  if (r >= b && r > 0) {
    // 赤優勢
    base = [255, 0, Math.round(255 * (b / r))];
  } else {
    // 青優勢
    base = [Math.round(255 * (r / b)), 0, 255];
  }

  // 白からベースカラーへのグラデーション
  return base.map((ch) =>
    Math.min(255, Math.max(0, Math.round((1 - t) * 255 + t * ch)))
  ) as [number, number, number];
}

/**
 * RGB値をCSS形式に変換
 */
export function rgbToString(rgb: [number, number, number]): string {
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

/**
 * 配列をシャッフル
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 隣接セルを取得
 */
export function getAdjacentCells(cells: Cell[][], row: number, col: number): Cell[] {
  return DIRECTIONS
    .map(([dr, dc]) => [row + dr, col + dc])
    .filter(([r, c]) => r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE)
    .map(([r, c]) => cells[r][c]);
}

/**
 * 隣接する爆弾数をカウント
 */
function countAdjacentBombs(
  cells: Cell[][],
  row: number,
  col: number
): { red: number; blue: number } {
  const adjacent = getAdjacentCells(cells, row, col);
  let red = 0;
  let blue = 0;

  for (const cell of adjacent) {
    if (cell.hasBomb) {
      if (cell.bombType === "red") red++;
      else if (cell.bombType === "blue") blue++;
    }
  }

  return { red, blue };
}

/**
 * 盤面を生成
 */
export function generateBoard(bombCount: number): Board {
  const cells: Cell[][] = [];

  // 1. 空のセルで初期化
  for (let row = 0; row < GRID_SIZE; row++) {
    cells[row] = [];
    for (let col = 0; col < GRID_SIZE; col++) {
      cells[row][col] = {
        row,
        col,
        state: "hidden",
        hasBomb: false,
        bombType: null,
        adjacentRed: 0,
        adjacentBlue: 0,
      };
    }
  }

  // 2. 爆弾を配置
  const positions = shuffleArray(
    Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => i)
  );

  for (let i = 0; i < bombCount; i++) {
    const pos = positions[i];
    const row = Math.floor(pos / GRID_SIZE);
    const col = pos % GRID_SIZE;
    cells[row][col].hasBomb = true;
    cells[row][col].bombType = Math.random() < 0.5 ? "red" : "blue";
  }

  // 3. 隣接爆弾数を計算
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const { red, blue } = countAdjacentBombs(cells, row, col);
      cells[row][col].adjacentRed = red;
      cells[row][col].adjacentBlue = blue;
    }
  }

  return { cells, bombCount };
}

/**
 * セルを開く
 */
export function revealCell(board: Board, row: number, col: number): RevealResult {
  const cell = board.cells[row][col];

  // すでに開いている or フラグ付き → 何もしない
  if (cell.state !== "hidden") {
    return { type: "noop" };
  }

  // 爆弾を踏んだ
  if (cell.hasBomb) {
    cell.state = "exploded";
    return { type: "bomb", cell };
  }

  // 安全なセル
  cell.state = "revealed";

  // 隣接爆弾が0なら連鎖的に開く
  if (cell.adjacentRed === 0 && cell.adjacentBlue === 0) {
    const revealed = [cell];
    const queue = getAdjacentCells(board.cells, row, col);
    const visited = new Set<string>();
    visited.add(`${row},${col}`);

    while (queue.length > 0) {
      const next = queue.shift()!;
      const key = `${next.row},${next.col}`;

      if (visited.has(key)) continue;
      visited.add(key);

      if (next.state !== "hidden" || next.hasBomb) continue;

      next.state = "revealed";
      revealed.push(next);

      if (next.adjacentRed === 0 && next.adjacentBlue === 0) {
        queue.push(...getAdjacentCells(board.cells, next.row, next.col));
      }
    }

    return { type: "reveal", cells: revealed };
  }

  return { type: "reveal", cells: [cell] };
}

/**
 * フラグを切り替え
 */
export function toggleFlag(board: Board, row: number, col: number): void {
  const cell = board.cells[row][col];

  if (cell.state === "hidden") {
    cell.state = "flagged";
  } else if (cell.state === "flagged") {
    cell.state = "hidden";
  }
}

/**
 * 勝利判定
 */
export function checkWin(board: Board): boolean {
  for (const row of board.cells) {
    for (const cell of row) {
      // 爆弾でないセルが hidden または flagged なら未クリア
      if (!cell.hasBomb && cell.state !== "revealed") {
        return false;
      }
    }
  }
  return true;
}

/**
 * 爆発したセルを取得
 */
export function getExplodedCell(board: Board): Cell | null {
  for (const row of board.cells) {
    for (const cell of row) {
      if (cell.state === "exploded") {
        return cell;
      }
    }
  }
  return null;
}

/**
 * 爆発したセルを未開状態に戻す
 */
export function resetExplodedCell(board: Board): void {
  const cell = getExplodedCell(board);
  if (cell) {
    cell.state = "hidden";
  }
}

/**
 * 盤面を深くコピー
 */
export function cloneBoard(board: Board): Board {
  return {
    ...board,
    cells: board.cells.map((row) =>
      row.map((cell) => ({ ...cell }))
    ),
  };
}
