"use client";

import Image from "next/image";
import { Icon } from "@/components/Icon";
import { Cell as CellType, GRID_SIZE } from "@/types/game";
import styles from "./Cell.module.css";

interface CellProps {
  cell: CellType;
  row: number;
  col: number;
  showBomb?: boolean;
  masked?: boolean;
}

type IceTone = "clear" | "red" | "blue" | "mix";

const ASSET_BASE = "/assets/frostbound/tiles-v5";

function getSnowVariant(row: number, col: number): 1 | 2 | 3 {
  return (((row * 7 + col * 3 + row * col) % 3) + 1) as 1 | 2 | 3;
}

function getIceAsset(
  adjacentRed: number,
  adjacentBlue: number,
  row: number,
  col: number,
  bombType?: "red" | "blue",
): string {
  if (bombType) {
    return `${ASSET_BASE}/ice-${bombType}-4.png`;
  }

  if (adjacentRed === 0 && adjacentBlue === 0) {
    const variant = ((row * 5 + col * 3) % 2) + 1;
    return `${ASSET_BASE}/ice-clear-${variant}.png`;
  }

  let tone: IceTone;
  if (adjacentBlue === 0 || adjacentRed >= adjacentBlue * 2) {
    tone = "red";
  } else if (adjacentRed === 0 || adjacentBlue >= adjacentRed * 2) {
    tone = "blue";
  } else {
    tone = "mix";
  }

  const level = Math.max(1, Math.min(4, adjacentRed + adjacentBlue));
  return `${ASSET_BASE}/ice-${tone}-${level}.png`;
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
