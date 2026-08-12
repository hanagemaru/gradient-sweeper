"use client";

import { memo } from "react";
import Image from "next/image";
import { Icon } from "@/components/Icon";
import { Cell as CellType, GRID_SIZE } from "@/types/game";
import { ASSET_BASE, getSnowVariant } from "@/lib/tile-assets";
import { MAX_ADJACENT, proposedColor } from "@/lib/ice-colors";
import { maskAssetForTotal } from "@/lib/tile-masks";
import styles from "./Cell.module.css";

interface CellProps {
  cell: CellType;
  row: number;
  col: number;
  showBomb?: boolean;
  masked?: boolean;
}

/**
 * 爆弾が見えているセルの色。
 * パレットで最も濃い純色を使い、赤爆弾・青爆弾を最大限はっきり見せる。
 */
const BOMB_COLOR = {
  red: proposedColor(MAX_ADJACENT, 0).hex,
  blue: proposedColor(0, MAX_ADJACENT).hex,
} as const;

function CellComponent({ cell, row, col, showBomb = false, masked = false }: CellProps) {
  const { state, adjacentRed, adjacentBlue, hasBomb, bombType } = cell;
  const bombVisible = !masked && hasBomb && (showBomb || state === "exploded" || state === "revealed");
  const covered = !masked && !bombVisible && (state === "hidden" || state === "flagged");

  const classNames = [
    styles.cell,
    covered ? styles.covered : styles.opened,
    masked ? styles.masked : "",
    state === "exploded" ? "bomb-explode" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classNames}
      aria-label={state === "flagged" ? "flagged cell" : undefined}
    >
      {masked ? (
        <span className={styles.maskSurface} aria-hidden="true" />
      ) : covered ? (
        <>
          {row < GRID_SIZE - 1 && <span className={styles.snowCastShadow} aria-hidden="true" />}
          <Image
            src={`${ASSET_BASE}/snow-underlay.png`}
            alt=""
            width={36}
            height={38}
            className={styles.snowUnderlay}
            draggable={false}
            unoptimized
          />
          <Image
            src={`${ASSET_BASE}/snow-${getSnowVariant(row, col)}.png`}
            alt=""
            width={36}
            height={38}
            className={styles.snowTile}
            draggable={false}
            unoptimized
          />
          {state === "flagged" && (
            <Image
              src={`${ASSET_BASE}/flag-overlay.png`}
              alt="flag"
              width={18}
              height={22}
              className={styles.flagOverlay}
              draggable={false}
              unoptimized
            />
          )}
        </>
      ) : (
        <IceSurface
          adjacentRed={adjacentRed}
          adjacentBlue={adjacentBlue}
          bombType={bombVisible ? bombType : null}
        />
      )}
      {bombVisible && (
        <span className={styles.bombOverlay}>
          <Icon name={bombType === "red" ? "bomb-red" : "bomb-blue"} size="lg" />
        </span>
      )}
    </div>
  );
}

/**
 * 開いたセルの氷面。
 *
 * 背景色がパレットの色（隣接数を表す）、その上に下絵を overlay で重ねて質感を出す。
 * 下絵は平均が中間グレーになるよう作られているので、重ねても明るさは変わらない。
 * パレットは明るさで爆弾の合計数を表すので、この性質が前提になっている。
 */
function IceSurface({
  adjacentRed,
  adjacentBlue,
  bombType,
}: {
  adjacentRed: number;
  adjacentBlue: number;
  bombType: "red" | "blue" | null;
}) {
  const total = adjacentRed + adjacentBlue;
  const background = bombType ? BOMB_COLOR[bombType] : proposedColor(adjacentRed, adjacentBlue).hex;
  const mask = maskAssetForTotal(bombType ? MAX_ADJACENT : total);

  return (
    <span className={styles.iceSurface} style={{ background }}>
      <Image
        src={mask}
        alt=""
        width={36}
        height={36}
        className={styles.iceDetail}
        draggable={false}
        unoptimized
      />
    </span>
  );
}

/**
 * 盤面は81セルあり、タイマーやスコアの更新のたびに全セルが再描画されると重い。
 * セルの見た目は下記の props だけで決まるので、変化がなければ描画を省く。
 */
export const Cell = memo(CellComponent, (prev, next) => {
  return (
    prev.cell === next.cell &&
    prev.row === next.row &&
    prev.col === next.col &&
    prev.showBomb === next.showBomb &&
    prev.masked === next.masked
  );
});
