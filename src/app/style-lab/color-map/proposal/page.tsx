import Link from "next/link";
import {
  MAX_ADJACENT,
  allProposedColors,
  proposedColor,
  rankedPairs,
  type ProposedColor,
} from "@/lib/color-proposal";
import { getIceAsset } from "@/lib/tile-assets";
import styles from "./proposal.module.css";

export const metadata = {
  title: "色マッピング再設計案 | Gradient Sweeper",
};

/** これを下回ると小さい面積では見分けが厳しい、という目安 */
const HARD_THRESHOLD = 0.062;
/** 見分けづらいペアとして列挙する件数 */
const PAIR_LIMIT = 18;

function Swatch({
  color,
  size = 36,
  label,
}: {
  color: ProposedColor;
  size?: number;
  label?: string;
}) {
  return (
    <span
      className={styles.swatch}
      style={{ background: color.hex, width: size, height: size }}
      title={`R${color.red} B${color.blue} / ${color.hex}`}
    >
      {label && <em>{label}</em>}
    </span>
  );
}

export default function ProposalPage() {
  const colors = allProposedColors();
  const pairs = rankedPairs(colors);
  const hardPairs = pairs.filter((pair) => pair.distance < HARD_THRESHOLD);
  const uniqueCount = new Set(colors.map((color) => color.hex)).size;

  const byTotal = Array.from({ length: MAX_ADJACENT + 1 }, (_, total) =>
    colors.filter((color) => color.red + color.blue === total),
  );

  // 現行ロジックで最も多くの状態が潰れているアセットを、実装から導出する。
  // どの組み合わせが該当するかを手で書かないことで、写像を変えても正しいままになる。
  const currentAsset = (color: ProposedColor) =>
    getIceAsset(color.red, color.blue, 0, 0).replace(/^.*\/|\.png$/g, "");

  const worstAsset = [...new Set(colors.map(currentAsset))]
    .map((asset) => ({ asset, states: colors.filter((c) => currentAsset(c) === asset) }))
    .sort((a, b) => b.states.length - a.states.length)[0];

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.panel}>
          <div className={styles.headline}>
            <span className={styles.snowflake} aria-hidden="true">
              ❄
            </span>
            <span>
              <strong>COLOR MAP — PROPOSAL</strong>
              <small>45 STATES / 45 COLORS</small>
            </span>
          </div>
          <p className={styles.lede}>
            45通りの隣接状態すべてに<strong>異なる色</strong>を割り当てた案です。
            まだ盤面には適用していません。この表を見て、
            それでも見分けづらい組み合わせを拾い出すのが目的です。
          </p>
          <ul className={styles.stats}>
            <li>
              <b>{colors.length}</b>
              <span>隣接パターン</span>
            </li>
            <li>
              <b>{uniqueCount}</b>
              <span>異なる色（重複なし）</span>
            </li>
            <li>
              <b>{pairs[0].distance.toFixed(3)}</b>
              <span>最も近いペアの知覚差</span>
            </li>
            <li>
              <b>{hardPairs.length}</b>
              <span>要検討のペア</span>
            </li>
          </ul>
        </header>

        <section className={styles.panel}>
          <div className={styles.sectionHeading}>
            <span>考え方</span>
            <small>2 AXES</small>
          </div>
          <p className={styles.note}>
            赤の数と青の数という<strong>2つの独立した量</strong>を、
            混ざらない2つの見え方に振り分けています。
          </p>
          <ul className={styles.axisList}>
            <li>
              <b>色味 = 赤と青の比率</b>
              <span>
                純青 → 紫 → 純赤。比率が同じなら、合計数が変わっても色味は変わりません。
                「どちらに寄っているか」だけを表します。
              </span>
              <div className={styles.axisRamp}>
                {byTotal[MAX_ADJACENT].map((color) => (
                  <Swatch key={`hue-${color.red}`} color={color} size={30} />
                ))}
              </div>
            </li>
            <li>
              <b>明るさ = 合計数</b>
              <span>
                合計が増えるほど暗く・鮮やかになります。危険度がそのまま「濃さ」になります。
              </span>
              <div className={styles.axisRamp}>
                {byTotal.map((row, total) => (
                  <Swatch key={`light-${total}`} color={row[row.length - 1]} size={30} />
                ))}
              </div>
            </li>
          </ul>
          <p className={styles.note}>
            計算は OKLCH（知覚均等な色空間）で行っています。
            HSL と違い色相を変えても明るさの見え方がずれないので、
            <strong>同じ合計数の色は必ず同じ暗さに見えます</strong>。
            「暗さで危険度、色味で内訳」という読み方が成立します。
          </p>
        </section>

        <section className={styles.panel}>
          <div className={styles.sectionHeading}>
            <span>対応表</span>
            <small>R = RED / B = BLUE</small>
          </div>
          <p className={styles.note}>
            行 R が赤の数、列 B が青の数。空欄は9x9盤面では起こらない組み合わせです。
            どのマスも他と違う色になっています。
          </p>
          <div className={styles.scroller}>
            <div className={styles.matrix}>
              <span className={styles.axis} aria-hidden="true" />
              {Array.from({ length: MAX_ADJACENT + 1 }, (_, blue) => (
                <span key={`h${blue}`} className={styles.axis}>
                  B{blue}
                </span>
              ))}
              {Array.from({ length: MAX_ADJACENT + 1 }, (_, red) => (
                <MatrixRow key={`r${red}`} red={red} />
              ))}
            </div>
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.sectionHeading}>
            <span>隣り合わせた比較</span>
            <small>NO GAP / 36PX</small>
          </div>
          <p className={styles.note}>
            盤面は隙間なしで敷き詰められるので、実際の判別はこの状態で起きます。
            <strong>1行が「合計数が同じ」グループ</strong>で、左が青寄り、右が赤寄りです。
            行の中で隣同士が見分けられるかが、この案の要になります。
          </p>
          <div className={styles.scroller}>
            <div className={styles.totalRows}>
              {byTotal.map((row, total) => (
                <div key={total} className={styles.totalRow}>
                  <span className={styles.totalLabel}>{total}個</span>
                  <div className={styles.rowStrip}>
                    {row.map((color) => (
                      <Swatch
                        key={`${color.red}-${color.blue}`}
                        color={color}
                        label={`${color.red}/${color.blue}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className={styles.note}>
            下は逆向きの見方で、<strong>比率が同じまま合計数だけ増える</strong>列です。
            左端が1個、右端が8個。
          </p>
          <div className={styles.scroller}>
            <div className={styles.totalRows}>
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>純青</span>
                <div className={styles.rowStrip}>
                  {Array.from({ length: MAX_ADJACENT }, (_, i) => (
                    <Swatch key={i} color={proposedColor(0, i + 1)} label={`0/${i + 1}`} />
                  ))}
                </div>
              </div>
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>純赤</span>
                <div className={styles.rowStrip}>
                  {Array.from({ length: MAX_ADJACENT }, (_, i) => (
                    <Swatch key={i} color={proposedColor(i + 1, 0)} label={`${i + 1}/0`} />
                  ))}
                </div>
              </div>
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>半々</span>
                <div className={styles.rowStrip}>
                  {[1, 2, 3, 4].map((n) => (
                    <Swatch key={n} color={proposedColor(n, n)} label={`${n}/${n}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.sectionHeading}>
            <span>見分けづらいペア</span>
            <small>SORTED BY ΔE</small>
          </div>
          <p className={styles.note}>
            全 {pairs.length} 通りのペアの知覚差を計算し、近い順に並べたものです。
            数値は OKLab 上の距離で、<strong>0.02 前後が識別限界</strong>、
            0.05 を下回ると小さい面積では厳しくなります。
            2色は実際の盤面と同じく隙間なしで並べてあります。
            <strong>ここを見て「これは無理」というものを教えてください。</strong>
          </p>
          <div className={styles.pairs}>
            {pairs.slice(0, PAIR_LIMIT).map((pair) => (
              <article key={`${pair.a.red}${pair.a.blue}-${pair.b.red}${pair.b.blue}`} className={styles.pair}>
                <div className={styles.pairSwatches}>
                  <Swatch color={pair.a} size={44} />
                  <Swatch color={pair.b} size={44} />
                </div>
                <div className={styles.pairMeta}>
                  <span className={styles.pairStates}>
                    R{pair.a.red}B{pair.a.blue} ／ R{pair.b.red}B{pair.b.blue}
                  </span>
                  <span className={styles.pairDelta}>{pair.distance.toFixed(3)}</span>
                </div>
              </article>
            ))}
          </div>
          <p className={styles.note}>
            上位はすべて合計7〜8個の高密度帯です。爆弾が多いほど色相の刻みが細かくなるためで、
            ここが構造的な弱点になります。改善するなら、
            高密度帯だけ明るさにも差をつける、色以外の手がかり（模様や粒）を足す、
            といった調整が候補になります。
          </p>
        </section>

        <section className={styles.panel}>
          <div className={styles.sectionHeading}>
            <span>現行との違い</span>
            <small>BEFORE / AFTER</small>
          </div>
          <p className={styles.note}>
            現行は45状態が11種類のタイルに潰れていました。
            最も潰れているのが <code>{worstAsset.asset}</code> で、
            <strong>{worstAsset.states.length}通りの状態を1枚で表しています</strong>。
            この案では該当箇所が全部別の色になります。
          </p>
          <div className={styles.beforeAfter}>
            <div>
              <span className={styles.baLabel}>
                現行 — この{worstAsset.states.length}状態がすべて同じ絵
              </span>
              <div className={styles.rowStrip}>
                {worstAsset.states.map((color) => (
                  <span
                    key={`old-${color.red}-${color.blue}`}
                    className={styles.swatch}
                    style={{ background: "#b03a3a", width: 36, height: 36 }}
                  >
                    <em>
                      {color.red}/{color.blue}
                    </em>
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className={styles.baLabel}>提案 — 同じ{worstAsset.states.length}状態</span>
              <div className={styles.rowStrip}>
                {worstAsset.states.map((color) => (
                  <Swatch
                    key={`new-${color.red}-${color.blue}`}
                    color={color}
                    label={`${color.red}/${color.blue}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className={styles.links}>
          <Link href="/style-lab/tile-masks" className={styles.nextLink}>
            下絵に色を乗せた実物を見る →
          </Link>
          <Link href="/style-lab/color-map" className={styles.backLink}>
            ← 現行の対応表
          </Link>
          <Link href="/style-lab" className={styles.backLink}>
            スタイルラボ
          </Link>
        </div>
      </div>
    </main>
  );
}

function MatrixRow({ red }: { red: number }) {
  return (
    <>
      <span className={styles.axis}>R{red}</span>
      {Array.from({ length: MAX_ADJACENT + 1 }, (_, blue) => {
        if (red + blue > MAX_ADJACENT) {
          return <span key={blue} className={styles.void} aria-hidden="true" />;
        }

        const color = proposedColor(red, blue);

        return (
          <span key={blue} className={styles.matrixCell}>
            <Swatch color={color} />
            <em>{color.hex}</em>
          </span>
        );
      })}
    </>
  );
}
