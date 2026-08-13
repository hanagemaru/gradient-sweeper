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
 * @param excluded 爆弾を置かないマス（座標を row * GRID_SIZE + col で表したもの）
 */
export function generateBoard(bombCount: number, excluded?: Set<number>): Board {
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

  // 2. 爆弾を配置（除外マスは候補から取り除く。引き直しループにはしない）
  const positions = shuffleArray(
    Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => i)
      .filter((i) => !excluded?.has(i))
  );

  // 候補が足りなければ置ける分だけに切る。
  // 現在の呼び出し（MAX_BOMBS=80、フォールバック時の空き80）では起きないが、
  // 余裕がゼロなので、上限や除外範囲を変えたときに静かに壊れるのを防ぐ。
  const placeable = Math.min(bombCount, positions.length);

  for (let i = 0; i < placeable; i++) {
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

  // 実際に置けた数を返す（要求数と食い違ったまま盤面が嘘をつかないように）
  return { cells, bombCount: placeable };
}

// 3x3除外で確保できる爆弾数の上限（81 - 9）
const MAX_BOMBS_FOR_ZONE_EXCLUSION = GRID_SIZE * GRID_SIZE - 9;

/**
 * 初手保証のための除外マスを計算する
 *
 * 通常はタップしたマスとその周囲8マス（3x3）を除外する。
 * 除外後の候補マス数（72）を超える爆弾数の場合、3x3では爆弾を置き切れないため、
 * タップしたマス1つだけを除外するフォールバックに落とす。
 */
export function getFirstClickExclusions(
  row: number,
  col: number,
  bombCount: number
): Set<number> {
  const tapped = row * GRID_SIZE + col;

  if (bombCount > MAX_BOMBS_FOR_ZONE_EXCLUSION) {
    return new Set([tapped]);
  }

  const excluded = new Set<number>([tapped]);
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
        excluded.add(r * GRID_SIZE + c);
      }
    }
  }

  return excluded;
}

/**
 * 初手用に盤面を作り直す
 *
 * 引き直すのは爆弾の配置だけで、プレイヤーがすでに立てた旗は引き継ぐ。
 * 爆弾の位置はまだ見えていないので作り直しても矛盾しないが、
 * 旗はプレイヤー自身が置いて画面で見ているものなので、消すと矛盾になる。
 */
export function regenerateForFirstClick(
  board: Board,
  bombCount: number,
  row: number,
  col: number
): Board {
  const next = generateBoard(
    bombCount,
    getFirstClickExclusions(row, col, bombCount)
  );

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (board.cells[r][c].state === "flagged") {
        next.cells[r][c].state = "flagged";
      }
    }
  }

  return next;
}

/**
 * その盤面がまだ初手かどうかを判定する
 *
 * 状態は持たず、盤面から導出する。開いたセル（revealed / exploded）が
 * 1つも無ければ初手とみなす。旗（flagged）は判定に影響しない。
 */
export function isFirstClick(board: Board): boolean {
  return board.cells.every((row) =>
    row.every((cell) => cell.state !== "revealed" && cell.state !== "exploded")
  );
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
    cell.state = "flagged";
  }
}

/**
 * フラグが立っているセルの数をカウント
 */
export function countFlags(board: Board): number {
  let count = 0;
  for (const row of board.cells) {
    for (const cell of row) {
      if (cell.state === "flagged") {
        count++;
      }
    }
  }
  return count;
}

/**
 * すべての爆弾を表示状態にする（答え合わせ用）
 */
export function revealAllBombs(board: Board): void {
  for (const row of board.cells) {
    for (const cell of row) {
      if (cell.hasBomb && cell.state !== "revealed") {
        cell.state = "revealed";
      }
    }
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
