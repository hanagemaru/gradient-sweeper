"use client";

import Image from "next/image";
import { Icon } from "@/components/Icon";
import { Cell as CellType, GRID_SIZE } from "@/types/game";
import { ASSET_BASE, getIceAsset, getSnowVariant } from "@/lib/tile-assets";
import styles from "./Cell.module.css";

interface CellProps {
  cell: CellType;
  row: number;
  col: number;
  showBomb?: boolean;
  masked?: boolean;
}

export function Cell({ cell, row, col, showBomb = false, masked = false }: CellProps) {
  const { state, adjacentRed, adjacentBlue, hasBomb, bombType } = cell;
  const bombVisible = !masked && hasBomb && (showBomb || state === "exploded" || state === "revealed");
  const covered = !masked && !bombVisible && (state === "hidden" || state === "flagged");
  const snowVariant = getSnowVariant(row, col);
  const iceAsset = getIceAsset(
    adjacentRed,
    adjacentBlue,
    row,
    col,
    bombVisible && bombType ? bombType : undefined,
  );

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
      style={{ zIndex: masked ? 4 : covered ? 3 : 1 }}
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
            src={`${ASSET_BASE}/snow-${snowVariant}.png`}
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
        <>
          <Image
            src={iceAsset}
            alt=""
            width={36}
            height={36}
            className={styles.iceTile}
            draggable={false}
            unoptimized
          />
          {bombVisible && (
            <span className={styles.bombOverlay}>
              <Icon name={bombType === "red" ? "bomb-red" : "bomb-blue"} size="lg" />
            </span>
          )}
        </>
      )}
    </div>
  );
}
