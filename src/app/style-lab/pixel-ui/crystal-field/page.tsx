/*
 * CRYSTAL FIELD 案を実寸（スマホ幅）で通して見るページ。
 * A/B/C の比較ツールとは独立しており、本番ページには影響しない検証用。
 */

import Link from "next/link";
import "@fontsource/dotgothic16/japanese-400.css";
import {
  HomeScreen,
  TimeAttackSelectScreen,
  ResultScreen,
  RankingScreen,
  FontPreviewProvider,
} from "./CrystalFieldScreens";
import viewerStyles from "../pixel-ui.module.css";

export const metadata = {
  title: "CRYSTAL FIELD | ピクセルUI 方向性比較",
  robots: { index: false, follow: false },
};

/*
 * CrystalFieldScreens.tsx は "use client" なので、そこからエクスポートした
 * データ配列をこのサーバーコンポーネント側で map することはできない
 * （クライアント境界を越えると各エクスポートは JSX としてしか使えない不透明な参照になる）。
 * そのため4画面をここで直接 JSX として並べている。
 */
export default function CrystalFieldPage() {
  return (
    <main className={viewerStyles.fullPage}>
      <div className={viewerStyles.fullBar}>
        <span className={viewerStyles.fullBarTitle}>
          CRYSTAL FIELD
          <small>参考画像ベース</small>
        </span>
        <Link href="/style-lab/pixel-ui" className={viewerStyles.switchLink}>
          比較へ
        </Link>
        <Link href="/style-lab" className={viewerStyles.switchLink}>
          スタイルラボ
        </Link>
      </div>

      <FontPreviewProvider>
        <div className={viewerStyles.fullScreens}>
          <section className={viewerStyles.fullScreen} aria-label="ホーム">
            <span className={viewerStyles.fullScreenTag}>ホーム</span>
            <HomeScreen />
          </section>
          <section className={viewerStyles.fullScreen} aria-label="タイムアタック選択">
            <span className={viewerStyles.fullScreenTag}>タイムアタック選択</span>
            <TimeAttackSelectScreen />
          </section>
          <section className={viewerStyles.fullScreen} aria-label="リザルト">
            <span className={viewerStyles.fullScreenTag}>リザルト</span>
            <ResultScreen />
          </section>
          <section className={viewerStyles.fullScreen} aria-label="ランキング">
            <span className={viewerStyles.fullScreenTag}>ランキング</span>
            <RankingScreen />
          </section>
        </div>
      </FontPreviewProvider>
    </main>
  );
}
