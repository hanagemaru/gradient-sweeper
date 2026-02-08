"use client";

import { Cell as CellType } from "@/types/game";
import { getCellColor, rgbToString } from "@/lib/game-logic";
import { Icon } from "@/components/Icon";

interface CellProps {
  cell: CellType;
  showBomb?: boolean;
}

export function Cell({ cell, showBomb = false }: CellProps) {
  const { state, adjacentRed, adjacentBlue, hasBomb, bombType } = cell;

  // スタイル計算
  const getCellStyle = (): React.CSSProperties => {
    // 答え合わせ中：爆弾セルをハイライト
    if (showBomb && hasBomb) {
      return {
        backgroundColor: bombType === "red" ? "#fca5a5" : "#93c5fd", // red-300 / blue-300
      };
    }

    if (state === "hidden" || state === "flagged") {
      return {
        backgroundColor: "#374151", // gray-700
      };
    }

    if (state === "exploded") {
      return {
        backgroundColor: "#ef4444", // red-500
      };
    }

    // revealed
    const color = getCellColor(adjacentRed, adjacentBlue);
    return {
      backgroundColor: rgbToString(color),
    };
  };
  
  // アニメーションクラス
  const getAnimationClass = (): string => {
    if (state === "exploded") {
      return "bomb-explode";
    }
    return "";
  };

  const renderContent = () => {
    // 答え合わせ中：爆弾を表示
    if (showBomb && hasBomb) {
      return <Icon name={bombType === "red" ? "bomb-red" : "bomb-blue"} size="lg" />;
    }

    switch (state) {
      case "flagged":
        return <Icon name="flag" size="lg" />;
      case "exploded":
        return <Icon name={bombType === "red" ? "bomb-red" : "bomb-blue"} size="lg" />;
      case "revealed":
        if (hasBomb) {
          return <Icon name={bombType === "red" ? "bomb-red" : "bomb-blue"} size="lg" />;
        }
        return null;
      default:
        return null;
    }
  };

  return (
    <div
      className={`flex items-center justify-center rounded transition-colors ${getAnimationClass()}`}
      style={{
        width: "var(--cell-size)",
        height: "var(--cell-size)",
        borderRadius: "var(--radius)",
        ...getCellStyle(),
      }}
    >
      {renderContent()}
    </div>
  );
}
