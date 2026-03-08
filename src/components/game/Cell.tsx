"use client";

import { Cell as CellType, GRID_SIZE } from "@/types/game";
import { getCellColor, rgbToString } from "@/lib/game-logic";
import { Icon } from "@/components/Icon";

interface CellProps {
  cell: CellType;
  row: number;
  col: number;
  showBomb?: boolean;
  masked?: boolean;
}

// バリアント数（画像ファイル数に合わせて変更）
// 草: /assets/cells/grass-1.png 〜 grass-3.png
//     /assets/cells/grass-flag-1.png 〜 grass-flag-3.png（対応するフラグ付き）
// 土: /assets/cells/soil-1.png 〜 soil-3.png
const GRASS_VARIANTS = 3;
const SOIL_VARIANTS = 3;

// 作成済みの土＋クリスタル画像の組み合わせ（r-b）
const SOIL_CRYSTAL_AVAILABLE = new Set(["1-0", "0-1", "1-1"]);

function getSoilCrystalSrc(r: number, b: number): string | null {
  if (SOIL_CRYSTAL_AVAILABLE.has(`${r}-${b}`)) {
    return `/assets/cells/soil-r${r}-b${b}.png`;
  }
  return null;
}

// セル位置に基づいて毎回同じバリアントを返す決定論的な選択
// hidden と flagged で同じ関数を使うことで、フラグを立てても草模様が変わらない
function getGrassVariant(row: number, col: number): number {
  return ((row * 7 + col * 3 + row * col) % GRASS_VARIANTS) + 1;
}

function getSoilVariant(row: number, col: number): number {
  return ((row * 7 + col * 3 + row * col) % SOIL_VARIANTS) + 1;
}

// grass は 36×40px 表示（上4pxがセル上辺より飛び出す）
const GRASS_W = 36;
const GRASS_H = 40;

// grass-flag は 40×44px 表示（20×22px の実ファイルを width/height で2倍指定）
// transform: scale(2) ではなく明示的サイズにすることで image-rendering: pixelated が確実に効く
const GRASS_FLAG_W = 40; // 20 × 2
const GRASS_FLAG_H = 44; // 22 × 2

export function Cell({ cell, row, col, showBomb = false, masked = false }: CellProps) {
  const { state, adjacentRed, adjacentBlue, hasBomb, bombType } = cell;

  // スタイル計算
  const getCellStyle = (): React.CSSProperties => {
    // マスク時：全セルを閉じた状態で表示
    if (masked) {
      return { backgroundColor: "#374151" };
    }

    // hidden / flagged：草画像が背景を担うので色なし
    if (state === "hidden" || state === "flagged") {
      return {};
    }

    // 答え合わせ中：爆弾セルをハイライト
    if (showBomb && hasBomb) {
      return { backgroundColor: bombType === "red" ? "#fca5a5" : "#93c5fd" };
    }

    if (state === "exploded") {
      return { backgroundColor: "#ef4444" };
    }

    // revealed（r=0, b=0）：soil画像が背景を担うので色なし
    if (adjacentRed === 0 && adjacentBlue === 0) {
      return {};
    }

    // revealed（色セル）：クリスタル画像がある場合は画像が背景を担う
    if (getSoilCrystalSrc(adjacentRed, adjacentBlue)) {
      return {};
    }
    const color = getCellColor(adjacentRed, adjacentBlue);
    return { backgroundColor: rgbToString(color) };
  };

  // アニメーションクラス
  const getAnimationClass = (): string => {
    if (!masked && state === "exploded") return "bomb-explode";
    return "";
  };

  const renderContent = () => {
    // マスク時：何も表示しない
    if (masked) return null;

    // 答え合わせ中：爆弾を表示
    if (showBomb && hasBomb) {
      return <Icon name={bombType === "red" ? "bomb-red" : "bomb-blue"} size="lg" />;
    }

    switch (state) {
      case "hidden": {
        const grassVariant = getGrassVariant(row, col);
        return (
          <img
            src={`/assets/cells/grass-${grassVariant}.png`}
            alt=""
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: GRASS_W,
              height: GRASS_H,
              imageRendering: "pixelated",
            }}
          />
        );
      }
      case "flagged": {
        const grassVariant = getGrassVariant(row, col);
        return (
          <img
            src={`/assets/cells/grass-flag-${grassVariant}.png`}
            alt=""
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: GRASS_FLAG_W,
              height: GRASS_FLAG_H,
              maxWidth: "none", // Tailwind preflight の max-width: 100% を上書き
              imageRendering: "pixelated",
            }}
          />
        );
      }
      case "exploded":
        return <Icon name={bombType === "red" ? "bomb-red" : "bomb-blue"} size="lg" />;
      case "revealed":
        if (hasBomb) {
          return <Icon name={bombType === "red" ? "bomb-red" : "bomb-blue"} size="lg" />;
        }
        if (adjacentRed === 0 && adjacentBlue === 0) {
          const soilVariant = getSoilVariant(row, col);
          return (
            <img
              src={`/assets/cells/soil-${soilVariant}.png`}
              alt=""
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: GRASS_W,
                height: GRASS_W,
                imageRendering: "pixelated",
              }}
            />
          );
        }
        // クリスタル画像がある場合は表示、なければ色背景のみ（フォールバック）
        const crystalSrc = getSoilCrystalSrc(adjacentRed, adjacentBlue);
        if (crystalSrc) {
          return (
            <img
              src={crystalSrc}
              alt=""
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: GRASS_W,
                height: GRASS_W,
                imageRendering: "pixelated",
              }}
            />
          );
        }
        return null;
      default:
        return null;
    }
  };

  return (
    <div
      className={`flex items-center justify-center transition-colors ${getAnimationClass()}`}
      style={{
        position: "relative",
        width: "var(--cell-size)",
        height: "var(--cell-size)",
        borderRadius: "var(--radius)",
        overflow: "visible",
        zIndex: row * GRID_SIZE + (GRID_SIZE - col),
        ...getCellStyle(),
      }}
    >
      {renderContent()}
    </div>
  );
}
