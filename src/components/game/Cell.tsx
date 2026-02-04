"use client";

import { Cell as CellType } from "@/types/game";
import { getCellColor, rgbToString } from "@/lib/game-logic";
import { Icon } from "@/components/Icon";

interface CellProps {
  cell: CellType;
}

export function Cell({ cell }: CellProps) {
  const { state, adjacentRed, adjacentBlue, hasBomb, bombType } = cell;

  // スタイル計算
  const getCellStyle = (): React.CSSProperties => {
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

  const renderContent = () => {
    switch (state) {
      case "flagged":
        return <Icon name="flag" size="lg" />;
      case "exploded":
        return <Icon name={bombType === "red" ? "bomb-red" : "bomb-blue"} size="lg" />;
      case "revealed":
        // 爆弾があれば表示（通常は到達しないが念のため）
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
      className="flex items-center justify-center rounded transition-colors"
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
