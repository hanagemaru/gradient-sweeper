# ゲームロジック詳細

## 概要

このドキュメントでは、Gradient Sweeperのゲームロジックを詳細に説明する。

---

## 1. 盤面生成

### 1.1 パラメータ

| 項目 | 値 |
|------|-----|
| グリッドサイズ | 9 × 9（固定） |
| セル総数 | 81 |
| 爆弾タイプ | 赤（red）、青（blue） |
| 爆弾配置比率 | ランダム |

### 1.2 生成アルゴリズム

```typescript
function generateBoard(bombCount: number): Board {
  const GRID_SIZE = 9;
  const cells: Cell[][] = [];
  
  // 1. 空のセルで初期化
  for (let row = 0; row < GRID_SIZE; row++) {
    cells[row] = [];
    for (let col = 0; col < GRID_SIZE; col++) {
      cells[row][col] = {
        row,
        col,
        state: 'hidden',
        hasBomb: false,
        bombType: null,
        adjacentRed: 0,
        adjacentBlue: 0,
      };
    }
  }
  
  // 2. 爆弾を配置
  const positions = shufflePositions(GRID_SIZE * GRID_SIZE);
  for (let i = 0; i < bombCount; i++) {
    const pos = positions[i];
    const row = Math.floor(pos / GRID_SIZE);
    const col = pos % GRID_SIZE;
    cells[row][col].hasBomb = true;
    cells[row][col].bombType = Math.random() < 0.5 ? 'red' : 'blue';
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
```

### 1.3 隣接セルの定義

8方向（上下左右＋斜め4方向）

```typescript
const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],          [0, 1],
  [1, -1],  [1, 0], [1, 1],
];

function getAdjacentCells(cells: Cell[][], row: number, col: number): Cell[] {
  return DIRECTIONS
    .map(([dr, dc]) => [row + dr, col + dc])
    .filter(([r, c]) => r >= 0 && r < 9 && c >= 0 && c < 9)
    .map(([r, c]) => cells[r][c]);
}
```

---

## 2. 色計算

### 2.1 ルール

隣接8マスの爆弾数を `r`（赤）、`b`（青）とする。

1. `r == 0 && b == 0` → 白 `(255, 255, 255)`
2. `t = (r + b) / 8`（爆弾密度、0〜1）
3. ベースカラー（G=0固定）:
   - `r >= b && r > 0`: `(255, 0, 255 * b / r)`
   - `b > r`: `(255 * r / b, 0, 255)`
4. 最終色 = `(1 - t) * 255 + t * base`（各チャンネル）

### 2.2 実装

```typescript
function getCellColor(r: number, b: number): [number, number, number] {
  // 爆弾がない場合は白
  if (r === 0 && b === 0) {
    return [255, 255, 255];
  }
  
  // 爆弾密度
  const t = (r + b) / 8;
  
  // ベースカラー計算
  let base: [number, number, number];
  if (r >= b && r > 0) {
    // 赤優勢: 赤ベース、青成分は比率で決定
    base = [255, 0, Math.round(255 * (b / r))];
  } else {
    // 青優勢: 青ベース、赤成分は比率で決定
    base = [Math.round(255 * (r / b)), 0, 255];
  }
  
  // 白からベースカラーへのグラデーション
  return base.map((ch) => 
    Math.min(255, Math.max(0, Math.round((1 - t) * 255 + t * ch)))
  ) as [number, number, number];
}
```

### 2.3 色の例

| r | b | RGB | 見た目 |
|---|---|-----|--------|
| 0 | 0 | (255, 255, 255) | 白 |
| 1 | 0 | (255, 223, 223) | 薄いピンク |
| 0 | 1 | (223, 223, 255) | 薄い青 |
| 4 | 0 | (255, 127, 127) | 濃いピンク |
| 0 | 4 | (127, 127, 255) | 濃い青 |
| 2 | 2 | (191, 127, 191) | 薄い紫 |
| 4 | 4 | (255, 0, 255) | マゼンタ |

---

## 3. セルを開く

### 3.1 ロジック

```typescript
function revealCell(board: Board, row: number, col: number): RevealResult {
  const cell = board.cells[row][col];
  
  // すでに開いている or フラグ付き → 何もしない
  if (cell.state !== 'hidden') {
    return { type: 'noop' };
  }
  
  // 爆弾を踏んだ
  if (cell.hasBomb) {
    cell.state = 'exploded';
    return { type: 'bomb', cell };
  }
  
  // 安全なセル
  cell.state = 'revealed';
  
  // 隣接爆弾が0なら連鎖的に開く
  if (cell.adjacentRed === 0 && cell.adjacentBlue === 0) {
    const revealed = [cell];
    const queue = getAdjacentCells(board.cells, row, col);
    
    while (queue.length > 0) {
      const next = queue.shift()!;
      if (next.state !== 'hidden' || next.hasBomb) continue;
      
      next.state = 'revealed';
      revealed.push(next);
      
      if (next.adjacentRed === 0 && next.adjacentBlue === 0) {
        queue.push(...getAdjacentCells(board.cells, next.row, next.col));
      }
    }
    
    return { type: 'reveal', cells: revealed };
  }
  
  return { type: 'reveal', cells: [cell] };
}
```

### 3.2 連鎖の条件

`adjacentRed + adjacentBlue === 0` のとき、周囲8マスを再帰的に開く。

---

## 4. フラグ操作

```typescript
function toggleFlag(board: Board, row: number, col: number): void {
  const cell = board.cells[row][col];
  
  if (cell.state === 'hidden') {
    cell.state = 'flagged';
  } else if (cell.state === 'flagged') {
    cell.state = 'hidden';
  }
  // revealed, exploded の場合は何もしない
}
```

---

## 5. 勝利判定

```typescript
function checkWin(board: Board): boolean {
  for (const row of board.cells) {
    for (const cell of row) {
      // 爆弾でないセルが hidden または flagged なら未クリア
      if (!cell.hasBomb && cell.state !== 'revealed') {
        return false;
      }
    }
  }
  return true;
}
```

---

## 6. ミス処理

### 6.1 Endless モード

```typescript
function handleMissEndless(state: GameState): GameState {
  const cell = getExplodedCell(state.board);
  
  // 踏んだマスを未開に戻す
  cell.state = 'hidden';
  
  return {
    ...state,
    lives: state.lives - 1,
    missCount: state.missCount + 1,
  };
}
```

### 6.2 Time Attack モード

```typescript
function handleMissTA(state: GameState): GameState {
  return {
    ...state,
    missCount: state.missCount + 1,
    isGameOver: true,
  };
}

function reviveTA(state: GameState): GameState {
  const cell = getExplodedCell(state.board);
  cell.state = 'hidden';
  
  return {
    ...state,
    reviveCount: state.reviveCount + 1,
    isGameOver: false,
  };
}
```

---

## 7. レベル進行（Endless）

```typescript
function advanceLevel(state: GameState): GameState {
  const newBombCount = Math.min(state.bombCount + 1, 80);
  const newBoard = generateBoard(newBombCount);
  
  return {
    ...state,
    level: state.level + 1,
    bombCount: newBombCount,
    board: newBoard,
  };
}
```

---

## 8. 型定義

```typescript
type CellState = 'hidden' | 'revealed' | 'flagged' | 'exploded';
type BombType = 'red' | 'blue';

interface Cell {
  row: number;
  col: number;
  state: CellState;
  hasBomb: boolean;
  bombType: BombType | null;
  adjacentRed: number;
  adjacentBlue: number;
}

interface Board {
  cells: Cell[][];
  bombCount: number;
}

interface GameState {
  mode: 'endless' | 'ta';
  difficulty?: 'easy' | 'mid' | 'hard';
  board: Board;
  bombCount: number;
  lives: number;
  missCount: number;
  reviveCount: number;
  level: number;
  isPaused: boolean;
  isGameOver: boolean;
  isCleared: boolean;
  elapsedMs: number;
}
```

---

*最終更新: 2026-02-02*
