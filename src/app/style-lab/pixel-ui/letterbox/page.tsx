/*
 * 「固定キャンバス＋レターボックス」方式の検討用ページ（タスクG）。
 * 4案とも仕組み（canvas.module.css / CanvasHome.tsx）は共通で、
 * 余白の塗り方だけを変えている。本番の pixel-ui.module.css には触れていない。
 */

import type { Metadata } from "next";
import Link from "next/link";
import { LETTERBOX_VARIANTS } from "./variants";
import { SEEDS } from "./seed-data";
import styles from "../pixel-ui.module.css";

export const metadata: Metadata = {
  title: "固定キャンバス比較 | Gradient Sweeper",
  robots: { index: false, follow: false },
};

export default function LetterboxComparePage() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.panel}>
          <div className={styles.headline}>
            <span className={styles.snowflake} aria-hidden="true">
              ❄
            </span>
            <span>
              <strong>FIXED CANVAS + LETTERBOX</strong>
              <small>タスクG / 余白の塗り方を選ぶ</small>
            </span>
          </div>

          <p className={styles.lede}>
            背景ワールドをビューポート追従カメラで見せる今の方式をやめ、
            <strong>390x844の固定キャンバス</strong>を1つ作って、実ビューポートに
            <code>contain</code>相当で収め、余った分を余白として塗る方式です。
            仕組みはJS無しでCSSの<code>transform: scale()</code>だけで作っています。
          </p>
          <p className={styles.lede}>
            4案とも中身（キャンバスの寸法・背景ワールド・パネル）は同一で、
            <strong>余白の塗り方だけ</strong>が違います。各案の「実ビューポートで見る」から、
            <strong>ブラウザの横幅を狭めたり、実機を横に倒したりして</strong>余白の出方を確認してください。
            右上の「はみ出しテスト」で、キャンバスの高さを超える内容がどう扱われるか
            （キャンバス内でスクロールする）も見られます。
          </p>
          <p className={styles.lede}>
            <strong>余白は黒べたに決定済みです。</strong>
            以下の4案は決定までの比較記録として残していますが、
            以降の検討は <Link href="/style-lab/pixel-ui/letterbox/seeds/1">背景モチーフのシード比較</Link> の方です。
          </p>
          <p className={styles.lede}>
            このページ自体は検証用の使い捨てです。方向性が決まった時点で削除し、
            本番の <code>PixelScene</code>・<code>pixel-ui.module.css</code>・
            背景ワールド生成スクリプトを作り直します。
          </p>

          <div className={styles.actionRow}>
            <Link href="/style-lab/pixel-ui" className={styles.labLink}>
              ← ピクセルUI方向性比較へ
            </Link>
            <Link href="/style-lab" className={styles.labLink}>
              style-lab トップ →
            </Link>
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.sectionHeading}>
            <span>背景モチーフのシード比較</span>
            <small>余白=黒べた固定 / 5パターン</small>
          </div>
          <p className={styles.summary}>
            同じ配置ルール（島単位で組む・最小すきま15px・パネルにクリスタルを重ねない等）を、
            乱数のシードだけ変えて5パターン生成しました。キャンバスが390x844に固定されたことで、
            UIパネルの位置も1つに決まり、機種ごとの帯分けが不要になっています。
          </p>
          <div className={styles.actionRow}>
            {SEEDS.map((seed) => (
              <Link
                key={seed.id}
                href={`/style-lab/pixel-ui/letterbox/seeds/${seed.id}`}
                className={styles.labLink}
              >
                {seed.label} →
              </Link>
            ))}
          </div>
        </section>

        {LETTERBOX_VARIANTS.map((variant) => (
          <section key={variant.id} className={styles.panel}>
            <div className={styles.sectionHeading}>
              <span>{variant.name}</span>
              <small>{variant.tagline}</small>
            </div>
            <p className={styles.summary}>{variant.description}</p>
            <div className={styles.actionRow}>
              <Link
                href={`/style-lab/pixel-ui/letterbox/${variant.id}`}
                className={styles.labLink}
              >
                {variant.name}を実ビューポートで見る →
              </Link>
              <Link
                href={`/style-lab/pixel-ui/letterbox/${variant.id}?tall=1`}
                className={styles.labLink}
              >
                はみ出しテスト →
              </Link>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
