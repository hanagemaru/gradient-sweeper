import Link from "next/link";
import Image from "next/image";
import {
  MAX_ADJACENT,
  allProposedColors,
  proposedColor,
  type ProposedColor,
} from "@/lib/ice-colors";
import { MASK_BASE, maskAssetForTotal, maskLevelForTotal } from "@/lib/tile-masks";
import styles from "./tile-masks.module.css";

export const metadata = {
  title: "下絵とパレットの合成 | Gradient Sweeper",
};

/** 抽出した下絵。level ごとに、どれが同じ絵かを見比べられるよう全色相ぶん並べる */
const EXTRACTED = [
  { level: "clear", names: ["clear-1", "clear-2"] },
  { level: "1", names: ["red-1", "blue-1", "mix-1"] },
  { level: "2", names: ["red-2", "blue-2", "mix-2"] },
  { level: "3", names: ["red-3", "blue-3", "mix-3"] },
  { level: "4", names: ["red-4", "blue-4", "mix-4"] },
];

const BLEND_MODES = ["overlay", "multiply", "soft-light"] as const;

function Mask({ name, size = 108, boost = false }: { name: string; size?: number; boost?: boolean }) {
  return (
    <Image
      src={`${MASK_BASE}/${name}.png`}
      alt={name}
      width={size}
      height={size}
      className={boost ? styles.maskBoost : styles.mask}
      style={{ width: size, height: size }}
      draggable={false}
      unoptimized
    />
  );
}

/** 下絵 × パレット色。本番の盤面と同じ合成方法 */
function IceTile({
  color,
  size = 36,
  blend = "overlay",
  label,
}: {
  color: ProposedColor;
  size?: number;
  blend?: string;
  label?: string;
}) {
  const total = color.red + color.blue;

  return (
    <span
      className={styles.iceTile}
      style={{ background: color.hex, width: size, height: size }}
      title={`R${color.red} B${color.blue} / ${color.hex} / 下絵 ${maskLevelForTotal(total)}`}
    >
      <Image
        src={maskAssetForTotal(total)}
        alt=""
        width={size}
        height={size}
        className={styles.iceDetail}
        style={{ width: size, height: size, mixBlendMode: blend as "overlay" }}
        draggable={false}
        unoptimized
      />
      {label && <em>{label}</em>}
    </span>
  );
}

export default function TileMasksPage() {
  const colors = allProposedColors();
  const byTotal = Array.from({ length: MAX_ADJACENT + 1 }, (_, total) =>
    colors.filter((color) => color.red + color.blue === total),
  );

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.panel}>
          <div className={styles.headline}>
            <span className={styles.snowflake} aria-hidden="true">
              ❄
            </span>
            <span>
              <strong>TILE MASKS</strong>
              <small>BASE ART × PALETTE</small>
            </span>
          </div>
          <p className={styles.lede}>
            45色を45枚のPNGとして描くのではなく、
            <strong>下絵をグレースケールで持ち、色はコード側で塗る</strong>方式の検証です。
            アセットは5枚だけになり、色の微調整はコード変更だけで済みます。
          </p>
          <ul className={styles.stats}>
            <li>
              <b>5</b>
              <span>必要な下絵</span>
            </li>
            <li>
              <b>45</b>
              <span>表現できる状態</span>
            </li>
            <li>
              <b>1</b>
              <span>セルあたりの画像</span>
            </li>
          </ul>
        </header>

        <section className={styles.panel}>
          <div className={styles.sectionHeading}>
            <span>1. 抽出した下絵</span>
            <small>FROM TILES-V5</small>
          </div>
          <p className={styles.note}>
            既存の氷タイル14枚から明度成分だけを取り出したものです。
            <strong>同じ段の3枚がほぼ同じ絵</strong>なのが確認できます
            （level 4 は明度パターンが95〜99%一致）。
            つまり14枚は実質「4種類の下絵＋clear」を色違いにしたものでした。
            見やすくするためコントラストを強調して表示しています。
          </p>
          <div className={styles.scroller}>
            <div className={styles.maskRows}>
              {EXTRACTED.map((row) => (
                <div key={row.level} className={styles.maskRow}>
                  <span className={styles.maskLabel}>{row.level}</span>
                  {row.names.map((name) => (
                    <figure key={name} className={styles.maskItem}>
                      <Mask name={name} boost />
                      <figcaption>{name}</figcaption>
                    </figure>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <p className={styles.note}>
            本番ではこのうち色相の偏りが最も少ない <code>mix</code> 系を代表に選び、
            <code>canonical-clear</code> / <code>canonical-1</code> 〜 <code>canonical-4</code> の
            5枚だけを使います。各マスクは<strong>平均が中間グレー</strong>になるよう作ってあるので、
            重ねてもタイル全体の明るさは変わりません。パレットは明るさで爆弾の数を表す設計なので、
            ここがずれると設計が壊れます。
          </p>
        </section>

        <section className={styles.panel}>
          <div className={styles.sectionHeading}>
            <span>2. 下絵 × パレット</span>
            <small>45 STATES</small>
          </div>
          <p className={styles.note}>
            5枚の下絵に45色を乗せた結果です。行 R が赤の数、列 B が青の数。
            下絵は合計数を2段階ずつまとめて選んでいます（合計1〜2→下絵1、3〜4→下絵2、…）。
            <strong>下絵はだいたいの密度、色が正確な内訳</strong>を担います。
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
            <span>3. 敷き詰めた状態</span>
            <small>NO GAP / 36PX</small>
          </div>
          <p className={styles.note}>
            実際の盤面と同じく隙間なしで並べたもの。1行が「合計数が同じ」グループで、
            左が青寄り、右が赤寄りです。<strong>ここが実プレイでの見え方に一番近くなります。</strong>
          </p>
          <div className={styles.scroller}>
            <div className={styles.totalRows}>
              {byTotal.map((row, total) => (
                <div key={total} className={styles.totalRow}>
                  <span className={styles.totalLabel}>{total}個</span>
                  <div className={styles.rowStrip}>
                    {row.map((color) => (
                      <IceTile key={`${color.red}-${color.blue}`} color={color} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.sectionHeading}>
            <span>4. 合成方法の比較</span>
            <small>BLEND MODE</small>
          </div>
          <p className={styles.note}>
            同じ下絵と同じ色で、重ね方だけを変えたものです。
            <strong>overlay</strong> は明るさを保ったまま凹凸を乗せます。
            <strong>multiply</strong> は全体が暗くなるため、
            「明るさ＝爆弾の数」という対応がずれます。
            <strong>soft-light</strong> は overlay より控えめです。
          </p>
          <div className={styles.scroller}>
            <div className={styles.totalRows}>
              {BLEND_MODES.map((blend) => (
                <div key={blend} className={styles.totalRow}>
                  <span className={styles.blendLabel}>{blend}</span>
                  <div className={styles.rowStrip}>
                    {byTotal[MAX_ADJACENT].map((color) => (
                      <IceTile
                        key={`${blend}-${color.red}`}
                        color={color}
                        size={48}
                        blend={blend}
                      />
                    ))}
                  </div>
                </div>
              ))}
              <div className={styles.totalRow}>
                <span className={styles.blendLabel}>下絵なし</span>
                <div className={styles.rowStrip}>
                  {byTotal[MAX_ADJACENT].map((color) => (
                    <span
                      key={`flat-${color.red}`}
                      className={styles.iceTile}
                      style={{ background: color.hex, width: 48, height: 48 }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.sectionHeading}>
            <span>5. 盤面サンプル</span>
            <small>9 × 9</small>
          </div>
          <p className={styles.note}>
            開いた状態の盤面を想定したサンプルです。実寸36pxで敷き詰めています。
          </p>
          <div className={styles.scroller}>
            <div className={styles.board}>
              {SAMPLE_BOARD.flatMap((row, rowIndex) =>
                row.map(([red, blue], colIndex) => (
                  <IceTile
                    key={`${rowIndex}-${colIndex}`}
                    color={proposedColor(red, blue)}
                  />
                )),
              )}
            </div>
          </div>
        </section>

        <div className={styles.links}>
          <Link href="/style-lab/color-map/proposal" className={styles.backLink}>
            ← 色の対応表
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

        return (
          <span key={blue} className={styles.matrixCell}>
            <IceTile color={proposedColor(red, blue)} size={44} />
            <em>
              {red}/{blue}
            </em>
          </span>
        );
      })}
    </>
  );
}

/**
 * 盤面サンプルの隣接数。
 * 中央に赤の塊、右下に青の塊、その間に混色帯ができるよう手で組んだもの。
 */
const SAMPLE_BOARD: Array<Array<[number, number]>> = [
  [[0, 0], [0, 0], [1, 0], [2, 0], [2, 0], [1, 0], [0, 0], [0, 0], [0, 0]],
  [[0, 0], [1, 0], [3, 0], [4, 0], [4, 0], [3, 0], [1, 0], [0, 0], [0, 0]],
  [[1, 0], [3, 0], [5, 0], [6, 0], [5, 1], [4, 1], [2, 1], [1, 1], [0, 1]],
  [[1, 0], [4, 0], [6, 1], [7, 1], [5, 2], [3, 3], [2, 3], [1, 3], [0, 2]],
  [[1, 0], [3, 1], [4, 2], [4, 4], [3, 4], [2, 5], [1, 5], [1, 4], [0, 3]],
  [[0, 1], [1, 2], [2, 4], [2, 6], [1, 6], [1, 7], [0, 7], [0, 6], [0, 4]],
  [[0, 1], [0, 3], [1, 5], [1, 7], [0, 8], [0, 7], [0, 6], [0, 5], [0, 3]],
  [[0, 0], [0, 2], [0, 4], [0, 6], [0, 6], [0, 5], [0, 4], [0, 3], [0, 1]],
  [[0, 0], [0, 1], [0, 2], [0, 3], [0, 3], [0, 2], [0, 2], [0, 1], [0, 0]],
];
