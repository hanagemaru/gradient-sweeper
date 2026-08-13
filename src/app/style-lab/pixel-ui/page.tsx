/*
 * レーンB（ゲーム画面以外のピクセル化）の方向性比較ページ。
 *
 * 3案を同じモック画面で並べ、ユーザーが1つ選べるようにするためだけのページ。
 * 方向性が決まったら、このディレクトリごと削除して本実装に移る。
 * 既存ページ・共有ファイルには一切手を入れていない。
 */

import type { Metadata } from "next";
import Link from "next/link";
import { SCREENS } from "./MockScreens";
import { DIRECTIONS } from "./directions";
import styles from "./pixel-ui.module.css";

export const metadata: Metadata = {
  title: "ピクセルUI 方向性比較 | Gradient Sweeper",
  robots: { index: false, follow: false },
};

export default function PixelUiComparePage() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.panel}>
          <div className={styles.headline}>
            <span className={styles.snowflake} aria-hidden="true">
              ❄
            </span>
            <span>
              <strong>PIXEL UI DIRECTIONS</strong>
              <small>LANE B / CHOOSE ONE</small>
            </span>
          </div>

          <p className={styles.lede}>
            ホーム・難易度選択・リザルト・ランキングを、ゲーム画面と同じ世界観に揃えるための
            <strong>方向性の比較ページ</strong>です。3案とも中身のマークアップは同一で、
            当たっているCSSだけが違います。構造ではなく<strong>見た目の方向</strong>だけを見比べてください。
          </p>
          <p className={styles.lede}>
            各案の「実寸で見る」から、スマホ幅の実サイズで4画面を通して確認できます。
            <strong>1案選んでいただければ</strong>、そこから共通のピクセルUIコンポーネント
            （ボタン・パネル・モーダル）を先に作り、各ページを置き換えます。
          </p>
          <p className={styles.lede}>
            なお、このページ自体は検証用の使い捨てです。方向性が決まった時点で削除します。
            ゲーム画面と共有ファイル（<strong>Icon.tsx / globals.css</strong>）には触れていないので、
            <strong>盤面の見た目は変わりません</strong>。
          </p>

          <div className={styles.actionRow}>
            <Link href="/game" className={styles.labLink}>
              ゲーム画面と見比べる →
            </Link>
            <Link href="/style-lab" className={styles.labLink}>
              style-lab トップ →
            </Link>
          </div>
        </section>

        {DIRECTIONS.map((direction) => (
          <section key={direction.id} className={styles.panel}>
            <div className={styles.sectionHeading}>
              <span>{direction.name}</span>
              <small>{direction.tagline}</small>
            </div>

            <p className={styles.summary}>{direction.summary}</p>

            <div className={styles.judgeGrid}>
              <div className={styles.judgeCol}>
                <h3>効くところ</h3>
                <ul>
                  {direction.strengths.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className={`${styles.judgeCol} ${styles.riskCol}`}>
                <h3>引き受けることになる点</h3>
                <ul>
                  {direction.risks.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className={styles.frameRow}>
              {SCREENS.map(({ id, label, Component }) => (
                <div key={id} className={styles.frame}>
                  <span className={styles.frameLabel}>{label}</span>
                  <div className={styles.frameBody}>
                    <Component s={direction.styles} />
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.actionRow}>
              <Link href={`/style-lab/pixel-ui/${direction.id}`} className={styles.labLink}>
                {direction.name}を実寸で見る →
              </Link>
            </div>
          </section>
        ))}

        <section className={styles.panel}>
          <div className={styles.sectionHeading}>
            <span>選んだあとの進め方</span>
            <small>NEXT STEP</small>
          </div>
          <p className={styles.lede}>
            どの案でも、最初に作るものは同じです。<strong>PixelPanel・PixelButton・PixelModal</strong>
            の3つを共通コンポーネントとして立て、ホーム → 難易度選択 → リザルト → ランキングの順に
            置き換えます。ページごとに個別CSSを書き足す形は取りません。
          </p>
          <div className={styles.actionRow}>
            <Link href="/" className={styles.labLink}>
              ← ホームへ
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
