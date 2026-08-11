"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ASSET_BASE } from "@/lib/tile-assets";
import styles from "./color-map.module.css";

export interface AdjacencyState {
  red: number;
  blue: number;
  asset: string;
}

interface Props {
  states: AdjacencyState[];
  unusedAssets: string[];
}

const MAX_ADJACENT = 8;

/** 実寸。盤面のセルと同じ大きさ */
const NATIVE_PX = 36;
/** 拡大表示。ピクセルを保つため整数倍のみ */
const ZOOM_PX = 108;

/** 同じ絵を共有している状態数の段階。濃いほど情報が失われている */
function severityOf(sharedCount: number): 0 | 1 | 2 | 3 {
  if (sharedCount === 1) return 0;
  if (sharedCount <= 2) return 1;
  if (sharedCount <= 9) return 2;
  return 3;
}

function shortName(asset: string): string {
  return asset.replace(/^ice-/, "");
}

function Tile({ asset, size }: { asset: string; size: number }) {
  return (
    <Image
      src={`${ASSET_BASE}/${asset}.png`}
      alt=""
      width={size}
      height={size}
      className={styles.tile}
      style={{ width: size, height: size }}
      draggable={false}
      unoptimized
    />
  );
}

export function ColorMapExplorer({ states, unusedAssets }: Props) {
  const [picked, setPicked] = useState<string | null>(null);

  /** アセット名 -> それが表す隣接状態の一覧 */
  const groups = useMemo(() => {
    const map = new Map<string, AdjacencyState[]>();
    for (const state of states) {
      const list = map.get(state.asset);
      if (list) {
        list.push(state);
      } else {
        map.set(state.asset, [state]);
      }
    }
    return map;
  }, [states]);

  /** (赤, 青) -> アセット名。表の描画用 */
  const byPair = useMemo(() => {
    const map = new Map<string, string>();
    for (const state of states) {
      map.set(`${state.red}-${state.blue}`, state.asset);
    }
    return map;
  }, [states]);

  /** 兼用の多い順。情報の欠落が大きいものから見せる */
  const rankedGroups = useMemo(
    () => [...groups.entries()].sort((a, b) => b[1].length - a[1].length),
    [groups],
  );

  const worstSharedCount = rankedGroups[0]?.[1].length ?? 0;

  /**
   * 純色の濃さの段階。赤の濃い側から白を経て青の濃い側へ並べる。
   * プレイヤーが読み取ることを期待されている「濃さの連続性」がここに出る。
   */
  const pureRamp = useMemo(() => {
    const reds: string[] = [];
    const blues: string[] = [];
    for (let n = MAX_ADJACENT; n >= 1; n -= 1) {
      const asset = byPair.get(`${n}-0`);
      if (asset && !reds.includes(asset)) reds.push(asset);
    }
    for (let n = 1; n <= MAX_ADJACENT; n += 1) {
      const asset = byPair.get(`0-${n}`);
      if (asset && !blues.includes(asset)) blues.push(asset);
    }
    const clear = byPair.get("0-0");
    return [...reds, ...(clear ? [clear] : []), ...blues];
  }, [byPair]);

  /** 実際に描画される混色タイルのみ */
  const mixRamp = useMemo(
    () =>
      [...groups.keys()]
        .filter((asset) => asset.startsWith("ice-mix-"))
        .sort(),
    [groups],
  );

  const toggle = useCallback((asset: string) => {
    setPicked((current) => (current === asset ? null : asset));
  }, []);

  useEffect(() => {
    if (!picked) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPicked(null);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [picked]);

  const pickProps = (asset: string) => ({
    "data-picked": picked === asset ? "on" : picked ? "off" : undefined,
    onClick: () => toggle(asset),
    onKeyDown: (event: React.KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggle(asset);
      }
    },
    role: "button" as const,
    tabIndex: 0,
  });

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.panel}>
          <div className={styles.headline}>
            <span className={styles.snowflake} aria-hidden="true">
              ❄
            </span>
            <span>
              <strong>ICE COLOR MAP</strong>
              <small>ADJACENCY → TILE</small>
            </span>
          </div>
          <p className={styles.lede}>
            隣接する赤爆弾・青爆弾の数から、どの氷タイルが選ばれるかの全パターン。
            盤面と同じ <code>getIceAsset()</code> を総当たりで呼んで生成しているので、
            ロジックを変更すればこの画面も自動で変わります。
          </p>
          <ul className={styles.stats}>
            <li>
              <b>{states.length}</b>
              <span>ありうる隣接パターン</span>
            </li>
            <li>
              <b>{groups.size}</b>
              <span>実際に使われるタイル</span>
            </li>
            <li>
              <b>{worstSharedCount}</b>
              <span>最も兼用が多いタイルの状態数</span>
            </li>
            <li>
              <b>{unusedAssets.length}</b>
              <span>一度も描画されないタイル</span>
            </li>
          </ul>
        </header>

        {picked && (
          <div className={styles.pickedBar} role="status">
            <span className={styles.pickedName}>{shortName(picked)}</span>
            <span className={styles.pickedCount}>
              {groups.get(picked)?.length ?? 0} 状態が共有
            </span>
            <button
              type="button"
              className={styles.pickedClear}
              onClick={() => setPicked(null)}
            >
              解除
            </button>
          </div>
        )}

        <section className={styles.panel} aria-labelledby="ramp-title">
          <div className={styles.sectionHeading}>
            <span id="ramp-title">1. 隣り合わせた実サイズ比較</span>
            <small>36PX NATIVE</small>
          </div>
          <p className={styles.note}>
            盤面は隙間なしで敷き詰められるので、プレイ中は常にこの状態で見分けることになります。
            上段が実寸、下段が3倍。隣同士が区別できるかどうかをここで判断してください。
            タイルをタップすると、下の表のどこに出てくるかがハイライトされます。
          </p>

          <p className={styles.rampCaption}>赤 ← → 青（純色の濃さの段階）</p>
          <div className={styles.scroller}>
            <div className={styles.ramp}>
              {pureRamp.map((asset) => (
                <span key={asset} className={styles.rampCell} {...pickProps(asset)}>
                  <Tile asset={asset} size={NATIVE_PX} />
                  <em>{shortName(asset)}</em>
                </span>
              ))}
            </div>
          </div>
          <div className={styles.scroller}>
            <div className={styles.ramp}>
              {pureRamp.map((asset) => (
                <span key={asset} className={styles.rampCell} {...pickProps(asset)}>
                  <Tile asset={asset} size={ZOOM_PX} />
                </span>
              ))}
            </div>
          </div>

          <p className={styles.rampCaption}>混色（実際に描画されるもの）</p>
          <div className={styles.scroller}>
            <div className={styles.ramp}>
              {mixRamp.map((asset) => (
                <span key={asset} className={styles.rampCell} {...pickProps(asset)}>
                  <Tile asset={asset} size={ZOOM_PX} />
                  <em>{shortName(asset)}</em>
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.panel} aria-labelledby="matrix-title">
          <div className={styles.sectionHeading}>
            <span id="matrix-title">2. 対応表</span>
            <small>R = RED / B = BLUE</small>
          </div>
          <p className={styles.note}>
            行 R が隣接する赤爆弾の数、列 B が青爆弾の数。空欄は9x9盤面では起こらない組み合わせ。
            背景の濃さは「同じ絵を何通りの状態が共有しているか」を表します。濃いほど情報が失われています。
          </p>
          <ul className={styles.legend}>
            <li>
              <i data-sev="0" />1状態のみ
            </li>
            <li>
              <i data-sev="1" />2状態
            </li>
            <li>
              <i data-sev="2" />3〜9状態
            </li>
            <li>
              <i data-sev="3" />10状態以上
            </li>
          </ul>

          <div className={styles.scroller}>
            <div className={styles.matrix}>
              <span className={styles.axis} aria-hidden="true" />
              {Array.from({ length: MAX_ADJACENT + 1 }, (_, blue) => (
                <span key={`head-${blue}`} className={styles.axis}>
                  B{blue}
                </span>
              ))}

              {Array.from({ length: MAX_ADJACENT + 1 }, (_, red) => (
                <ExplorerRow
                  key={`row-${red}`}
                  red={red}
                  byPair={byPair}
                  groups={groups}
                  pickProps={pickProps}
                />
              ))}
            </div>
          </div>
        </section>

        <section className={styles.panel} aria-labelledby="collision-title">
          <div className={styles.sectionHeading}>
            <span id="collision-title">3. 情報が失われている箇所</span>
            <small>SHARED STATES</small>
          </div>
          <p className={styles.note}>
            1枚のタイルが何通りの隣接状態を表しているかを、多い順に並べたもの。
            同じ枠に入っている組み合わせは、プレイヤーから見てまったく区別がつきません。
          </p>
          <div className={styles.groups}>
            {rankedGroups.map(([asset, list]) => (
              <article
                key={asset}
                className={styles.group}
                data-sev={severityOf(list.length)}
                {...pickProps(asset)}
              >
                <Tile asset={asset} size={NATIVE_PX * 2} />
                <div className={styles.groupBody}>
                  <div className={styles.groupTop}>
                    <span className={styles.groupName}>{shortName(asset)}</span>
                    <span className={styles.groupCount}>{list.length}</span>
                  </div>
                  <div className={styles.groupStates}>
                    {list.map((state) => (
                      <span key={`${state.red}-${state.blue}`}>
                        R{state.red} B{state.blue}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {unusedAssets.length > 0 && (
          <section className={styles.panel} aria-labelledby="unused-title">
            <div className={styles.sectionHeading}>
              <span id="unused-title">4. 一度も描画されないタイル</span>
              <small>NEVER RENDERED</small>
            </div>
            <p className={styles.note}>
              ファイルは存在するのに、現在のロジックではどの組み合わせでも選ばれないタイル。
              盤面の全座標・全隣接数を総当たりして、一度も返らなかったものを挙げています。
            </p>
            <div className={styles.unusedRow}>
              {unusedAssets.map((asset) => (
                <div key={asset} className={styles.unusedItem}>
                  <Tile asset={asset} size={ZOOM_PX} />
                  <em>{shortName(asset)}</em>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className={styles.links}>
          <Link href="/style-lab/color-map/proposal" className={styles.proposalLink}>
            45状態すべてを別の色にした再設計案を見る →
          </Link>
          <Link href="/style-lab" className={styles.backLink}>
            ← スタイルラボへ戻る
          </Link>
        </div>
      </div>
    </main>
  );
}

function ExplorerRow({
  red,
  byPair,
  groups,
  pickProps,
}: {
  red: number;
  byPair: Map<string, string>;
  groups: Map<string, AdjacencyState[]>;
  pickProps: (asset: string) => Record<string, unknown>;
}) {
  return (
    <>
      <span className={styles.axis}>R{red}</span>
      {Array.from({ length: MAX_ADJACENT + 1 }, (_, blue) => {
        const asset = byPair.get(`${red}-${blue}`);

        if (!asset) {
          return <span key={blue} className={styles.void} aria-hidden="true" />;
        }

        const shared = groups.get(asset)?.length ?? 1;

        return (
          <span
            key={blue}
            className={styles.matrixCell}
            data-sev={severityOf(shared)}
            title={`R${red} B${blue} → ${shortName(asset)}（${shared}状態が共有）`}
            {...pickProps(asset)}
          >
            <Tile asset={asset} size={NATIVE_PX} />
            <em>
              R{red} B{blue}
            </em>
          </span>
        );
      })}
    </>
  );
}
